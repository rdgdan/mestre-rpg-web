// lib/character-data.ts
import { dndWeapons, Inventory, parseDamageString } from './items-data';
import { Spell } from './spells-data';
import { RACE_BONUSES } from './race-bonuses';
import { getSpellSlots, getSpellcastingAbility } from './level-progression';
import { validateXPForLevel } from './xp-progression';
import { CLASS_PROGRESSION, RACE_FEATURES } from './class-features';

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
    activeEncounterId?: string; // ID do encontro ativo para logs/balõezinhos
    createdAt?: string;
    name: string;
    race: string;
    class: string; // Classe Principal (ou primeira classe)
    displayClass?: string; // Classe formatada para exibição (ex: Bardo 3 / Mago 2)
    classes: { name: string; level: number; subclass?: string }[]; // Multiclasse
    subclass?: string;
    background: string;
    level: number; // Nível Total
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
        id?: string;
        name: string;
        description: string;
        level?: number;
        type?: 'class' | 'race' | 'feat' | 'other';
        source?: string;
        isCustom?: boolean;
    }[];
    conditions?: string[]; // Ex: 'Envenenado', 'Caído'
    activeEffects?: string[]; // IDs de efeitos ativos como 'rage', 'bless'
    spells: Spell[];
    spellcasting: {
        ability: AttributeKey | '';
        saveDc: number;
        attackBonus: number;
        slots: Record<string, { current: number; max: number }>;
        pactLevel?: number; // Para Bruxo: Nível atual dos slots de pacto
    };
    rageBonus?: number;
    hitDiceCurrent?: number;
    hitDiceMax?: number;
    attributeBreakdown?: Record<string, Record<string, number>>;
    arcaneRecoveryUsed?: boolean;
    authorizedMasterIds?: string[]; // UIDs de Mestres que abriram esta ficha e ganharam "acesso vitalício" de leitura
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
    artífice: 'intelligence',
    guardião: 'wisdom',
    guardiao: 'wisdom'
};

function getProficiencyBonusFromLevel(level: number): number {
    if (level < 1) return 2;
    return Math.ceil(level / 4) + 1;
}

function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

// --- FUNÇÕES DE LÓGICA DO PERSONAGEM ---

