
import { AttributeKey } from "./character-data";

// Prioridade de atributos para cada classe (Standard Array logic: 15, 14, 13, 12, 10, 8)
export const CLASS_ATTRIBUTE_PRIORITIES: Record<string, AttributeKey[]> = {
    "Artífice": ["intelligence", "constitution", "dexterity", "wisdom", "strength", "charisma"],

    // Força > Con > Dex
    "Bárbaro": ["strength", "constitution", "dexterity", "wisdom", "charisma", "intelligence"],

    // Carisma > Dex > Con
    "Bardo": ["charisma", "dexterity", "constitution", "wisdom", "intelligence", "strength"],

    // Sabedoria > Con > Dex (Clérigo pode variar STR ou DEX, assume DEX padrão)
    "Clérigo": ["wisdom", "constitution", "strength", "dexterity", "intelligence", "charisma"],

    // Sabedoria > Con > Dex
    "Druida": ["wisdom", "constitution", "dexterity", "intelligence", "charisma", "strength"],

    // Carisma > Con > Dex (Feiticeiro precisa CON p/ concentração)
    "Feiticeiro": ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],

    // Força ou Dex > Con
    "Guerreiro": ["strength", "constitution", "dexterity", "wisdom", "intelligence", "charisma"],

    // Dex > Int/Wis > Con
    "Ladino": ["dexterity", "intelligence", "constitution", "wisdom", "charisma", "strength"],

    // Int > Con > Dex
    "Mago": ["intelligence", "constitution", "dexterity", "wisdom", "charisma", "strength"],

    // Dex > Wis > Con
    "Monge": ["dexterity", "wisdom", "constitution", "strength", "intelligence", "charisma"],

    // Força > Carisma > Con
    "Paladino": ["strength", "charisma", "constitution", "wisdom", "dexterity", "intelligence"],

    // Dex > Wis > Con
    "Patrulheiro": ["dexterity", "wisdom", "constitution", "strength", "intelligence", "charisma"],

    // Dex > Wis > Con
    "Guardião": ["dexterity", "wisdom", "constitution", "strength", "intelligence", "charisma"],

    // Carisma > Con > Dex
    "Bruxo": ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
};

/**
 * Define os atributos principais e secundários de cada classe do D&D 5e
 * Usado para sugerir automaticamente aumentos de atributo (ASI)
 */
export interface ClassAttributes {
    primary: AttributeKey[];      // Atributos principais (ex: Força para Guerreiro)
    secondary: AttributeKey[];    // Atributos secundários (ex: Constituição)
    description: string;          // Explicação da escolha
}

export const CLASS_PRIMARY_ATTRIBUTES: Record<string, ClassAttributes> = {
    "Artífice": {
        primary: ["intelligence"],
        secondary: ["constitution", "dexterity"],
        description: "Inteligência para magias e criações, Constituição para sobrevivência"
    },
    "Bárbaro": {
        primary: ["strength", "constitution"],
        secondary: ["dexterity"],
        description: "Força para dano corpo-a-corpo e Constituição para HP e resistência"
    },
    "Bardo": {
        primary: ["charisma"],
        secondary: ["dexterity", "constitution"],
        description: "Carisma para magias e perícias sociais"
    },
    "Clérigo": {
        primary: ["wisdom"],
        secondary: ["constitution", "strength"],
        description: "Sabedoria para magias divinas, Constituição para sobrevivência"
    },
    "Druida": {
        primary: ["wisdom"],
        secondary: ["constitution", "dexterity"],
        description: "Sabedoria para magias e Forma Selvagem"
    },
    "Guerreiro": {
        primary: ["strength", "constitution"],
        secondary: ["dexterity"],
        description: "Força para combate corpo-a-corpo e Constituição para HP (ou Destreza para arqueiros)"
    },
    "Ladino": {
        primary: ["dexterity"],
        secondary: ["intelligence", "charisma"],
        description: "Destreza para furtividade, ataques e CA"
    },
    "Monge": {
        primary: ["dexterity", "wisdom"],
        secondary: ["constitution"],
        description: "Destreza para CA e ataques, Sabedoria para Ki e CA"
    },
    "Paladino": {
        primary: ["strength", "charisma"],
        secondary: ["constitution"],
        description: "Força para combate e Carisma para magias e auras"
    },
    "Patrulheiro": {
        primary: ["dexterity", "wisdom"],
        secondary: ["constitution"],
        description: "Destreza para ataques e Sabedoria para magias e rastreamento"
    },
    "Guardião": {
        primary: ["dexterity", "wisdom"],
        secondary: ["constitution"],
        description: "Destreza para ataques e Sabedoria para magias e rastreamento (revisado)"
    },
    "Feiticeiro": {
        primary: ["charisma"],
        secondary: ["constitution", "dexterity"],
        description: "Carisma para magias inatas e metamagia"
    },
    "Bruxo": {
        primary: ["charisma"],
        secondary: ["constitution", "dexterity"],
        description: "Carisma para magias de pacto e invocações"
    },
    "Mago": {
        primary: ["intelligence"],
        secondary: ["constitution", "dexterity"],
        description: "Inteligência para magias arcanas e grimório"
    }
};

/**
 * Retorna sugestões inteligentes de ASI baseadas na classe e atributos atuais
 * Prioriza atributos que ainda não estão no máximo (20)
 */
export function getSmartASISuggestions(
    className: string,
    currentAttributes: Record<string, number>
): { attributes: AttributeKey[]; description: string } | null {
    const classAttrs = CLASS_PRIMARY_ATTRIBUTES[className];
    if (!classAttrs) return null;

    // 1. Filtrar atributos primários que ainda não estão no máximo (20)
    const availablePrimary = classAttrs.primary
        .filter(attr => (currentAttributes[attr] || 10) < 20);

    // 2. Se tiver 2+ primários disponíveis, retorna eles
    if (availablePrimary.length >= 2) {
        return {
            attributes: availablePrimary.slice(0, 2),
            description: classAttrs.description
        };
    }

    // 3. Se só tiver 1 primário, pega 1 secundário
    if (availablePrimary.length === 1) {
        const availableSecondary = classAttrs.secondary
            .filter(attr => (currentAttributes[attr] || 10) < 20);

        if (availableSecondary.length > 0) {
            return {
                attributes: [availablePrimary[0], availableSecondary[0]],
                description: classAttrs.description
            };
        }

        // Se não tiver secundário disponível, retorna só o primário
        return {
            attributes: [availablePrimary[0]],
            description: classAttrs.description
        };
    }

    // 4. Se todos primários estão em 20, pega secundários
    const availableSecondary = classAttrs.secondary
        .filter(attr => (currentAttributes[attr] || 10) < 20);

    if (availableSecondary.length > 0) {
        return {
            attributes: availableSecondary.slice(0, 2),
            description: "Atributos primários já maximizados. Sugerindo secundários."
        };
    }

    // 5. Todos os atributos estão no máximo (caso raro)
    return {
        attributes: [],
        description: "Todos os atributos principais já estão no máximo!"
    };
}
