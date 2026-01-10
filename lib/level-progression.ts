
// lib/level-progression.ts

// Tabela de Slots para Full Casters (Bardo, Clérigo, Druida, Feiticeiro, Mago)
const FULL_CASTER_SLOTS: Record<number, number[]> = {
    1: [2],
    2: [3],
    3: [4, 2],
    4: [4, 3],
    5: [4, 3, 2],
    6: [4, 3, 3],
    7: [4, 3, 3, 1],
    8: [4, 3, 3, 2],
    9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2],
    11: [4, 3, 3, 3, 2, 1],
    12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1],
    14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1],
    16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    18: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 2, 1, 1, 1, 1],
    20: [4, 3, 3, 3, 2, 1, 1, 1, 1]
};

// Tabela de Slots para Half Casters (Paladino, Ranger)
// Artífice arredonda pra cima, então Artificer Lv 1 = Full Caster Lv 1 (arredondado). 
// Mas Paladino/Ranger ganham spellcasting no lv 2.
// Para simplificar, vou usar a tabela padrão de Paladino/Ranger
const HALF_CASTER_SLOTS: Record<number, number[]> = {
    1: [],
    2: [2],
    3: [3],
    4: [3],
    5: [4, 2],
    6: [4, 2],
    7: [4, 3],
    8: [4, 3],
    9: [4, 3, 2],
    10: [4, 3, 2],
    11: [4, 3, 3],
    12: [4, 3, 3],
    13: [4, 3, 3, 1],
    14: [4, 3, 3, 1],
    15: [4, 3, 3, 2],
    16: [4, 3, 3, 2],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2]
};

// Artífice (Half-Caster arredondado pra cima)
// Lv 1 = 1/2 = 0.5 -> 1. Slots de Nv 1 Full Caster.
const ARTIFICER_SLOTS: Record<number, number[]> = {
    1: [2],
    2: [2],
    3: [3],
    4: [3],
    5: [4, 2],
    6: [4, 2],
    7: [4, 3],
    8: [4, 3],
    9: [4, 3, 2],
    10: [4, 3, 2],
    11: [4, 3, 3],
    12: [4, 3, 3],
    13: [4, 3, 3, 1],
    14: [4, 3, 3, 1],
    15: [4, 3, 3, 2],
    16: [4, 3, 3, 2],
    17: [4, 3, 3, 3, 1],
    18: [4, 3, 3, 3, 1],
    19: [4, 3, 3, 3, 2],
    20: [4, 3, 3, 3, 2]
};

// Warlock (Pact Magic)
// Retorna { slotLevel: number, quantity: number }
interface WarlockSlots {
    level: number;
    slots: number;
}
const WARLOCK_SLOTS: Record<number, WarlockSlots> = {
    1: { level: 1, slots: 1 },
    2: { level: 1, slots: 2 },
    3: { level: 2, slots: 2 },
    4: { level: 2, slots: 2 },
    5: { level: 3, slots: 2 },
    6: { level: 3, slots: 2 },
    7: { level: 4, slots: 2 },
    8: { level: 4, slots: 2 },
    9: { level: 5, slots: 2 },
    10: { level: 5, slots: 2 },
    11: { level: 5, slots: 3 }, // Mystic Arcanum 6th (separado)
    12: { level: 5, slots: 3 },
    13: { level: 5, slots: 3 }, // Mystic Arcanum 7th
    14: { level: 5, slots: 3 },
    15: { level: 5, slots: 3 }, // Mystic Arcanum 8th
    16: { level: 5, slots: 3 },
    17: { level: 5, slots: 4 }, // Mystic Arcanum 9th
    18: { level: 5, slots: 4 },
    19: { level: 5, slots: 4 },
    20: { level: 5, slots: 4 }
};

export type CasterType = 'full' | 'half' | 'artificer' | 'warlock' | 'third' | 'none';

export function getCasterType(className: string): CasterType {
    const lower = className.toLowerCase();

    if (lower.includes('mago') || lower.includes('bardo') || lower.includes('clérigo') || lower.includes('druida') || lower.includes('feiticeiro')) {
        return 'full';
    }
    if (lower.includes('paladino') || lower.includes('ranger') || lower.includes('patrulheiro')) {
        return 'half';
    }
    if (lower.includes('artífice') || lower.includes('artifice')) {
        return 'artificer';
    }
    if (lower.includes('bruxo')) {
        return 'warlock';
    }
    // Cavaleiro Arcano e Trapaceiro Arcano precisariam de detecção de subclasse, por enquanto 'none' ou manual
    return 'none';
}

