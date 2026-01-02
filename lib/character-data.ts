
// lib/character-data.ts
import { Inventory, OtherEquipmentItem } from './items-data';
import { Spell } from './spells-data';

export const ATTRIBUTE_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
export type AttributeKey = typeof ATTRIBUTE_KEYS[number];

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
    experience: number;
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
    deathSaves: { successes: number; failures: number };
    treasures?: string;
    inventory: Inventory;
    features: { name: string; description: string }[];
    spells: Spell[];
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

    const dexterity = attributes.dexterity || 10;
    const dexMod = Math.floor((dexterity - 10) / 2);

    // -- CÁLCULO DE CA (ARMOR CLASS) --
    let ac = 10 + dexMod; // Base: Sem armadura

    if (character.inventory && character.inventory.otherEquipment) {
        const equippedArmor = character.inventory.otherEquipment.find(item => item.isEquipped && item.type === 'armor');
        const equippedShield = character.inventory.otherEquipment.find(item => item.isEquipped && item.type === 'shield');

        if (equippedArmor) {
            const baseAC = equippedArmor.armorClass || 10;
            // Heurística simples para tipo de armadura baseada no valor de CA, já que não temos o subtipo explícito no momento
            // AC Base < 14: Leve (Dex total)
            // AC Base 14 ou 15: Média (Dex máx +2)
            // AC Base >= 16: Pesada (Sem Dex)
            if (baseAC < 14) {
                ac = baseAC + dexMod;
            } else if (baseAC < 16) {
                ac = baseAC + Math.min(dexMod, 2);
            } else {
                ac = baseAC;
            }
        }

        // Defesa sem Armadura (Bárbaro/Monge) - simplificado por detecção de string na classe
        if (!equippedArmor && className) {
            const lowerClass = className.toLowerCase();
            if (lowerClass.includes('bárbaro') || lowerClass.includes('barbaro')) {
                const conMod = Math.floor(((attributes.constitution || 10) - 10) / 2);
                ac = 10 + dexMod + conMod;
            } else if (lowerClass.includes('monge')) {
                const wisMod = Math.floor(((attributes.wisdom || 10) - 10) / 2);
                ac = 10 + dexMod + wisMod;
            }
        }

        if (equippedShield) {
            ac += (equippedShield.armorClass || 2);
        }
    }

    // -- CÁLCULO DE MAGIA --
    const castingAbility = SPELLCASTING_ABILITY_MAP[lowerCaseClass] as AttributeKey | undefined;

    // Preserva slots existentes ou inicia vazio
    // Usamos 'any' aqui para acessar spellcasting se ele existir no objeto character (partial)
    const existingSpellcasting = (character as any).spellcasting;
    const existingSlots = existingSpellcasting?.slots || {};

    let spellcastingData: Character['spellcasting'];

    if (castingAbility) {
        const abilityScore = attributes[castingAbility] || 10;
        const mod = Math.floor((abilityScore - 10) / 2);
        const saveDc = 8 + proficiencyBonus + mod;
        const attackBonus = proficiencyBonus + mod;

        spellcastingData = {
            ability: castingAbility,
            saveDc,
            attackBonus,
            slots: existingSlots
        };
    } else {
        spellcastingData = existingSpellcasting || {
            ability: '',
            saveDc: 0,
            attackBonus: 0,
            slots: {}
        };
    }

    const computed: Character = {
        ...character,
        proficiencyBonus,
        armorClass: ac,
        initiative: dexMod,
        attributeModifiers,
        spellcasting: spellcastingData
    };

    return computed;
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
        experience: 0,
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
        deathSaves: { successes: 0, failures: 0 },
        treasures: '',
    };

    return calculateComputedStats(blank);
}

