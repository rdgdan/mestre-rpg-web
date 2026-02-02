
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

// Tabela de Slots de Multiclasse (D&D 5e)
const MULTICLASS_SLOTS: Record<number, number[]> = {
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
    // Cavaleiro Arcano e Trapaceiro Arcano (Third Casters) precisariam de detecção de subclasse
    return 'none';
}

/**
 * Calcula o Nível de Conjurador (Caster Level) para multiclasse (D&D 5e)
 */
export function calculateMulticlassCasterLevel(classes: { name: string; level: number }[]): number {
    let totalLevel = 0;

    classes.forEach(c => {
        const type = getCasterType(c.name);
        switch (type) {
            case 'full':
                totalLevel += c.level;
                break;
            case 'half':
                // Paladino/Ranger: metade do nível (arredondado para baixo)
                totalLevel += Math.floor(c.level / 2);
                break;
            case 'artificer':
                // Artífice: metade do nível (arredondado para CIMA)
                totalLevel += Math.ceil(c.level / 2);
                break;
            case 'third':
                // Subclasses conjuradoras: 1/3 do nível
                totalLevel += Math.floor(c.level / 3);
                break;
        }
    });

    return totalLevel;
}

export function getSpellSlots(characterClasses: { name: string; level: number }[]): Record<string, number> {
    if (!characterClasses || characterClasses.length === 0) return {};

    // Se tiver apenas UMA classe, usa a progressão normal daquela classe
    if (characterClasses.length === 1) {
        const charClass = characterClasses[0];
        const casterType = getCasterType(charClass.name);
        const lvl = Math.max(1, Math.min(20, charClass.level));

        if (casterType === 'warlock') {
            const pact = WARLOCK_SLOTS[lvl];
            return { pact: pact.slots, pactLevel: pact.level };
        }

        let progression = [];
        if (casterType === 'full') progression = FULL_CASTER_SLOTS[lvl];
        else if (casterType === 'half') progression = HALF_CASTER_SLOTS[lvl];
        else if (casterType === 'artificer') progression = ARTIFICER_SLOTS[lvl];
        else return {};

        const slots: Record<string, number> = {};
        progression.forEach((count, index) => {
            if (count > 0) slots[(index + 1).toString()] = count;
        });
        return slots;
    }

    // MULTICLASSE
    const casterLevel = calculateMulticlassCasterLevel(characterClasses);
    const slots: Record<string, number> = {};

    // Pact Magic (Warlock) é SEMPRE separado
    const warlockClass = characterClasses.find(c => getCasterType(c.name) === 'warlock');
    if (warlockClass) {
        const pact = WARLOCK_SLOTS[Math.max(1, Math.min(20, warlockClass.level))];
        slots['pact'] = pact.slots;
        slots['pactLevel'] = pact.level;
    }

    // Slots normais de multiclasse
    if (casterLevel > 0) {
        const multiclassProgression = MULTICLASS_SLOTS[Math.max(1, Math.min(20, casterLevel))];
        multiclassProgression.forEach((count, index) => {
            if (count > 0) slots[(index + 1).toString()] = count;
        });
    }

    return slots;
}

export function getSpellcastingAbility(className: string): any {
    const lower = className.toLowerCase();
    if (lower.includes('mago') || lower.includes('artífice') || lower.includes('artifice')) return 'intelligence';
    if (lower.includes('bruxo') || lower.includes('bardo') || lower.includes('feiticeiro') || lower.includes('paladino')) return 'charisma';
    if (lower.includes('clérigo') || lower.includes('druida') || lower.includes('ranger') || lower.includes('patrulheiro')) return 'wisdom';
    return '';
}

export function getFullCasterSlotLevel(level: number): number {
    return Math.max(0, Math.ceil(level / 2));
}

export function getHalfCasterSlotLevel(level: number): number {
    if (level < 2) return 0;
    return Math.max(0, Math.ceil(level / 4));
}

export function getThirdCasterSlotLevel(level: number): number {
    if (level < 3) return 0;
    return Math.max(0, Math.ceil(level / 6));
}

export function getSpellsKnownCount(className: string, level: number): number {
    const lower = className.toLowerCase();
    const lvl = Math.max(1, Math.min(20, level));

    if (lower.includes('bardo')) {
        const table = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
        return table[lvl];
    }
    if (lower.includes('feiticeiro')) {
        const table = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
        return table[lvl];
    }
    if (lower.includes('bruxo')) {
        const table = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
        return table[lvl];
    }
    if (lower.includes('ranger') || lower.includes('patrulheiro')) {
        const table = [0, 0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
        return table[lvl];
    }

    return 0;
}

export function getCantripsKnownCount(className: string, level: number): number {
    const lower = className.toLowerCase();
    const lvl = Math.max(1, Math.min(20, level));

    if (lower.includes('mago') || lower.includes('bruxo') || lower.includes('bardo') || lower.includes('druida')) {
        if (lvl >= 10) return 4;
        if (lvl >= 4) return 3;
        return 2;
    }
    if (lower.includes('feiticeiro')) {
        if (lvl >= 10) return 6;
        if (lvl >= 4) return 5;
        return 4;
    }
    if (lower.includes('clérigo')) {
        if (lvl >= 10) return 5;
        if (lvl >= 4) return 4;
        return 3;
    }
    if (lower.includes('artífice')) {
        if (lvl >= 14) return 4;
        if (lvl >= 10) return 3;
        return 2;
    }

    return 0;
}
