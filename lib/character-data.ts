
// lib/character-data.ts
import { Inventory, OtherEquipmentItem, parseDamageString, dndWeapons } from './items-data';
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
    campaignId?: string; // ID da campanha vinculada
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
    features: {
        name: string;
        description: string;
        level?: number;
        type?: 'class' | 'race' | 'feat' | 'other'
    }[];
    conditions?: string[]; // Ex: 'Envenenado', 'Caído'
    activeEffects?: string[]; // IDs de efeitos ativos como 'rage', 'bless'
    spells: Spell[];
    spellcasting: {
        ability: AttributeKey | '';
        saveDc: number;
        attackBonus: number;
        slots: Record<string, { current: number; max: number }>;
    };
    rageBonus?: number;
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

    // Bônus de Fúria (D&D 5e: +2 até nível 8, +3 até 15, +4 até 20)
    let rageBonus = 0;
    if (character.activeEffects?.includes('rage')) {
        if (level >= 16) rageBonus = 4;
        else if (level >= 9) rageBonus = 3;
        else rageBonus = 2;
    }

    const attributeModifiers = ATTRIBUTE_KEYS.reduce((acc, key) => {
        let score = attributes[key] || 10;
        acc[key] = getModifier(score);
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

    // -- CÁLCULO DE PESO E SOBRECARGA --
    let totalWeight = 0;
    if (character.inventory) {
        character.inventory.weapons.forEach(w => totalWeight += (w.weight || 0) * (w.quantity || 1));
        character.inventory.otherEquipment.forEach(e => totalWeight += (e.weight || 0) * (e.quantity || 1));
    }

    const strengthScore = attributes.strength || 10;
    const carryCapacity = strengthScore * 7.5; // Simplificado (Regra padrão é 15 lbs / ~7.5 kg por ponto de força)

    let currentSpeed = character.speed || 9;
    if (totalWeight > carryCapacity) {
        // Sobrecarga pesada: Deslocamento cai em 3 metros (ou 6 dependendo da severidade)
        currentSpeed = Math.max(1.5, currentSpeed - 3);
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

        // Calcular slots máximos baseados no nível e classe
        const { getSpellSlots } = require('./level-progression');
        const maxSlots = getSpellSlots(className, level) as Record<string, number>;

        // Mesclar slots atuais com máximos calculados
        const mergedSlots: Record<string, { current: number; max: number }> = {};

        // Se for Warlock, lida com Pact Magic
        if (maxSlots.pact !== undefined) {
            const totalPactSlots = Number(maxSlots.pact);
            // Slot de pacto é único e recuperável em curto descanso
            const currentPactValue = existingSlots['pact']?.current !== undefined ? Number(existingSlots['pact'].current) : totalPactSlots;

            mergedSlots['pact'] = {
                current: Math.min(currentPactValue, totalPactSlots),
                max: totalPactSlots
            };
        } else {
            // Full/Half/Third casters
            Object.entries(maxSlots).forEach(([lvl, count]) => {
                const countNum = Number(count);
                const current = existingSlots[lvl]?.current !== undefined ? Number(existingSlots[lvl].current) : countNum;
                mergedSlots[lvl] = {
                    current: Math.min(current, countNum),
                    max: countNum
                };
            });
        }

        spellcastingData = {
            ability: castingAbility,
            saveDc,
            attackBonus,
            slots: mergedSlots
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
        speed: currentSpeed, // Aplica velocidade calculada (com sobrecarga)
        attributeModifiers,
        spellcasting: spellcastingData,
        // Garante que campos novos existam
        conditions: character.conditions || [],
        activeEffects: character.activeEffects || [],
        rageBonus
    };

    // Validar e auto-ajustar nível baseado em XP
    const { getLevelFromXP, validateXPForLevel } = require('./xp-progression');
    const validation = validateXPForLevel(computed.level, computed.experience);

    if (!validation.isValid && validation.suggestedLevel) {
        // Auto-ajustar nível APENAS se o XP for maior que o nível atual (progressão natural)
        if (validation.suggestedLevel > computed.level) {
            console.log(`📈 Auto-ajustando nível de ${computed.level} para ${validation.suggestedLevel} baseado em XP.`);
            computed.level = validation.suggestedLevel;
            computed.proficiencyBonus = getProficiencyBonusFromLevel(validation.suggestedLevel);
        } else {
            // Se o nível for MAIOR que o sugerido pelo XP, entendemos como uma escolha do Mestre.
            // Silenciamos o warning para não poluir o console a cada render.
        }
    }

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
                // Removido o guard que pulava o mapeamento se já tivesse nome/dano
                // para garantir que a normalização de 1d06 -> 1d6 e isCustomDamage ocorra sempre.

                // Mapeia do formato do itens.json se necessário
                let damage = b.damage || '';
                if (!damage && raw.c && Array.isArray(raw.c) && raw.c.length > 0) {
                    damage = `${raw.c.length}d${raw.c[0].a}`;
                }

                // Normalizar string de dano (ex: 1d06 -> 1d6)
                const parsed = parseDamageString(damage || '1d8');
                if (damage && !parsed.isCustomDamage) {
                    damage = `${parsed.diceQty}${parsed.diceType}${parsed.diceBonus ? '+' + parsed.diceBonus : ''}`;
                }

                return {
                    id: b.id || b.uuid || `weapon-${Date.now()}-${Math.random()}`,
                    name: b.u || b.name || raw.name || 'Arma Desconhecida',
                    damage: damage || '1d8',
                    damageType: b.b || b.damageType || '',
                    properties: b.x ? b.x.split(',').map((s: string) => s.trim()) : (b.properties || []),
                    quantity: raw.a?.c || b.quantity || 1,
                    isMagical: b.isMagical || false,
                    magicalBonus: b.magicalBonus || 0,
                    magicalEffect: b.magicalEffect || '',
                    weight: b.f || b.weight || 0,
                    diceQty: parsed.diceQty,
                    diceType: parsed.diceType,
                    diceBonus: parsed.diceBonus,
                    isCustomDamage: parsed.isCustomDamage
                };
            });
        }

        const oldEquipment = partialData.inventory.otherEquipment as unknown;
        if (Array.isArray(oldEquipment)) {
            // Pool de nomes de armas para detecção
            const weaponNames = new Set(dndWeapons.map(w => w.name.normalize('NFC').trim().toLowerCase()));

            const processedEquipment = oldEquipment.map((raw: any) => {
                const b = raw.b || raw;
                if (b.name && b.id) return b;

                // Normalização básica
                return {
                    id: b.id || b.uuid || `item-${Date.now()}-${Math.random()}`,
                    name: b.u || b.name || raw.name || 'Item Desconhecido',
                    quantity: raw.a?.c || b.quantity || 1,
                    description: b.v || b.description || '',
                    type: (b.i === 'ARMOR' ? 'armor' : b.i === 'SHIELD' ? 'shield' : 'other') as any,
                    armorClass: b.j || b.o || b.armorClass || 0,
                    isEquipped: b.isEquipped || false,
                    weight: b.f || b.weight || 0
                };
            });

            // Separa o que realmente é arma mas caiu em equipamento
            const equipmentToKeep: any[] = [];
            processedEquipment.forEach(item => {
                const normalizedName = item.name.normalize('NFC').trim().toLowerCase();
                // Se o nome bate com uma arma oficial ou se tem damage/dice (indicativo de arma)
                if (weaponNames.has(normalizedName) || (item as any).damage || (item as any).diceType) {
                    // Adiciona às armas (se já não estiver lá)
                    const weaponCandidate = {
                        ...item,
                        damage: (item as any).damage || '',
                        damageType: (item as any).damageType || '',
                        properties: (item as any).properties || []
                    };
                    finalInventory.weapons.push(weaponCandidate as any);
                } else {
                    equipmentToKeep.push(item);
                }
            });

            finalInventory.otherEquipment = equipmentToKeep;
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
