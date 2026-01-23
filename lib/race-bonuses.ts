
import { AttributeKey } from './character-data';

export const RACE_BONUSES: Record<string, Partial<Record<AttributeKey, number>>> = {
    "Anão da Colina": { constitution: 2, wisdom: 1 },
    "Anão da Montanha": { constitution: 2, strength: 2 },
    "Elfo Alto": { dexterity: 2, intelligence: 1 },
    "Elfo da Floresta": { dexterity: 2, wisdom: 1 },
    "Elfo Sombrio (Drow)": { dexterity: 2, charisma: 1 },
    "Halfling Pés Leves": { dexterity: 2, charisma: 1 },
    "Halfling Robusto": { dexterity: 2, constitution: 1 },
    "Humano": { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    "Draconato": { strength: 2, charisma: 1 },
    "Gnomo da Floresta": { intelligence: 2, dexterity: 1 },
    "Gnomo das Rochas": { intelligence: 2, constitution: 1 },
    "Meio-Elfo": { charisma: 2 }, // No D&D 5e, você escolhe outros 2, mas aqui vamos deixar o bônus principal e talvez permitir ajuste no modal
    "Meio-Orc": { strength: 2, constitution: 1 },
    "Tiefling": { charisma: 2, intelligence: 1 },
    "Aasimar": { charisma: 2 },
    "Firbolg": { wisdom: 2, strength: 1 },
    "Goliath": { strength: 2, constitution: 1 },
    "Kenku": { dexterity: 2, wisdom: 1 },
    "Lizardfolk": { constitution: 2, wisdom: 1 },
    "Tabaxi": { dexterity: 2, charisma: 1 },
    "Tritão": { strength: 1, constitution: 1, charisma: 1 },
    "Yuan-ti Pureblood": { charisma: 2, intelligence: 1 },
    "Genasi (Água)": { constitution: 2, wisdom: 1 },
    "Genasi (Ar)": { constitution: 2, dexterity: 1 },
    "Genasi (Fogo)": { constitution: 2, intelligence: 1 },
    "Genasi (Terra)": { constitution: 2, strength: 1 },
};
