// Cálculo de Slots de Magia baseado em D&D 5e
// https://www.dndbeyond.com/sources/basic-rules/classes

export interface SpellSlotInfo {
  max: number;
  current: number;
}

// Tabela de Slots por Classe
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
    1: [0], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2],
    10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3], 13: [4, 3, 3, 1], 14: [4, 3, 3, 1], 15: [4, 3, 3, 2],
    16: [4, 3, 3, 2], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1], 19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2]
  },
  'Ranger': {
    1: [0], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2],
    10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3], 13: [4, 3, 3, 1], 14: [4, 3, 3, 1], 15: [4, 3, 3, 2],
    16: [4, 3, 3, 2], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1], 19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2]
  },
  'Bruxo': {
    // Bruxo usa Pact Magic (sempre prepara num de magias = Carisma + Proficiência)
    // Slots são 5 + CHA mod de magias de nível máximo (não segue tabela normal)
    1: [1], 2: [1], 3: [1], 4: [2], 5: [2], 6: [2], 7: [2], 8: [3], 9: [3],
    10: [3], 11: [3], 12: [4], 13: [4], 14: [4], 15: [4], 16: [5], 17: [5], 18: [5], 19: [5], 20: [5]
  }
};

/**
 * Calcula o número máximo de slots de magia por nível baseado em D&D 5e
 * @param className - Nome da classe do personagem
 * @param characterLevel - Nível do personagem (1-20)
 * @param spellLevel - Nível da magia (1-9)
 * @returns Número de slots disponíveis
 */
export function getMaxSpellSlots(
  className: string | undefined,
  characterLevel: number,
  spellLevel: number
): number {
  if (!className || characterLevel < 1 || spellLevel < 1 || spellLevel > 9) {
    return 0;
  }

  const normalizedClass = className
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Procurar pela classe (com normalização)
  const classSlots = Object.entries(SPELL_SLOTS_BY_CLASS).find(
    ([key]) => key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedClass
  )?.[1];

  if (!classSlots) {
    return 0; // Classe não tem slots de magia
  }

  const levelSlots = classSlots[Math.min(characterLevel, 20)];
  if (!levelSlots || spellLevel > levelSlots.length) {
    return 0;
  }

  return levelSlots[spellLevel - 1] || 0;
}

/**
 * Calcula os slots de magia para todos os níveis de uma classe
 * @param className - Nome da classe
 * @param characterLevel - Nível do personagem
 * @returns Objeto com slots por nível
 */
export function getAllSpellSlots(
  className: string | undefined,
  characterLevel: number
): Record<number, number> {
  const slots: Record<number, number> = {};

  for (let spellLevel = 1; spellLevel <= 9; spellLevel++) {
    const maxSlots = getMaxSpellSlots(className, characterLevel, spellLevel);
    if (maxSlots > 0) {
      slots[spellLevel] = maxSlots;
    }
  }

  return slots;
}

/**
 * Retorna a descrição da quantidade de usos de uma magia/truque
 * @param spellLevel - Nível da magia
 * @param maxSlots - Número máximo de slots (0 para truque)
 * @param currentSlots - Slots atuais (0 para truque)
 * @returns String descritiva
 */
export function getSpellUsageDescription(
  spellLevel: number,
  maxSlots: number,
  currentSlots: number
): string {
  if (spellLevel === 0) {
    return 'Ilimitado';
  }

  return `${currentSlots}/${maxSlots}`;
}
