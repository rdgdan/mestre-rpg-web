
// lib/class-proficiencies.ts

export interface ClassProficiencyData {
    savingThrows: string[]; // Atributos: 'strength', 'dexterity', etc. Use chaves minúsculas que combinem com o objeto attributes do personagem
    skills: {
        choose: number;
        from: string[]; // Chaves de perícia: 'acrobacia', 'arcanismo', etc.
    };
}

// Mapeamento de nomes de Skill para IDs usados no sistema (se necessário)
// Baseado no arquivo page.tsx, os IDs parecem ser chaves como 'acrobacia', 'adestrar_animais', etc.
// Vamos assumir nomes padrão em PT-BR minúsculos e sem acentos ou snake_case conforme convenção do projeto

export const CLASS_PROFICIENCIES: Record<string, ClassProficiencyData> = {
    "Bárbaro": {
        savingThrows: ["strength", "constitution"],
        skills: {
            choose: 2,
            from: ["animalHandling", "athletics", "intimidation", "nature", "perception", "survival"]
        }
    },
    "Bardo": {
        savingThrows: ["dexterity", "charisma"],
        skills: {
            choose: 3,
            from: [
                "acrobatics", "animalHandling", "arcana", "athletics", "performance", "deception",
                "stealth", "history", "intimidation", "insight", "investigation", "medicine",
                "nature", "perception", "persuasion", "sleightOfHand", "religion", "survival"
            ]
        }
    },
    "Clérigo": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["history", "insight", "medicine", "persuasion", "religion"]
        }
    },
    "Druida": {
        savingThrows: ["intelligence", "wisdom"],
        skills: {
            choose: 2,
            from: ["animalHandling", "arcana", "insight", "medicine", "nature", "perception", "religion", "survival"]
        }
    },
    "Guerreiro": {
        savingThrows: ["strength", "constitution"],
        skills: {
            choose: 2,
            from: ["acrobatics", "animalHandling", "athletics", "history", "intimidation", "insight", "perception", "survival"]
        }
    },
    "Monge": {
        savingThrows: ["strength", "dexterity"],
        skills: {
            choose: 2,
            from: ["acrobatics", "athletics", "stealth", "history", "insight", "religion"]
        }
    },
    "Paladino": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["athletics", "intimidation", "insight", "medicine", "persuasion", "religion"]
        }
    },
    "Patrulheiro": {
        savingThrows: ["strength", "dexterity"],
        skills: {
            choose: 3,
            from: ["animalHandling", "athletics", "stealth", "insight", "investigation", "nature", "perception", "survival"]
        }
    },
    "Ladino": {
        savingThrows: ["dexterity", "intelligence"],
        skills: {
            choose: 4,
            from: ["acrobatics", "athletics", "performance", "deception", "stealth", "intimidation", "insight", "investigation", "perception", "persuasion", "sleightOfHand"]
        }
    },
    "Feiticeiro": {
        savingThrows: ["constitution", "charisma"],
        skills: {
            choose: 2,
            from: ["arcana", "deception", "intimidation", "insight", "persuasion", "religion"]
        }
    },
    "Bruxo": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"]
        }
    },
    "Mago": {
        savingThrows: ["intelligence", "wisdom"],
        skills: {
            choose: 2,
            from: ["arcana", "history", "insight", "investigation", "medicine", "religion"]
        }
    },
    "Artífice": {
        savingThrows: ["constitution", "intelligence"],
        skills: {
            choose: 2,
            from: ["arcana", "history", "investigation", "medicine", "nature", "perception", "sleightOfHand"]
        }
    },
    "Anão da Montanha": {
        savingThrows: [],
        skills: {
            choose: 1,
            from: ["Ferramentas de Ferreiro", "Ferramentas de Cervejeiro", "Ferramentas de Pedreiro"]
        }
    },
    "Meio-Elfo": {
        savingThrows: [],
        skills: {
            choose: 2,
            from: [
                "acrobatics", "animalHandling", "arcana", "athletics", "performance", "deception",
                "stealth", "history", "intimidation", "insight", "investigation", "medicine",
                "nature", "perception", "persuasion", "sleightOfHand", "religion", "survival"
            ]
        }
    }
};