export function calculateComputedStats(character: Omit<Character, 'proficiencyBonus' | 'armorClass' | 'initiative' | 'attributeModifiers'>): Character {
    const char = { ...character } as Character;

    // 1. Garantir que o array de classes existe e está sincronizado
    // Se o personagem é nível 1 e char.class foi definido, garantimos que char.classes[0] reflita isso.
    if (!char.classes || char.classes.length === 0) {
        char.classes = [{ name: char.class || 'Guerreiro', level: char.level || 1, subclass: char.subclass || '' }];
    } else if (char.classes.length === 1 && char.class && char.class !== char.classes[0].name) {
        // Se o usuário mudou a classe na UI (char.class), atualizamos char.classes[0]
        char.classes[0].name = char.class;
    }

    // Atualiza nível total e classe principal para compatibilidade de UI
    const totalLevel = char.classes.reduce((sum, c) => sum + c.level, 0);
    char.level = totalLevel;
    char.class = char.classes[0].name;
    char.subclass = char.classes[0].subclass || '';

    // Formata a classe de exibição para multiclasse
    if (char.classes.length > 1) {
        char.displayClass = char.classes.map(c => `${c.name} ${c.level}`).join(' / ');
    } else {
        char.displayClass = `${char.class} ${char.level}`;
    }

    // Inicializa breakdown de atributos (Cálculo real baseado em Raça)
    const attributeBreakdown: Record<string, Record<string, number>> = {};
    const raceBonus = char.race ? RACE_BONUSES[char.race] || {} : {};

    ATTRIBUTE_KEYS.forEach(key => {
        const total = char.attributes[key] || 10;
        const rBonus = (raceBonus as any)[key] || 0;

        // Bônus de Itens Equipados
        let itemBonus = 0;
        if (char.inventory?.otherEquipment) {
            char.inventory.otherEquipment.forEach(item => {
                if (item.isEquipped && (item as any)[`${key}Bonus`]) {
                    itemBonus += (item as any)[`${key}Bonus`];
                }
            });
        }

        const base = total - rBonus - itemBonus;

        attributeBreakdown[key] = {
            "Base": base,
        };

        if (rBonus > 0) {
            attributeBreakdown[key][`Raça (${char.race})`] = rBonus;
        }

        if (itemBonus > 0) {
            attributeBreakdown[key]["Itens"] = itemBonus;
        }
    });
    char.attributeBreakdown = attributeBreakdown;

    const proficiencyBonus = getProficiencyBonusFromLevel(totalLevel);

    // Bônus de Fúria (D&D 5e: baseado no nível de Bárbaro, se houver)
    let rageBonus = 0;
    const barbarianClass = char.classes.find(c => c.name.toLowerCase().includes('bárbaro') || c.name.toLowerCase().includes('barbaro'));
    if (barbarianClass && char.activeEffects?.includes('rage')) {
        const bLevel = barbarianClass.level;
        if (bLevel >= 16) rageBonus = 4;
        else if (bLevel >= 9) rageBonus = 3;
        else rageBonus = 2;
    }

    const attributeModifiers = ATTRIBUTE_KEYS.reduce((acc, key) => {
        let score = char.attributes[key] || 10;
        acc[key] = getModifier(score);
        return acc;
    }, {} as Record<AttributeKey, number>);

    const dexterity = char.attributes.dexterity || 10;
    const dexMod = attributeModifiers.dexterity;

    // -- CÁLCULO DE CA (ARMOR CLASS) --
    let ac = 10 + dexMod;

    if (char.inventory && char.inventory.otherEquipment) {
        const equippedArmor = char.inventory.otherEquipment.find(item => item.isEquipped && item.type === 'armor');
        const equippedShield = char.inventory.otherEquipment.find(item => item.isEquipped && item.type === 'shield');

        if (equippedArmor) {
            const baseAC = equippedArmor.armorClass || 10;
            if (baseAC < 14) ac = baseAC + dexMod;
            else if (baseAC < 16) ac = baseAC + Math.min(dexMod, 2);
            else ac = baseAC;
        }

        if (!equippedArmor) {
            // Defesa sem Armadura (Bárbaro/Monge)
            const hasBarbarian = char.classes.some(c => c.name.toLowerCase().includes('bárbaro') || c.name.toLowerCase().includes('barbaro'));
            const hasMonk = char.classes.some(c => c.name.toLowerCase().includes('monge'));

            if (hasBarbarian) {
                ac = 10 + dexMod + attributeModifiers.constitution;
            } else if (hasMonk) {
                ac = 10 + dexMod + attributeModifiers.wisdom;
            }
        }

        if (equippedShield) ac += (equippedShield.armorClass || 2);
    }

    // -- CÁLCULO DE PESO --
    let totalWeight = 0;
    if (char.inventory) {
        char.inventory.weapons.forEach(w => totalWeight += (w.weight || 0) * (w.quantity || 1));
        char.inventory.otherEquipment.forEach(e => totalWeight += (e.weight || 0) * (e.quantity || 1));
    }

    const carryCapacity = (char.attributes.strength || 10) * 7.5;
    let currentSpeed = char.speed || 9;
    if (totalWeight > carryCapacity) currentSpeed = Math.max(1.5, currentSpeed - 3);

    // -- CÁLCULO DE MAGIA (MULTICLASSE) --

    // Tenta encontrar a habilidade de conjuração (usa a da primeira classe conjuradora)
    let castingAbility: AttributeKey | '' = '';
    for (const c of char.classes) {
        const ability = getSpellcastingAbility(c.name);
        if (ability) {
            castingAbility = ability;
            break;
        }
    }

    const existingSpellcasting = (char as any).spellcasting;
    const existingSlots = existingSpellcasting?.slots || {};
    let spellcastingData: Character['spellcasting'];

    if (castingAbility) {
        const abilityScore = char.attributes[castingAbility] || 10;
        const mod = getModifier(abilityScore);

        // Slots calculados pela lógica de multiclasse
        const maxSlots = getSpellSlots(char.classes);
        const mergedSlots: Record<string, { current: number; max: number }> = {};

        Object.entries(maxSlots).forEach(([lvl, count]) => {
            if (lvl === 'pactLevel') return; // Metadata
            const countNum = Number(count);
            const current = existingSlots[lvl]?.current !== undefined ? Number(existingSlots[lvl].current) : countNum;
            mergedSlots[lvl] = { current: Math.min(current, countNum), max: countNum };
        });

        spellcastingData = {
            ability: castingAbility,
            saveDc: 8 + proficiencyBonus + mod,
            attackBonus: proficiencyBonus + mod,
            slots: mergedSlots,
            pactLevel: maxSlots.pactLevel
        };
    } else {
        spellcastingData = existingSpellcasting || { ability: '', saveDc: 0, attackBonus: 0, slots: {}, pactLevel: 0 };
    }

    const computed: Character = {
        ...char,
        proficiencyBonus,
        armorClass: ac,
        initiative: dexMod,
        speed: currentSpeed,
        attributeModifiers,
        spellcasting: spellcastingData,
        conditions: char.conditions || [],
        activeEffects: char.activeEffects || [],
        rageBonus
    };

    // -- POPULAR CARACTERÍSTICAS EM FALTA (HEALING) --
    let currentFeatures = [...(computed.features || [])];

    // Identificar fontes atuais válidas (Raça e Classes)
    const validSources = new Set<string>();
    if (computed.race) validSources.add(computed.race);
    (computed.classes || []).forEach(cls => validSources.add(cls.name));

    // Filtrar características: 
    // Mantemos se: 
    // 1. For customizada (isCustom) 
    // 2. Ou se a fonte ainda for válida 
    // 3. Ou se não tiver fonte (feats/outros)
    currentFeatures = currentFeatures.filter(f => {
        if (f.type === 'feat' || !f.type || f.type === 'other') return true;
        if (!f.source) return true;
        // Se a fonte não está mais no personagem e não é manual, removemos
        return validSources.has(f.source);
    });

    const featureNames = new Set(currentFeatures.map(f => f.name));

    // 1. Características de Raça
    if (computed.race && RACE_FEATURES[computed.race]) {
        RACE_FEATURES[computed.race].forEach(f => {
            if (!featureNames.has(f.name)) {
                currentFeatures.push({ ...f, type: 'race', source: computed.race });
                featureNames.add(f.name);
            }
        });
    }

    // 2. Características de Classe (Suporte a Multiclasse)
    (computed.classes || []).forEach(cls => {
        const progression = CLASS_PROGRESSION[cls.name];
        if (progression) {
            for (let lv = 1; lv <= cls.level; lv++) {
                if (progression[lv]) {
                    progression[lv].features.forEach(f => {
                        if (!f.isChoice && !featureNames.has(f.name)) {
                            currentFeatures.push({ ...f, level: lv, type: 'class', source: cls.name });
                            featureNames.add(f.name);
                        }
                    });
                }
            }
        }
    });

    computed.features = currentFeatures;

    // Validar nível baseado em XP
    const validation = validateXPForLevel(computed.level, computed.experience);

    if (!validation.isValid && validation.suggestedLevel && validation.suggestedLevel > computed.level) {
        // Marcamos aqui que o personagem pode subir de nível, mas não mexemos no array classes automaticamente
        console.log(`📈 Nível sugerido por XP: ${validation.suggestedLevel}.`);
    }

    return computed;
}

