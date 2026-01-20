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

// Obter slots máximos para uma classe/nível
export function getMaxSpellSlotsForCharacter(
  characterClass: string,
  characterLevel: number
): Record<number, number> {
  const SPELL_SLOTS_BY_CLASS: Record<string, Record<number, number[]>> = {
    'Bardo': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Clérigo': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Druida': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Feiticeiro': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Mago': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Paladino': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Ranger': {
      1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3],
      7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
      11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1],
      14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
    },
    'Bruxo': {
      1: [1], 2: [2], 3: [2, 2], 4: [2, 2], 5: [2, 2, 1], 6: [2, 2, 1],
      7: [2, 2, 2], 8: [2, 2, 2], 9: [2, 2, 2, 1], 10: [2, 2, 2, 1],
      11: [3, 3, 2, 1], 12: [3, 3, 2, 1], 13: [3, 3, 2, 1, 1], 14: [3, 3, 2, 1, 1],
      15: [3, 3, 2, 2, 1], 16: [3, 3, 2, 2, 1], 17: [4, 4, 3, 2, 1], 18: [4, 4, 3, 2, 1],
      19: [4, 4, 3, 2, 2], 20: [4, 4, 3, 3, 2]
    }
  };

  const classSlots = SPELL_SLOTS_BY_CLASS[characterClass];
  if (!classSlots || !classSlots[characterLevel]) return { 0: Infinity };

  const slots = classSlots[characterLevel];
  const result: Record<number, number> = { 0: Infinity }; // Truques sempre infinitos

  slots.forEach((count, idx) => {
    result[idx + 1] = count;
  });

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

  // Descontar slots
  const currentSlots = updated[spellLevel] || 0;
  updated[spellLevel] = Math.max(0, currentSlots - slotsCost);

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

  return available >= cost;
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
