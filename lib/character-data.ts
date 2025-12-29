
// lib/character-data.ts
import { Inventory, OtherEquipmentItem } from './items-data';

export const ATTRIBUTE_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
type AttributeKey = typeof ATTRIBUTE_KEYS[number];

export const ATTRIBUTE_DISPLAY_NAMES: Record<AttributeKey, string> = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma'
};

export const SKILLS = [
    { key: 'acrobatics', displayName: 'Acrobacia', attribute: 'dexterity' },
    { key: 'animalHandling', displayName: 'Adestrar Animais', attribute: 'wisdom' },
    { key: 'arcana', displayName: 'Arcanismo', attribute: 'intelligence' },
    { key: 'athletics', displayName: 'Atletismo', attribute: 'strength' },
    { key: 'deception', displayName: 'Enganação', attribute: 'charisma' },
    { key: 'history', displayName: 'História', attribute: 'intelligence' },
    { key: 'insight', displayName: 'Intuição', attribute: 'wisdom' },
    { key: 'intimidation', displayName: 'Intimidação', attribute: 'charisma' },
    { key: 'investigation', displayName: 'Investigação', attribute: 'intelligence' },
    { key: 'medicine', displayName: 'Medicina', attribute: 'wisdom' },
    { key: 'nature', displayName: 'Natureza', attribute: 'intelligence' },
    { key: 'perception', displayName: 'Percepção', attribute: 'wisdom' },
    { key: 'performance', displayName: 'Performance', attribute: 'charisma' },
    { key: 'persuasion', displayName: 'Persuasão', attribute: 'charisma' },
    { key: 'religion', displayName: 'Religião', attribute: 'intelligence' },
    { key: 'sleightOfHand', displayName: 'Prestidigitação', attribute: 'dexterity' },
    { key: 'stealth', displayName: 'Furtividade', attribute: 'dexterity' },
    { key: 'survival', displayName: 'Sobrevivência', attribute: 'wisdom' }
] as const;

// --- Tipos de Dados --- 
export interface Character {
    id: string;
    ownerId: string;
    name: string;
    race: string;
    class: string;
    level: number;
    proficiencyBonus: number;
    armorClass: number;
    initiative: number;
    speed: number;
    currentHp: number;
    maxHp: number;
    temporaryHp: number;
    attributes: Record<AttributeKey, number>;
    attributeModifiers: Record<AttributeKey, number>;
    skills: Record<typeof SKILLS[number]['key'], boolean>;
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    notes: string;
    inventory: Inventory;
    features: { name: string; description: string }[];
    spells: { name: string; level: number; castingTime: string; range: string; duration: string; description: string }[];
    spellcasting: {
        ability: AttributeKey | '';
        saveDc: number;
        attackBonus: number;
        slots: Record<string, { current: number; max: number }>;
    }
}

// --- REGRAS DO JOGO --- 

const SPELLCASTING_ABILITY_MAP: Record<string, AttributeKey> = {
    mago: 'intelligence',
    bruxo: 'charisma',
    bardo: 'charisma',
    clérigo: 'wisdom',
    druida: 'wisdom',
    feiticeiro: 'charisma',
    paladino: 'charisma',
    ranger: 'wisdom',
    artífice: 'intelligence'
};

function getProficiencyBonusFromLevel(level: number): number {
    if (level < 1) return 2;
    return Math.ceil(level / 4) + 1;
}

function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

// --- FUNÇÕES DE LÓGICA DO PERSONAGEM ---