export function getSpellcastingAbility(className: string): 'intelligence' | 'wisdom' | 'charisma' | null {
    const lower = className.toLowerCase();
    if (lower.includes('mago') || lower.includes('artífice') || lower.includes('artifice')) return 'intelligence';
    if (lower.includes('clérigo') || lower.includes('druida') || lower.includes('ranger') || lower.includes('patrulheiro')) return 'wisdom';
    if (lower.includes('bardo') || lower.includes('feiticeiro') || lower.includes('bruxo') || lower.includes('paladino')) return 'charisma';
    return null;
}

// Tabela de Magias Conhecidas (Spells Known) para Bardos
export const BARD_KNOWN: Record<number, number> = {
    1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14,
    11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22
};

// Tabela de Truques Conhecidos (Cantrips Known)
export const CANTRIPS_KNOWN: Record<string, Record<number, number>> = {
    'Bardo': { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    'Clérigo': { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
    'Druida': { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    'Feiticeiro': { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6 },
    'Mago': { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
    'Bruxo': { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    'Artífice': { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3 }
};

export function getCantripsKnownCount(className: string, level: number): number {
    // Normalizar nome da classe (Pode vir "Bardo", "bardo", etc)
    // Mapeamento simples para chaves do objeto acima
    const map: Record<string, string> = {
        'bardo': 'Bardo', 'clérigo': 'Clérigo', 'clerigo': 'Clérigo',
        'druida': 'Druida', 'feiticeiro': 'Feiticeiro', 'mago': 'Mago',
        'bruxo': 'Bruxo', 'artífice': 'Artífice', 'artifice': 'Artífice'
    };

    // Tenta encontrar a chave correta
    const key = Object.keys(map).find(k => className.toLowerCase().includes(k));
    if (key) {
        const canonicalName = map[key];
        return CANTRIPS_KNOWN[canonicalName]?.[level] || 0;
    }
    return 0;
}

// Tabela de Magias Conhecidas para Feiticeiros
export const SORCERER_KNOWN: Record<number, number> = {
    1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11,
    11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15
};

// Tabela de Magias Conhecidas para Bruxos
export const WARLOCK_KNOWN: Record<number, number> = {
    1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10,
    11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15
};

// Tabela de Magias Conhecidas para Rangers
export const RANGER_KNOWN: Record<number, number> = {
    1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
    11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11
};

export function getSpellsKnownCount(className: string, level: number): number {
    const lower = className.toLowerCase();

    // Classes com tabela fixa de Spells Known
    if (lower.includes('bardo')) return BARD_KNOWN[level] || 0;
    if (lower.includes('feiticeiro')) return SORCERER_KNOWN[level] || 0;
    if (lower.includes('bruxo')) return WARLOCK_KNOWN[level] || 0;
    if (lower.includes('ranger') || lower.includes('patrulheiro')) return RANGER_KNOWN[level] || 0;
    if (lower.includes('paladino')) return 0; // Paladinos preparam, não "conhecem" fixo (mod + level/2)
    if (lower.includes('clérigo') || lower.includes('druida')) return 0; // Preparam (mod + level)

    // Mago: Aprende 2 por nível (adiciona ao grimório), além das 6 iniciais no lv 1
    // Mas aqui retornamos o TOTAL esperado? Não, Magos funcionam diferente.
    // Vamos retornar -1 para indicar "Lógica Especial / Preparada" ou lidar na UI
    if (lower.includes('mago')) return -1; // Special case

    return 0;
}

export function getFullCasterSlotLevel(level: number): number {
    const slots = FULL_CASTER_SLOTS[level];
    return slots ? slots.length : 0;
}

export function getSpellSlots(className: string, level: number): Record<string, number> {
    const casterType = getCasterType(className);
    const slotsObj: Record<string, number> = {};

    // Limite de nível 1 a 20
    const lvl = Math.max(1, Math.min(20, level));

    if (casterType === 'warlock') {
        const pact = WARLOCK_SLOTS[lvl];
        slotsObj['pact'] = pact.slots;
        slotsObj['pactLevel'] = pact.level; // Guardar nível do slot de pacto como metadado se necessário, mas aqui retornamos qtd.
        // Warlock é complicado porque todos os slots são do mesmo nvel.
        // Vamos retornar especial: 'pact': X (quantidade). O Nível é fixo.
        return { pact: pact.slots, pactLevel: pact.level };
    }

    let progression: number[] = [];

    if (casterType === 'full') progression = FULL_CASTER_SLOTS[lvl];
    else if (casterType === 'half') progression = HALF_CASTER_SLOTS[lvl];
    else if (casterType === 'artificer') progression = ARTIFICER_SLOTS[lvl];
    else return {}; // None

    progression.forEach((count, index) => {
        if (count > 0) {
            slotsObj[(index + 1).toString()] = count;
        }
    });

    return slotsObj;
}
