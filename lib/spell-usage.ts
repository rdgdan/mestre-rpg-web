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
  characterLevel: number
): Record<number, number> {
  const result: Record<number, number> = { 0: Infinity };

  // Parsear classes e níveis
  // Formatos esperados: "Mago", "Mago 5", "Mago 2 / Clérigo 3"
  const classes: { name: string; level: number }[] = [];

  if (characterClass.includes('/')) {
    characterClass.split('/').forEach(part => {
      const match = part.trim().match(/^(.+?)\s+(\d+)$/);
      if (match) {
        classes.push({ name: match[1].toLowerCase(), level: parseInt(match[2]) });
      } else {
        // Fallback para string sem número (ex: erro de migração), assume nível 1
        classes.push({ name: part.trim().toLowerCase(), level: 1 });
      }
    });
  } else {
    // Single class
    classes.push({ name: characterClass.toLowerCase(), level: characterLevel });
  }

  // 1. Calcular Slots de Pacto (Bruxo)
  const warlockEntry = classes.find(c => c.name.includes('bruxo'));
  if (warlockEntry) {
    const warlockLevel = warlockEntry.level;
    const pactSlots = WARLOCK_SLOTS_TABLE[warlockLevel] || 0;
    if (pactSlots > 0) {
      result[100] = pactSlots;
    }
  }

  // 2. Calcular Slots Normais (Caster Level)
  let casterLevel = 0;

  classes.forEach(c => {
    if (['bardo', 'clérigo', 'druida', 'feiticeiro', 'mago'].some(name => c.name.includes(name))) {
      casterLevel += c.level;
    } else if (['paladino', 'ranger', 'patrulheiro'].some(name => c.name.includes(name))) {
      casterLevel += Math.floor(c.level / 2);
    } else if (['guerreiro', 'ladino'].some(name => c.name.includes(name))) {
      // Subclasses específicas (Cavaleiro Arcano, Trapaceiro Arcano) dariam 1/3, 
      // mas simplificaremos para 0 aqui pois não temos a subclasse neste contexto.
      // Adicionar lógica futura se necessário.
    }
  });

  if (casterLevel > 0) {
    const slots = STANDARD_SLOTS_TABLE[casterLevel] || [];
    slots.forEach((count, idx) => {
      result[idx + 1] = count;
    });
  }

  return result;
}

// Usar uma magia e descontar slots
export function consumeSpellSlot(
  spellSlotsCurrent: Record<number, number>,
  spell: Spell,
  slotsCost: number = 1
): Record<number, number> {
  const updated = { ...spellSlotsCurrent };
  const spellLevel = spell.level || 0;

  if (spellLevel === 0) {
    // Truques não gastam slots
    return updated;
  }

  // Tentar consumir slot normal
  const currentSlots = updated[spellLevel] || 0;

  if (currentSlots >= slotsCost) {
    updated[spellLevel] = Math.max(0, currentSlots - slotsCost);
  } else {
    // Se não tiver slot normal, tenta usar slot de Pacto (100)
    const pactSlots = updated[100] || 0;
    if (pactSlots >= slotsCost) {
      updated[100] = Math.max(0, pactSlots - slotsCost);
    }
  }

  return updated;
}

// Recuperar slots com descanso longo (full rest)
export function restLongSpells(
  characterClass: string,
  characterLevel: number
): Record<number, number> {
  return getMaxSpellSlotsForCharacter(characterClass, characterLevel);
}

// Recuperar alguns slots com descanso curto (apenas algumas classes)
export function restShortSpells(
  characterClass: string,
  characterLevel: number,
  currentSlots: Record<number, number>
): Record<number, number> {
  // Bruxo recupera Pact Magic (todos os slots) em descanso curto
  if (characterClass.toLowerCase() === 'bruxo') {
    return restLongSpells(characterClass, characterLevel);
  }

  // Outras classes não recuperam slots em descanso curto
  return currentSlots;
}

// Calcular quantos slots uma magia precisa
export function getSpellSlotsCost(spell: Spell): number {
  // Por padrão, uma magia custa 1 slot do seu nível
  // Poderia ser estendido para magias que usam múltiplos slots
  if (spell.level === 0) return 0; // Truques não gastam
  return 1; // 1 slot por padrão
}

// Validar se pode usar uma magia
export function canUseSpell(
  spellSlotsCurrent: Record<number, number>,
  spell: Spell
): boolean {
  if (spell.level === 0) return true; // Truques sempre podem

  const cost = getSpellSlotsCost(spell);
  const available = spellSlotsCurrent[spell.level] || 0;

  // Verifica se tem slots normais do nível OU slots de pacto (100)
  const pactAvailable = spellSlotsCurrent[100] || 0;

  return available >= cost || pactAvailable >= cost;
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
