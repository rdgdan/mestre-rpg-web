// Sistema de Controle de Uso de Slots de Magia
// Gerencia slots usados, recuperação com descanso, e sincronização

import { Spell } from './spells-data';

export interface SpellSlotUsage {
  spellLevel: number;
  current: number; // Slots ainda disponíveis
  max: number;     // Total de slots
}

export interface SpellUsageRecord {
  timestamp: number;
  action: 'use' | 'rest-short' | 'rest-long' | 'change';
  details: string; // Ex: "Usou 2 slots de magia nível 3 em Bola de Fogo"
  characterId?: string;
}

// Tabela de Slots Padrão (Multiclasse / Full Casters)
const STANDARD_SLOTS_TABLE: Record<number, number[]> = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
  7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
};

// Tabela de Slots de Pacto (Bruxo)
const WARLOCK_SLOTS_TABLE: Record<number, number> = {
  1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 4, 18: 4, 19: 4, 20: 4
};

// Obter slots máximos para uma classe/nível (Suporte a Multiclasse)
export function getMaxSpellSlotsForCharacter(
  characterClass: string,
  characterLevel: number,
  classesConfig?: { name: string; level: number; subclass?: string }[]
): Record<string, number> {
  const result: Record<string, number> = { "0": Infinity };

  // Parsear classes e níveis
  let classes: { name: string; level: number; subclass?: string }[] = [];

  if (classesConfig && classesConfig.length > 0) {
    classes = classesConfig.map(c => ({ ...c, name: c.name.toLowerCase(), subclass: c.subclass?.toLowerCase() }));
  } else {
    // Modo Legado / Fallback
    if (characterClass.includes('/')) {
      characterClass.split('/').forEach(part => {
        const match = part.trim().match(/^(.+?)\s+(\d+)$/);
        if (match) {
          classes.push({ name: match[1].toLowerCase(), level: parseInt(match[2]) });
        } else {
          classes.push({ name: part.trim().toLowerCase(), level: 1 });
        }
      });
    } else {
      classes.push({ name: characterClass.toLowerCase(), level: characterLevel });
    }
  }

  // 1. Calcular Slots de Pacto (Bruxo)
  const warlockEntry = classes.find(c => c.name.includes('bruxo') || c.name.includes('warlock'));
  if (warlockEntry) {
    const warlockLevel = warlockEntry.level;
    const pactSlots = WARLOCK_SLOTS_TABLE[warlockLevel] || 0;
    if (pactSlots > 0) {
      result['pact'] = pactSlots;
      // Também mapear para o nível correspondente para facilitar busca
      const pactLevel = warlockLevel <= 2 ? 1 : (warlockLevel <= 4 ? 2 : (warlockLevel <= 6 ? 3 : (warlockLevel <= 8 ? 4 : 5)));
      result[`pactLevel`] = pactLevel;
    }
  }

  // 2. Calcular Slots Normais (Caster Level)
  let casterLevel = 0;

  classes.forEach(c => {
    const name = c.name.toLowerCase();
    if (['bardo', 'clérigo', 'druida', 'feiticeiro', 'mago'].some(n => name.includes(n))) {
      casterLevel += c.level;
    } else if (['paladino', 'ranger', 'patrulheiro'].some(n => name.includes(n))) {
      casterLevel += Math.floor(c.level / 2);
    } else if (name.includes('artífice') || name.includes('artificer')) {
      casterLevel += Math.ceil(c.level / 2);
    } else if (['guerreiro', 'ladino', 'monge', 'barbaro'].some(n => name.includes(n))) {
      if (c.subclass && (
        c.subclass.includes('arcano') || c.subclass.includes('eldritch') || c.subclass.includes('trapaceiro')
      )) {
        casterLevel += Math.floor(c.level / 3);
      }
    }
  });

  if (casterLevel > 0) {
    const slots = STANDARD_SLOTS_TABLE[casterLevel] || [];
    slots.forEach((count, idx) => {
      result[(idx + 1).toString()] = count;
    });
  }

  return result;
}

// Usar uma magia e descontar slots
export function consumeSpellSlot(
  spellSlots: Record<string, { current: number; max: number }>,
  spell: Spell,
  slotsCost: number = 1,
  pactLevel: number = 0
): Record<string, { current: number; max: number }> {
  const updated = { ...spellSlots };
  const spellLevel = spell.level !== undefined ? spell.level : 0;

  if (spellLevel === 0) {
    // Truques não gastam slots
    return updated;
  }

  const lvlKey = spellLevel.toString();

  // Tentar consumir slot normal do nível exato
  if (updated[lvlKey] && updated[lvlKey].current >= slotsCost) {
    updated[lvlKey] = {
      ...updated[lvlKey],
      current: Math.max(0, updated[lvlKey].current - slotsCost)
    };
    return updated;
  }

  // Se não encontrar slot normal, tenta usar slot de Pacto (Bruxo)
  // Nota: Bruxos usam slots de pacto para QUALQUER nível de magia até o nível do pacto
  if (updated['pact'] && spellLevel <= pactLevel && updated['pact'].current >= slotsCost) {
    updated['pact'] = {
      ...updated['pact'],
      current: Math.max(0, updated['pact'].current - slotsCost)
    };
  }

  return updated;
}