export function calculateComputedStats(character: Omit<Character, 'proficiencyBonus' | 'armorClass' | 'initiative' | 'attributeModifiers' | 'spellcasting'>): Character {
    const { level, class: className, attributes } = character;
    const lowerCaseClass = className.toLowerCase();

    const proficiencyBonus = getProficiencyBonusFromLevel(level);
    
    const attributeModifiers = ATTRIBUTE_KEYS.reduce((acc, key) => {
        acc[key] = getModifier(attributes[key]);
        return acc;
    }, {} as Record<AttributeKey, number>);

    const dexMod = attributeModifiers.dexterity;
    const initiative = dexMod;

    let armorClass = 10 + dexMod; // Assume no armor for simplicity. Will be enhanced later.

    const spellcastingAbility = SPELLCASTING_ABILITY_MAP[lowerCaseClass] || '';
    let spellSaveDc = 8 + proficiencyBonus;
    let spellAttackBonus = proficiencyBonus;

    if (spellcastingAbility && attributeModifiers[spellcastingAbility]) {
        const spellMod = attributeModifiers[spellcastingAbility];
        spellSaveDc += spellMod;
        spellAttackBonus += spellMod;
    }

    return {
        ...character,
        proficiencyBonus,
        armorClass,
        initiative,
        attributeModifiers,
        spellcasting: {
            ...(character.spellcasting || {}),
            ability: spellcastingAbility,
            saveDc: spellSaveDc,
            attackBonus: spellAttackBonus
        }
    } as Character;
}

export function createBlankCharacter(ownerId: string): Character {
    const baseAttributes = ATTRIBUTE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 10 }), {} as Record<AttributeKey, number>);
    const baseSkills = SKILLS.reduce((acc, skill) => ({ ...acc, [skill.key]: false }), {} as Record<typeof SKILLS[number]['key'], boolean>);

    const blank: Omit<Character, 'proficiencyBonus' | 'armorClass' | 'initiative' | 'attributeModifiers' | 'spellcasting'> = {
        id: 'novo',
        ownerId,
        name: 'Novo Personagem',
        race: '',
        class: '',
        level: 1,
        speed: 9,
        currentHp: 10,
        maxHp: 10,
        temporaryHp: 0,
        attributes: baseAttributes,
        skills: baseSkills,
        personalityTraits: '',
        ideals: '',
        bonds: '',
        flaws: '',
        notes: '',
        inventory: {
            weapons: [],
            currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
            otherEquipment: [], 
        },
        features: [],
        spells: [],
    };

    return calculateComputedStats(blank);
}

// A função hydrate agora lida com a nova estrutura de `otherEquipment`
export function hydrateCharacter(partialData: Partial<Character> & { equipment?: string }, id: string): Character {
    const blank = createBlankCharacter(partialData.ownerId || '--');
    const hydrated = { ...blank, ...partialData, id };

    // Garante que campos aninhados sejam mesclados, não sobrescritos
    hydrated.attributes = { ...blank.attributes, ...partialData.attributes };
    hydrated.skills = { ...blank.skills, ...partialData.skills };

    // Lógica cuidadosa de migração do inventário
    let finalInventory = { ...blank.inventory };

    if (partialData.inventory) {
        finalInventory = {
            ...finalInventory,
            ...partialData.inventory,
            currency: { ...blank.inventory.currency, ...(partialData.inventory.currency || {}) },
            weapons: partialData.inventory.weapons || [],
        };

        const oldEquipment = partialData.inventory.otherEquipment;
        if (Array.isArray(oldEquipment)) {
            finalInventory.otherEquipment = oldEquipment;
        } else if (typeof oldEquipment === 'string' && oldEquipment.trim() !== '') {
            finalInventory.otherEquipment = [{
                id: new Date().toISOString(),
                name: 'Equipamento (Migrado)',
                quantity: 1,
                description: oldEquipment
            }];
        }
    } else if (partialData.equipment && typeof partialData.equipment === 'string') {
         finalInventory.otherEquipment = [{
            id: new Date().toISOString(),
            name: 'Equipamento (Migrado)',
            quantity: 1,
            description: partialData.equipment
        }];
    }

    hydrated.inventory = finalInventory;

    // Remove o campo legado, se existir
    if ('equipment' in hydrated) {
        delete (hydrated as any).equipment;
    }

    // Garante que a estrutura de magias seja mesclada corretamente
    hydrated.spellcasting = { ...blank.spellcasting, ...partialData.spellcasting };
    if (partialData.spellcasting?.slots) {
        hydrated.spellcasting.slots = { ...blank.spellcasting.slots, ...partialData.spellcasting.slots };
    }

    // Recalcula os stats com base nos dados totalmente hidratados
    return calculateComputedStats(hydrated);
}
