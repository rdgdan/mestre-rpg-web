
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
