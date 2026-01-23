
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

    // Carisma > Con > Dex
    "Bruxo": ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
};