// A função hydrate agora lida com a nova estrutura de `otherEquipment`
export function hydrateCharacter(partialData: Partial<Character> & { equipment?: string }, id: string): Character {
    const blank = createBlankCharacter(partialData.ownerId || '--');
    const hydrated = { ...blank, ...partialData, id };

    // Garante que o campo treasures seja inicializado
    hydrated.treasures = partialData.treasures || '';

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
        };

        // Mapeamento de armas com suporte ao formato itens.json
        if (partialData.inventory.weapons && Array.isArray(partialData.inventory.weapons)) {
            finalInventory.weapons = partialData.inventory.weapons.map((raw: any) => {
                const b = raw.b || raw;
                // Se já estiver no formato novo e completo, mantém
                if (b.damage && b.name) return b;

                // Mapeia do formato do itens.json se necessário
                let damage = b.damage || '';
                if (!damage && raw.c && Array.isArray(raw.c) && raw.c.length > 0) {
                    damage = `${raw.c.length}d${raw.c[0].a}`;
                }

                return {
                    id: b.id || b.uuid || `weapon-${Date.now()}-${Math.random()}`,
                    name: b.u || b.name || 'Arma Desconhecida',
                    damage: damage || '1d8',
                    damageType: b.b || b.damageType || '',
                    properties: b.x ? b.x.split(',').map((s: string) => s.trim()) : (b.properties || []),
                    quantity: raw.a?.c || b.quantity || 1,
                    isMagical: b.isMagical || false,
                    magicalBonus: b.magicalBonus || 0,
                    magicalEffect: b.magicalEffect || '',
                    weight: b.f || b.weight || 0
                };
            });
        }

        const oldEquipment = partialData.inventory.otherEquipment as unknown;
        if (Array.isArray(oldEquipment)) {
            finalInventory.otherEquipment = oldEquipment.map((raw: any) => {
                const b = raw.b || raw;
                if (b.name && b.id) return b;

                return {
                    id: b.id || b.uuid || `item-${Date.now()}-${Math.random()}`,
                    name: b.u || b.name || 'Item Desconhecido',
                    quantity: raw.a?.c || b.quantity || 1,
                    description: b.v || b.description || '',
                    type: (b.i === 'ARMOR' ? 'armor' : b.i === 'SHIELD' ? 'shield' : 'other') as any,
                    armorClass: b.j || b.o || b.armorClass || 0,
                    isEquipped: b.isEquipped || false,
                    weight: b.f || b.weight || 0
                };
            });
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

    // Suporte a magias do formato magia.json (legado)
    if (partialData.spells && Array.isArray(partialData.spells)) {
        hydrated.spells = partialData.spells.map((raw: any) => {
            // Se for o formato { a, b }, pega o b, senão o próprio objeto
            const s = raw.b || raw;

            // Se já estiver no formato novo e completo, mantém
            if (s.castingTime && s.description && (s.name && s.name !== 'Magia Desconhecida')) return s;

            // Mapeamento resiliente
            return {
                id: s.uuid || raw.a?.c || s.id || `migrated-${Date.now()}-${Math.random()}`,
                name: s.b || s.name || (s.d && s.d.length > 15 ? 'Magia' : s.d) || 'Magia Desconhecida',
                level: s.k !== undefined ? s.k : (s.level || 0),
                castingTime: s.f || s.castingTime || '1 ação',
                range: s.g || s.h || s.range || 'Toque',
                duration: s.e || s.duration || 'Instantânea',
                description: s.c || s.description || '',
                school: s.d || s.school || '',
                components: s.i || s.components || '',
                concentration: (s.e && typeof s.e === 'string' && s.e.toLowerCase().includes('concentração')) || s.concentration || false,
                classes: s.classes || []
            };
        });
    }

    // Garante que a estrutura de magias seja mesclada corretamente
    hydrated.spellcasting = { ...blank.spellcasting, ...partialData.spellcasting };
    if (partialData.spellcasting?.slots) {
        hydrated.spellcasting.slots = { ...blank.spellcasting.slots, ...partialData.spellcasting.slots };
    }

    // Recalcula os stats com base nos dados totalmente hidratados
    return calculateComputedStats(hydrated);
}
