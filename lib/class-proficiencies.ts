
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
            from: ["adestrar_animais", "atletismo", "intimidacao", "natureza", "percepcao", "sobrevivencia"]
        }
    },
    "Bardo": {
        savingThrows: ["dexterity", "charisma"],
        skills: {
            choose: 3,
            from: [
                "acrobacia", "adestrar_animais", "arcanismo", "atletismo", "atuacao", "enganaacao",
                "furtividade", "historia", "intimidacao", "intuicao", "investigacao", "medicina",
                "natureza", "percepcao", "persuasao", "prestidigitacao", "religiao", "sobrevivencia"
            ]
        }
    },
    "Clérigo": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["historia", "intuicao", "medicina", "persuasao", "religiao"]
        }
    },
    "Druida": {
        savingThrows: ["intelligence", "wisdom"],
        skills: {
            choose: 2,
            from: ["adestrar_animais", "arcanismo", "intuicao", "medicina", "natureza", "percepcao", "religiao", "sobrevivencia"]
        }
    },
    "Guerreiro": {
        savingThrows: ["strength", "constitution"],
        skills: {
            choose: 2,
            from: ["acrobacia", "adestrar_animais", "atletismo", "historia", "intimidacao", "intuicao", "percepcao", "sobrevivencia"]
        }
    },
    "Monge": {
        savingThrows: ["strength", "dexterity"],
        skills: {
            choose: 2,
            from: ["acrobacia", "atletismo", "furtividade", "historia", "intuicao", "religiao"]
        }
    },
    "Paladino": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["atletismo", "intimidacao", "intuicao", "medicina", "persuasao", "religiao"]
        }
    },
    "Patrulheiro": {
        savingThrows: ["strength", "dexterity"],
        skills: {
            choose: 3,
            from: ["adestrar_animais", "atletismo", "furtividade", "intuicao", "investigacao", "natureza", "percepcao", "sobrevivencia"]
        }
    },
    "Ladino": {
        savingThrows: ["dexterity", "intelligence"],
        skills: {
            choose: 4,
            from: ["acrobacia", "atletismo", "atuacao", "enganaacao", "furtividade", "intimidacao", "intuicao", "investigacao", "percepcao", "persuasao", "prestidigitacao"]
        }
    },
    "Feiticeiro": {
        savingThrows: ["constitution", "charisma"],
        skills: {
            choose: 2,
            from: ["arcanismo", "enganacao", "intimidacao", "intuicao", "persuasao", "religiao"]
        }
    },
    "Bruxo": {
        savingThrows: ["wisdom", "charisma"],
        skills: {
            choose: 2,
            from: ["arcanismo", "enganacao", "historia", "intimidacao", "investigacao", "natureza", "religiao"]
        }
    },
    "Mago": {
        savingThrows: ["intelligence", "wisdom"],
        skills: {
            choose: 2,
            from: ["arcanismo", "historia", "intuicao", "investigacao", "medicina", "religiao"]
        }
    }
};