// Recuperar slots com descanso longo (full rest)
export function restLongSpells(
  characterClass: string,
  characterLevel: number,
  classesConfig?: { name: string; level: number; subclass?: string }[]
): Record<string, number> {
  return getMaxSpellSlotsForCharacter(characterClass, characterLevel, classesConfig);
}

// Recuperar alguns slots com descanso curto (apenas algumas classes)
export function restShortSpells(
  characterClass: string,
  characterLevel: number,
  currentSlots: Record<string, { current: number; max: number }>,
  classesConfig?: { name: string; level: number; subclass?: string }[]
): Record<string, { current: number; max: number }> {
  const maxSlots = getMaxSpellSlotsForCharacter(characterClass, characterLevel, classesConfig);
  const updated = { ...currentSlots };

  // Slots de Pacto recuperam no descanso curto
  if (maxSlots['pact'] !== undefined) {
    updated['pact'] = {
      current: maxSlots['pact'],
      max: maxSlots['pact']
    };
  }

  return updated;
}

// Calcular quantos slots uma magia precisa
export function getSpellSlotsCost(spell: Spell): number {
  if (spell.level === 0) return 0;
  return 1;
}

// Validar se pode usar uma magia
export function canUseSpell(
  spellSlots: Record<string, { current: number; max: number }>,
  spell: Spell,
  pactLevel: number = 0
): boolean {
  const spellLevel = spell.level !== undefined ? spell.level : 0;
  if (spellLevel === 0) return true;

  const cost = getSpellSlotsCost(spell);
  const lvlKey = spellLevel.toString();

  // 1. Verifica slots normais do nível
  if (spellSlots[lvlKey] && spellSlots[lvlKey].current >= cost) return true;

  // 2. Verifica slots de pacto (se o nível da magia permitir)
  if (spellSlots['pact'] && spellLevel <= pactLevel && spellSlots['pact'].current >= cost) return true;

  return false;
}

// Formatar status de slots para exibição
export function formatSpellSlotsDisplay(
  spellLevel: number,
  current: number,
  max: number
): string {
  if (spellLevel === 0) return '∞ Ilimitado';
  return `${current}/${max}`;
}

// Gerar mensagem de notificação para combate
export function generateSpellNotification(
  characterName: string,
  spell: Spell,
  slotsCost: number = 1
): string {
  if (spell.level === 0) {
    return `✨ ${characterName} conjurou ${spell.name} (Truque)`;
  }
  return `📖 ${characterName} usou ${slotsCost} slot(s) de magia nível ${spell.level} em ${spell.name}`;
}

export function generateRestNotification(characterName: string, restType: 'short' | 'long'): string {
  if (restType === 'long') {
    return `🌙 ${characterName} completou um descanso longo — Slots recuperados`;
  }
  return `⏰ ${characterName} completou um descanso curto`;
}

// Calcular limite de magias preparadas
export function getMaxPreparedSpells(
  characterClass: string,
  characterLevel: number,
  attributeMod: number
): number {
  // Regra geral: Nível + Modificador do Atributo de Conjuração
  // Mago (Int), Clérigo (Wis), Druida (Wis): Level + Mod
  // Paladino (Cha): (Level / 2) + Mod

  const className = characterClass.toLowerCase();

  if (className.includes('paladino')) {
    return Math.max(1, Math.floor(characterLevel / 2) + attributeMod);
  }

  // Artífice também prepara: (Level / 2) + Mod (arredondado pra baixo no preparo, diferente dos slots)
  if (className.includes('artífice') || className.includes('artificer')) {
    return Math.max(1, Math.floor(characterLevel / 2) + attributeMod);
  }

  // Magos, Clérigos, Druidas
  if (['mago', 'clérigo', 'druida'].some(c => className.includes(c))) {
    return Math.max(1, characterLevel + attributeMod);
  }

  return 0; // Classes que não preparam (Bardo, Bruxo, Feiticeiro, Ranger, etc)
}

// Verificar se a classe exige preparação de magias
export function requiresPreparation(characterClass: string): boolean {
  const className = characterClass.toLowerCase();
  return ['mago', 'clérigo', 'druida', 'paladino', 'artífice', 'artificer'].some(c => className.includes(c));
}

// Calcular limite da Recuperação Arcana (Mago)
export function calculateArcaneRecoveryLimit(wizardLevel: number): number {
  // Limite de níveis de magia recuperados = metade do nível de mago (arredondado para cima)
  return Math.ceil(wizardLevel / 2);
}