export function createBlankCharacter(ownerId: string): Character {
    const baseAttributes = ATTRIBUTE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 10 }), {} as Record<AttributeKey, number>);
    const baseSkills = SKILLS.reduce((acc, skill) => ({ ...acc, [skill.key]: false }), {} as Record<typeof SKILLS[number]['key'], boolean>);

    const blank: Omit<Character, 'proficiencyBonus' | 'armorClass' | 'initiative' | 'attributeModifiers'> = {
        id: 'novo',
        ownerId,
        name: 'Novo Personagem',
        race: '',
        class: '',
        classes: [],
        subclass: '',
        background: '',
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
        spellcasting: {
            ability: '',
            saveDc: 0,
            attackBonus: 0,
            slots: {},
            pactLevel: 0
        },
        hitDiceCurrent: 1,
        hitDiceMax: 1,
    };

    return calculateComputedStats(blank);
}

// A função hydrate agora lida com a nova estrutura de `otherEquipment`
export function hydrateCharacter(partialData: Partial<Character> & { equipment?: string }, id: string): Character {
    const blank = createBlankCharacter(partialData.ownerId || '--');
    const hydrated = { ...blank, ...partialData, id };

    // Garante que o campo treasures e subclass sejam inicializados
    hydrated.treasures = partialData.treasures || '';
    hydrated.subclass = partialData.subclass || '';
    hydrated.background = partialData.background || '';

    // Garante que campos aninhados sejam mesclados, não sobrescritos
    hydrated.attributes = { ...blank.attributes, ...partialData.attributes };
    hydrated.skills = { ...blank.skills, ...partialData.skills };

    // --- Migração Multiclasse ---
    // Se o personagem não tem o array 'classes' mas tem o campo 'class' legado, migra para o novo formato.
    if ((!hydrated.classes || hydrated.classes.length === 0) && hydrated.class) {
        hydrated.classes = [{
            name: hydrated.class,
            level: hydrated.level || 1,
            subclass: hydrated.subclass || ''
        }];
    }
    // Sincroniza o campo 'class' e 'level' para compatibilidade (usa a primeira classe como principal)
    if (hydrated.classes && hydrated.classes.length > 0) {
        hydrated.class = hydrated.classes[0].name;
        hydrated.subclass = hydrated.classes[0].subclass || '';
        hydrated.level = hydrated.classes.reduce((sum, c) => sum + c.level, 0);
    }

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
            const existingWeaponNames = new Set(finalInventory.weapons.map(w => w.name.normalize('NFC').trim().toLowerCase()));

            processedEquipment.forEach(item => {
                const normalizedName = item.name.normalize('NFC').trim().toLowerCase();
                // Se o nome bate com uma arma oficial ou se tem damage/dice (indicativo de arma)
                if ((weaponNames.has(normalizedName) || (item as any).damage || (item as any).diceType) && !existingWeaponNames.has(normalizedName)) {
                    // Adiciona às armas (se já não estiver lá)
                    const weaponCandidate = {
                        ...item,
                        damage: (item as any).damage || '1d6',
                        damageType: (item as any).damageType || '',
                        properties: (item as any).properties || []
                    };
                    finalInventory.weapons.push(weaponCandidate as any);
                    existingWeaponNames.add(normalizedName);
                } else if (!weaponNames.has(normalizedName)) {
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
