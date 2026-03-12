
export interface MonsterAction {
    name: string;
    description: string;
    type?: 'action' | 'legendary' | 'reaction' | 'bonus' | 'trait';
}

export interface MonsterData {
    name: string;
    hp: number;
    ac: number;
    challenge: string;
    type: string;
    xp: number;
    dexterity: number;
    strength?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
    speed?: string;
    senses?: string;
    languages?: string;
    actions?: MonsterAction[];
    resistances?: string;
    vulnerabilities?: string;
    immunities?: string;
    condition_immunities?: string;
}

// Lista curada e sem duplicatas
export const dndMonsters: MonsterData[] = [
    // CR 0
    { name: "Aranha", hp: 1, ac: 12, challenge: "0", type: "Fera", xp: 10, dexterity: 14 },
    { name: "Coruja", hp: 1, ac: 11, challenge: "0", type: "Fera", xp: 10, dexterity: 13 },
    { name: "Homúnculo", hp: 5, ac: 13, challenge: "0", type: "Constructo", xp: 10, dexterity: 15 },
    { name: "Lemure", hp: 13, ac: 7, challenge: "0", type: "Fiande", xp: 10, dexterity: 5 },
    // Plebeu removido (ver aba NPCs)
    { name: "Rato", hp: 1, ac: 10, challenge: "0", type: "Fera", xp: 10, dexterity: 11 },
    { name: "Sapo Gigante", hp: 4, ac: 11, challenge: "0", type: "Fera", xp: 10, dexterity: 13 },
    { name: "Shrieker", hp: 13, ac: 5, challenge: "0", type: "Planta", xp: 10, dexterity: 1 },

    // CR 1/8
    // Bandido removido (ver aba NPCs)
    { name: "Cobra Venenosa", hp: 2, ac: 13, challenge: "1/8", type: "Fera", xp: 25, dexterity: 16 },
    // Cultista removido (ver aba NPCs)
    { name: "Esqueleto Gigante", hp: 13, ac: 13, challenge: "1/8", type: "Morto-vivo", xp: 25, dexterity: 14 },
    // Guarda removido (ver aba NPCs)
    { name: "Kobold", hp: 5, ac: 12, challenge: "1/8", type: "Humanoide", xp: 25, dexterity: 15 },
    { name: "Rato Gigante", hp: 7, ac: 12, challenge: "1/8", type: "Fera", xp: 25, dexterity: 15 },
    { name: "Stirge", hp: 2, ac: 14, challenge: "1/8", type: "Fera", xp: 25, dexterity: 19 },

    // CR 1/4
    // Acólito removido (ver aba NPCs)
    { name: "Bico de Machado", hp: 19, ac: 11, challenge: "1/4", type: "Fera", xp: 50, dexterity: 12 },
    { name: "Drow", hp: 13, ac: 15, challenge: "1/4", type: "Humanoide", xp: 50, dexterity: 14 },
    { name: "Esqueleto", hp: 13, ac: 13, challenge: "1/4", type: "Morto-vivo", xp: 50, dexterity: 14 },
    { name: "Fungo Violeta", hp: 18, ac: 5, challenge: "1/4", type: "Planta", xp: 50, dexterity: 1 },
    { 
        name: "Goblin", 
        hp: 7, 
        ac: 15, 
        challenge: "1/4", 
        type: "Humanoide", 
        xp: 50, 
        strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8,
        speed: "9m",
        senses: "Visão no Escuro (18m), Percepção Passiva 9",
        languages: "Comum, Goblinoide",
        actions: [
            { name: "Fuga Ágil", description: "O goblin pode realizar as ações de Desengajar ou Esconder-se como uma ação bônus em cada um dos seus turnos.", type: "trait" },
            { name: "Cimitarra", description: "Ataque Corpo-a-Corpo com Arma: +4 para atingir, alcance 1,5m, um alvo. Dano: 5 (1d6 + 2) de dano cortante." },
            { name: "Arco Curto", description: "Ataque de Arma à Distância: +4 para atingir, alcance 24m/96m, um alvo. Dano: 5 (1d6 + 2) de dano perfurante." }
        ]
    },
    { name: "Kenku", hp: 13, ac: 13, challenge: "1/4", type: "Humanoide", xp: 50, dexterity: 16 },
    { name: "Kobold Alado", hp: 7, ac: 13, challenge: "1/4", type: "Humanoide", xp: 50, dexterity: 16 },
    { 
        name: "Lobo", 
        hp: 11, 
        ac: 13, 
        challenge: "1/4", 
        type: "Fera", 
        xp: 50, 
        strength: 12, dexterity: 15, constitution: 12, intelligence: 3, wisdom: 12, charisma: 6,
        speed: "12m",
        senses: "Percepção Passiva 13",
        actions: [
            { name: "Sentidos Apurados", description: "O lobo possui vantagem em testes de Sabedoria (Percepção) que dependam da audição ou do olfato.", type: "trait" },
            { name: "Táticas de Matilha", description: "O lobo possui vantagem nas jogadas de ataque contra uma criatura se, pelo menos, um dos aliados do lobo estiver a 1,5 metro da criatura e o aliado não estiver incapacitado.", type: "trait" },
            { name: "Mordida", description: "Ataque Corpo-a-Corpo com Arma: +4 para atingir, alcance 1,5m, um alvo. Dano: 7 (2d4 + 2) de dano perfurante. Se o alvo for uma criatura, ele deve ser bem sucedido num teste de resistência de Força CD 11 ou será derrubado." }
        ]
    },
    { name: "Mephit de Vapor", hp: 21, ac: 10, challenge: "1/4", type: "Elemental", xp: 50, dexterity: 11 },
    { name: "Pseudodragão", hp: 7, ac: 13, challenge: "1/4", type: "Dragão", xp: 50, dexterity: 15 },
    { name: "Sprite", hp: 2, ac: 15, challenge: "1/4", type: "Fada", xp: 50, dexterity: 18 },
    { name: "Zumbi", hp: 22, ac: 8, challenge: "1/4", type: "Morto-vivo", xp: 50, dexterity: 6 },

    // CR 1/2
    { name: "Cockatrice", hp: 27, ac: 11, challenge: "1/2", type: "Monstruosidade", xp: 100, dexterity: 12 },
    { name: "Darkmantle", hp: 22, ac: 11, challenge: "1/2", type: "Monstruosidade", xp: 100, dexterity: 12 },
    { name: "Gás Esporo", hp: 1, ac: 10, challenge: "1/2", type: "Planta", xp: 100, dexterity: 10 },
    { name: "Gnoll", hp: 22, ac: 15, challenge: "1/2", type: "Humanoide", xp: 100, dexterity: 12 },
    { name: "Hobgoblin", hp: 11, ac: 18, challenge: "1/2", type: "Humanoide", xp: 100, dexterity: 12 },
    { name: "Lizardfolk", hp: 22, ac: 15, challenge: "1/2", type: "Humanoide", xp: 100, dexterity: 10 },
    { name: "Orc", hp: 15, ac: 13, challenge: "1/2", type: "Humanoide", xp: 100, dexterity: 12 },
    { name: "Rust Monster", hp: 27, ac: 14, challenge: "1/2", type: "Monstruosidade", xp: 100, dexterity: 13 },
    { name: "Sahuagin", hp: 22, ac: 12, challenge: "1/2", type: "Humanoide", xp: 100, dexterity: 11 },
    { name: "Sater", hp: 31, ac: 14, challenge: "1/2", type: "Fada", xp: 100, dexterity: 16 },
    { name: "Sombra", hp: 16, ac: 12, challenge: "1/2", type: "Morto-vivo", xp: 100, dexterity: 14 },
    { name: "Worg", hp: 26, ac: 13, challenge: "1/2", type: "Monstruosidade", xp: 100, dexterity: 13 },

    // CR 1
    { name: "Animated Armor", hp: 33, ac: 18, challenge: "1", type: "Constructo", xp: 200, dexterity: 11 },
    { name: "Aranha Gigante", hp: 26, ac: 14, challenge: "1", type: "Fera", xp: 200, dexterity: 16 },
    { name: "Bugbear", hp: 27, ac: 16, challenge: "1", type: "Humanoide", xp: 200, dexterity: 14 },
    { name: "Dragão de Latão Jovem (Wyrmling)", hp: 16, ac: 17, challenge: "1", type: "Dragão", xp: 200, dexterity: 10 },
    { name: "Dríade", hp: 22, ac: 11, challenge: "1", type: "Fada", xp: 200, dexterity: 12 },
    { name: "Duergar", hp: 26, ac: 16, challenge: "1", type: "Humanoide", xp: 200, dexterity: 11 },
    { name: "Espectro", hp: 22, ac: 12, challenge: "1", type: "Morto-vivo", xp: 200, dexterity: 14 },
    { name: "Ghoul", hp: 22, ac: 12, challenge: "1", type: "Morto-vivo", xp: 200, dexterity: 15 },
    { name: "Harpia", hp: 38, ac: 11, challenge: "1", type: "Monstruosidade", xp: 200, dexterity: 13 },
    { name: "Hipogrifo", hp: 19, ac: 11, challenge: "1", type: "Monstruosidade", xp: 200, dexterity: 13 },
    { name: "Imp", hp: 10, ac: 13, challenge: "1", type: "Fiande", xp: 200, dexterity: 17 },
    { name: "Quasit", hp: 7, ac: 13, challenge: "1", type: "Fiande", xp: 200, dexterity: 17 },
    { name: "Urso Marrom", hp: 34, ac: 11, challenge: "1", type: "Fera", xp: 200, dexterity: 10 },

    // CR 2
    { name: "Ankheg", hp: 39, ac: 14, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 11 },
    { name: "Azer", hp: 39, ac: 17, challenge: "2", type: "Elemental", xp: 450, dexterity: 12 },
    { name: "Carrion Crawler", hp: 51, ac: 13, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 13 },
    { name: "Centauro", hp: 45, ac: 12, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 14 },
    { name: "Dragão Branco Jovem (Wyrmling)", hp: 32, ac: 17, challenge: "2", type: "Dragão", xp: 450, dexterity: 10 },
    { name: "Ettercap", hp: 44, ac: 13, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 14 },
    { name: "Gárgula", hp: 52, ac: 15, challenge: "2", type: "Elemental", xp: 450, dexterity: 11 },
    { name: "Gelatina Ocre", hp: 45, ac: 8, challenge: "2", type: "Limo", xp: 450, dexterity: 6 },
    { name: "Ghast", hp: 36, ac: 13, challenge: "2", type: "Morto-vivo", xp: 450, dexterity: 17 },
    { name: "Grifo", hp: 59, ac: 12, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 15 },
    { name: "Minotauro Esqueleto", hp: 67, ac: 12, challenge: "2", type: "Morto-vivo", xp: 450, dexterity: 11 },
    { name: "Mímico", hp: 58, ac: 12, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 12 },
    { name: "Ogro", hp: 59, ac: 11, challenge: "2", type: "Gigante", xp: 450, dexterity: 8 },
    { name: "Peryton", hp: 33, ac: 13, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 12 },
    { name: "Ruggin (Gamo Gigante)", hp: 45, ac: 12, challenge: "2", type: "Fera", xp: 450, dexterity: 12 },
    { name: "Will-o'-Wisp", hp: 22, ac: 19, challenge: "2", type: "Morto-vivo", xp: 450, dexterity: 28 },

    // CR 3
    { name: "Basilisco", hp: 52, ac: 15, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 8 },
    { name: "Cão Infernal", hp: 45, ac: 15, challenge: "3", type: "Fiande", xp: 700, dexterity: 12 },
    { name: "Displacer Beast", hp: 85, ac: 13, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 15 },
    { name: "Doppelganger", hp: 52, ac: 14, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 18 },
    { name: "Dragão Azul Jovem (Wyrmling)", hp: 52, ac: 18, challenge: "3", type: "Dragão", xp: 700, dexterity: 10 },
    { name: "Dragão Verde Jovem (Wyrmling)", hp: 45, ac: 17, challenge: "3", type: "Dragão", xp: 700, dexterity: 12 },
    { name: "Lobisomem", hp: 58, ac: 11, challenge: "3", type: "Humanoide", xp: 700, dexterity: 13 },
    { name: "Mantícora", hp: 68, ac: 14, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 16 },
    { name: "Minotauro", hp: 76, ac: 14, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 10 },
    { name: "Múmia", hp: 58, ac: 11, challenge: "3", type: "Morto-vivo", xp: 700, dexterity: 8 },
    { name: "Nightmare", hp: 68, ac: 13, challenge: "3", type: "Fiande", xp: 700, dexterity: 15 },
    { name: "Urso-Coruja", hp: 59, ac: 13, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 12 },
    { name: "Wight", hp: 45, ac: 14, challenge: "3", type: "Morto-vivo", xp: 700, dexterity: 14 },
    { name: "Winter Wolf", hp: 75, ac: 13, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 13 },
    { name: "Lobo Atroz", hp: 37, ac: 14, challenge: "1", type: "Fera", xp: 200, dexterity: 15 },
    { name: "Yeti", hp: 51, ac: 12, challenge: "3", type: "Monstruosidade", xp: 700, dexterity: 13 },

    // CR 4
    { name: "Banshee", hp: 58, ac: 12, challenge: "4", type: "Morto-vivo", xp: 1100, dexterity: 14 },
    { name: "Black Pudding", hp: 85, ac: 7, challenge: "4", type: "Limo", xp: 1100, dexterity: 5 },
    { name: "Chuul", hp: 93, ac: 16, challenge: "4", type: "Aberração", xp: 1100, dexterity: 10 },
    { 
        name: "Dragão Vermelho Jovem (Wyrmling)", 
        hp: 75, 
        ac: 17, 
        challenge: "4", 
        type: "Dragão", 
        xp: 1100, 
        strength: 19, dexterity: 10, constitution: 17, intelligence: 12, wisdom: 11, charisma: 15,
        speed: "9m, voo 18m",
        senses: "Percepção Cega 3m, Visão no Escuro 18m, Percepção Passiva 14",
        languages: "Dracônico",
        actions: [
            { name: "Mordida", description: "Ataque Corpo-a-Corpo com Arma: +6 para atingir, alcance 1,5m, um alvo. Dano: 9 (1d10 + 4) de dano perfurante mais 3 (1d6) de dano de fogo." },
            { name: "Sopro de Fogo (Recarga 5-6)", description: "O dragão exala fogo em um cone de 4,5 metros. Cada criatura na área deve realizar um teste de resistência de Destreza CD 13, sofrendo 24 (7d6) de dano de fogo se falhar, ou metade desse dano caso obtenha sucesso." }
        ]
    },
    { name: "Ettin", hp: 85, ac: 12, challenge: "4", type: "Gigante", xp: 1100, dexterity: 8 },
    { name: "Fantasma", hp: 45, ac: 11, challenge: "4", type: "Morto-vivo", xp: 1100, dexterity: 13 },
    { name: "Helmed Horror", hp: 60, ac: 20, challenge: "4", type: "Constructo", xp: 1100, dexterity: 13 },
    { name: "Lamia", hp: 97, ac: 13, challenge: "4", type: "Monstruosidade", xp: 1100, dexterity: 13 },
    { name: "Naga de Osso", hp: 58, ac: 15, challenge: "4", type: "Morto-vivo", xp: 1100, dexterity: 16 },
    { name: "Súcubo / Íncubo", hp: 66, ac: 15, challenge: "4", type: "Fiande", xp: 1100, dexterity: 17 },

    // CR 5
    { name: "Aparição (Wraith)", hp: 67, ac: 13, challenge: "5", type: "Morto-vivo", xp: 1800, dexterity: 16 },
    { name: "Barbed Devil", hp: 110, ac: 15, challenge: "5", type: "Fiande", xp: 1800, dexterity: 17 },
    { name: "Barlgura", hp: 68, ac: 15, challenge: "5", type: "Fiande", xp: 1800, dexterity: 15 },
    { name: "Bulette", hp: 94, ac: 17, challenge: "5", type: "Monstruosidade", xp: 1800, dexterity: 11 },
    { name: "Elemental da Água", hp: 114, ac: 14, challenge: "5", type: "Elemental", xp: 1800, dexterity: 14 },
    { name: "Elemental da Terra", hp: 126, ac: 17, challenge: "5", type: "Elemental", xp: 1800, dexterity: 8 },
    { name: "Elemental do Ar", hp: 90, ac: 15, challenge: "5", type: "Elemental", xp: 1800, dexterity: 20 },
    { name: "Elemental do Fogo", hp: 102, ac: 13, challenge: "5", type: "Elemental", xp: 1800, dexterity: 17 },
    { name: "Gigante das Colinas", hp: 105, ac: 13, challenge: "5", type: "Gigante", xp: 1800, dexterity: 8 },
    { name: "Golem de Carne", hp: 93, ac: 9, challenge: "5", type: "Constructo", xp: 1800, dexterity: 9 },
    { name: "Gorgon", hp: 114, ac: 19, challenge: "5", type: "Monstruosidade", xp: 1800, dexterity: 10 },
    { name: "Montículo Errante", hp: 136, ac: 15, challenge: "5", type: "Planta", xp: 1800, dexterity: 10 },
    { name: "Otyugh", hp: 114, ac: 14, challenge: "5", type: "Aberração", xp: 1800, dexterity: 11 },
    { name: "Revenant", hp: 136, ac: 13, challenge: "5", type: "Morto-vivo", xp: 1800, dexterity: 14 },
    { name: "Roper", hp: 93, ac: 20, challenge: "5", type: "Monstruosidade", xp: 1800, dexterity: 8 },
    { name: "Salamandra", hp: 90, ac: 15, challenge: "5", type: "Elemental", xp: 1800, dexterity: 14 },
    { name: "Troll", hp: 84, ac: 15, challenge: "5", type: "Gigante", xp: 1800, dexterity: 13 },
    { name: "Unicórnio", hp: 67, ac: 12, challenge: "5", type: "Celestial", xp: 1800, dexterity: 14 },
    { name: "Vampiro (Spawn)", hp: 82, ac: 15, challenge: "5", type: "Morto-vivo", xp: 1800, dexterity: 16 },
    { name: "Xorn", hp: 73, ac: 19, challenge: "5", type: "Elemental", xp: 1800, dexterity: 10 },

    // CR 6
    { name: "Cyclops", hp: 138, ac: 14, challenge: "6", type: "Gigante", xp: 2300, dexterity: 10 },
    { name: "Dragão Branco Jovem", hp: 133, ac: 17, challenge: "6", type: "Dragão", xp: 2300, dexterity: 10 },
    { name: "Dragão de Latão Jovem", hp: 110, ac: 17, challenge: "6", type: "Dragão", xp: 2300, dexterity: 10 },
    { name: "Drider", hp: 123, ac: 19, challenge: "6", type: "Monstruosidade", xp: 2300, dexterity: 16 },
    { name: "Galeb Duhr", hp: 85, ac: 16, challenge: "6", type: "Elemental", xp: 2300, dexterity: 14 },
    { name: "Invisible Stalker", hp: 104, ac: 14, challenge: "6", type: "Elemental", xp: 2300, dexterity: 19 },
    { name: "Medusa", hp: 127, ac: 15, challenge: "6", type: "Monstruosidade", xp: 2300, dexterity: 15 },
    { name: "Quimera", hp: 114, ac: 14, challenge: "6", type: "Monstruosidade", xp: 2300, dexterity: 11 },
    { name: "Vrock", hp: 104, ac: 15, challenge: "6", type: "Fiande", xp: 2300, dexterity: 15 },
    { name: "Wyvern", hp: 110, ac: 13, challenge: "6", type: "Dragão", xp: 2300, dexterity: 10 },

    // CR 7
    { name: "Dragão de Cobre Jovem", hp: 119, ac: 17, challenge: "7", type: "Dragão", xp: 2900, dexterity: 12 },
    { name: "Dragão Preto Jovem", hp: 127, ac: 18, challenge: "7", type: "Dragão", xp: 2900, dexterity: 14 },
    { name: "Gigante de Pedra", hp: 126, ac: 17, challenge: "7", type: "Gigante", xp: 2900, dexterity: 15 },
    { name: "Mind Flayer", hp: 71, ac: 15, challenge: "7", type: "Aberração", xp: 2900, dexterity: 12 },
    { name: "Oni", hp: 110, ac: 16, challenge: "7", type: "Gigante", xp: 2900, dexterity: 11 },
    { name: "Shield Guardian", hp: 142, ac: 17, challenge: "7", type: "Constructo", xp: 2900, dexterity: 8 },

    // CR 8
    { name: "Chain Devil", hp: 85, ac: 16, challenge: "8", type: "Fiande", xp: 3900, dexterity: 15 },
    { name: "Cloaker", hp: 78, ac: 14, challenge: "8", type: "Aberração", xp: 3900, dexterity: 15 },
    { name: "Dragão de Bronze Jovem", hp: 142, ac: 18, challenge: "8", type: "Dragão", xp: 3900, dexterity: 10 },
    { name: "Dragão Verde Jovem", hp: 136, ac: 18, challenge: "8", type: "Dragão", xp: 3900, dexterity: 12 },
    { name: "Fomorian", hp: 149, ac: 14, challenge: "8", type: "Gigante", xp: 3900, dexterity: 10 },
    { name: "Hezrou", hp: 136, ac: 16, challenge: "8", type: "Fiande", xp: 3900, dexterity: 17 },
    { name: "Hidra", hp: 172, ac: 15, challenge: "8", type: "Monstruosidade", xp: 3900, dexterity: 12 },
    { name: "T-Rex", hp: 136, ac: 13, challenge: "8", type: "Fera", xp: 3900, dexterity: 10 },
    { name: "Verme do Gelo", hp: 114, ac: 18, challenge: "8", type: "Monstruosidade", xp: 3900, dexterity: 10 },

    // CR 9
    { name: "Abominable Yeti", hp: 137, ac: 15, challenge: "9", type: "Monstruosidade", xp: 5000, dexterity: 10 },
    { name: "Bone Devil", hp: 142, ac: 19, challenge: "9", type: "Fiande", xp: 5000, dexterity: 16 },
    { name: "Dragão Azul Jovem", hp: 152, ac: 19, challenge: "9", type: "Dragão", xp: 5000, dexterity: 10 },
    { name: "Dragão de Prata Jovem", hp: 168, ac: 19, challenge: "9", type: "Dragão", xp: 5000, dexterity: 10 },
    { name: "Gigante das Nuvens", hp: 200, ac: 14, challenge: "9", type: "Gigante", xp: 5000, dexterity: 10 },
    { name: "Gigante do Fogo", hp: 162, ac: 18, challenge: "9", type: "Gigante", xp: 5000, dexterity: 9 },
    { name: "Glabrezu", hp: 157, ac: 17, challenge: "9", type: "Fiande", xp: 5000, dexterity: 15 },
    { name: "Nycaloth", hp: 123, ac: 18, challenge: "9", type: "Fiande", xp: 5000, dexterity: 11 },
    { name: "Treant", hp: 138, ac: 16, challenge: "9", type: "Planta", xp: 5000, dexterity: 8 },

    // CR 10
    { name: "Aboleth", hp: 135, ac: 17, challenge: "10", type: "Aberração", xp: 5900, dexterity: 9 },
    { name: "Dragão de Ouro Jovem", hp: 178, ac: 18, challenge: "10", type: "Dragão", xp: 5900, dexterity: 14 },
    { name: "Dragão Vermelho Jovem", hp: 178, ac: 18, challenge: "10", type: "Dragão", xp: 5900, dexterity: 10 },
    { name: "Golem de Pedra", hp: 178, ac: 17, challenge: "10", type: "Constructo", xp: 5900, dexterity: 9 },
    { name: "Guardian Naga", hp: 127, ac: 18, challenge: "10", type: "Monstruosidade", xp: 5900, dexterity: 18 },
    { name: "Slaad da Morte", hp: 170, ac: 18, challenge: "10", type: "Aberração", xp: 5900, dexterity: 15 },
    { name: "Yochlol", hp: 136, ac: 15, challenge: "10", type: "Fiande", xp: 5900, dexterity: 14 },

    // CR 11
    { name: "Behir", hp: 168, ac: 17, challenge: "11", type: "Monstruosidade", xp: 7200, dexterity: 16 },
    { name: "Djinni", hp: 161, ac: 17, challenge: "11", type: "Elemental", xp: 7200, dexterity: 15 },
    { name: "Efreeti", hp: 200, ac: 17, challenge: "11", type: "Elemental", xp: 7200, dexterity: 12 },
    { name: "Esfinge (Gynosphinx)", hp: 136, ac: 17, challenge: "11", type: "Monstruosidade", xp: 7200, dexterity: 15 },
    { name: "Horned Devil", hp: 178, ac: 17, challenge: "11", type: "Fiande", xp: 7200, dexterity: 17 },
    { name: "Remorhaz", hp: 195, ac: 17, challenge: "11", type: "Monstruosidade", xp: 7200, dexterity: 13 },
    { name: "Roc", hp: 248, ac: 15, challenge: "11", type: "Monstruosidade", xp: 7200, dexterity: 10 },

    // CR 12
    { name: "Arcanaloth", hp: 104, ac: 17, challenge: "12", type: "Fiande", xp: 8400, dexterity: 12 },
    { name: "Erinyes", hp: 153, ac: 18, challenge: "12", type: "Fiande", xp: 8400, dexterity: 16 },

    // CR 13
    { name: "Beholder", hp: 180, ac: 18, challenge: "13", type: "Aberração", xp: 10000, dexterity: 14 },
    { name: "Dragão Branco Adulto", hp: 200, ac: 18, challenge: "13", type: "Dragão", xp: 10000, dexterity: 10 },
    { name: "Dragão de Latão Adulto", hp: 172, ac: 18, challenge: "13", type: "Dragão", xp: 10000, dexterity: 10 },
    { name: "Gigante da Tempestade", hp: 230, ac: 16, challenge: "13", type: "Gigante", xp: 10000, dexterity: 14 },
    { name: "Nalfeshnee", hp: 184, ac: 18, challenge: "13", type: "Fiande", xp: 10000, dexterity: 10 },
    { name: "Rakshasa", hp: 110, ac: 16, challenge: "13", type: "Fiande", xp: 10000, dexterity: 17 },
    { name: "Vampiro", hp: 144, ac: 16, challenge: "13", type: "Morto-vivo", xp: 10000, dexterity: 18 },

    // CR 14
    { name: "Dragão de Cobre Adulto", hp: 184, ac: 18, challenge: "14", type: "Dragão", xp: 11500, dexterity: 12 },
    { name: "Dragão Preto Adulto", hp: 195, ac: 19, challenge: "14", type: "Dragão", xp: 11500, dexterity: 14 },
    { name: "Ice Devil", hp: 180, ac: 18, challenge: "14", type: "Fiande", xp: 11500, dexterity: 14 },

    // CR 15
    { name: "Dragão de Bronze Adulto", hp: 212, ac: 19, challenge: "15", type: "Dragão", xp: 13000, dexterity: 10 },
    { name: "Dragão Verde Adulto", hp: 207, ac: 19, challenge: "15", type: "Dragão", xp: 13000, dexterity: 12 },
    { name: "Múmia Lord", hp: 97, ac: 17, challenge: "15", type: "Morto-vivo", xp: 13000, dexterity: 10 },
    { name: "Verme Púrpura", hp: 247, ac: 18, challenge: "15", type: "Monstruosidade", xp: 13000, dexterity: 13 },

    // CR 16
    { name: "Dragão Azul Adulto", hp: 225, ac: 19, challenge: "16", type: "Dragão", xp: 15000, dexterity: 10 },
    { name: "Dragão de Prata Adulto", hp: 243, ac: 19, challenge: "16", type: "Dragão", xp: 15000, dexterity: 10 },
    { name: "Golem de Ferro", hp: 210, ac: 20, challenge: "16", type: "Constructo", xp: 15000, dexterity: 9 },
    { name: "Marilith", hp: 189, ac: 18, challenge: "16", type: "Fiande", xp: 15000, dexterity: 20 },
    { name: "Planetar", hp: 200, ac: 19, challenge: "16", type: "Celestial", xp: 15000, dexterity: 20 },

    // CR 17
    { name: "Androsphinx", hp: 199, ac: 17, challenge: "17", type: "Monstruosidade", xp: 18000, dexterity: 10 },
    { name: "Dracolich (Blue)", hp: 225, ac: 19, challenge: "17", type: "Morto-vivo", xp: 18000, dexterity: 10 },
    { name: "Dragão de Ouro Adulto", hp: 256, ac: 19, challenge: "17", type: "Dragão", xp: 18000, dexterity: 14 },
    { name: "Dragão Vermelho Adulto", hp: 256, ac: 19, challenge: "17", type: "Dragão", xp: 18000, dexterity: 10 },
    { name: "Goristro", hp: 310, ac: 19, challenge: "17", type: "Fiande", xp: 18000, dexterity: 11 },

    // CR 19+
    { name: "Balor", hp: 262, ac: 19, challenge: "19", type: "Fiande", xp: 22000, dexterity: 15 },
    { name: "Pit Fiend", hp: 300, ac: 19, challenge: "20", type: "Fiande", xp: 25000, dexterity: 14 },
    { name: "Lich", hp: 135, ac: 17, challenge: "21", type: "Morto-vivo", xp: 33000, dexterity: 16 },
    { name: "Solar", hp: 243, ac: 21, challenge: "21", type: "Celestial", xp: 33000, dexterity: 22 },
    { name: "Kraken", hp: 472, ac: 18, challenge: "23", type: "Monstruosidade", xp: 50000, dexterity: 10 },
    { name: "Dragão de Ouro Ancião", hp: 546, ac: 22, challenge: "24", type: "Dragão", xp: 62000, dexterity: 14 },
    { name: "Dragão Vermelho Ancião", hp: 546, ac: 22, challenge: "24", type: "Dragão", xp: 62000, dexterity: 10 },
    { name: "Tarrasque", hp: 676, ac: 25, challenge: "30", type: "Monstruosidade", xp: 155000, dexterity: 11 },

    // NOVAS ADIÇÕES - EXPANSÃO MASSIVA
    { name: "Aparência de Gazebo", hp: 50, ac: 15, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 10 },
    { name: "Bebê Dragão de Prata", hp: 45, ac: 18, challenge: "2", type: "Dragão", xp: 450, dexterity: 10 },
    { name: "Canto das Sereias", hp: 38, ac: 12, challenge: "1", type: "Monstruosidade", xp: 200, dexterity: 13 },
    { name: "Cão de Montaria", hp: 11, ac: 12, challenge: "1/8", type: "Fera", xp: 25, dexterity: 12 },
    { name: "Pantera", hp: 13, ac: 12, challenge: "1/4", type: "Fera", xp: 50, dexterity: 15 },
    { name: "Tubarão Caçador", hp: 45, ac: 12, challenge: "2", type: "Fera", xp: 450, dexterity: 13 },
    { name: "Elefante", hp: 76, ac: 12, challenge: "4", type: "Fera", xp: 1100, dexterity: 9 },
    { name: "Mamute", hp: 126, ac: 13, challenge: "6", type: "Fera", xp: 2300, dexterity: 9 },
    { name: "Constritora Gigante", hp: 60, ac: 12, challenge: "2", type: "Fera", xp: 450, dexterity: 14 },
    { name: "Alce Gigante", hp: 42, ac: 13, challenge: "2", type: "Fera", xp: 450, dexterity: 16 },
    { name: "Águia Gigante", hp: 26, ac: 13, challenge: "1", type: "Fera", xp: 200, dexterity: 17 },
    { name: "Abutre Gigante", hp: 22, ac: 10, challenge: "1", type: "Fera", xp: 200, dexterity: 10 },
    { name: "Morsa Gigante", hp: 30, ac: 12, challenge: "1", type: "Fera", xp: 200, dexterity: 10 },
    { name: "Urso Polar", hp: 42, ac: 12, challenge: "2", type: "Fera", xp: 450, dexterity: 10 },
    { name: "Grick", hp: 27, ac: 14, challenge: "2", type: "Monstruosidade", xp: 450, dexterity: 14 },
    { name: "Grick Alpha", hp: 75, ac: 18, challenge: "7", type: "Monstruosidade", xp: 2900, dexterity: 14 },
    { name: "Gibbering Mouther", hp: 67, ac: 9, challenge: "2", type: "Aberração", xp: 450, dexterity: 8 },
    { name: "Flesh Golem", hp: 93, ac: 9, challenge: "5", type: "Constructo", xp: 1800, dexterity: 9 },
    { name: "Stone Golem", hp: 178, ac: 17, challenge: "10", type: "Constructo", xp: 5900, dexterity: 9 },
    { name: "Iron Golem", hp: 210, ac: 20, challenge: "16", type: "Constructo", xp: 15000, dexterity: 9 },

    { name: "Wraith", hp: 67, ac: 13, challenge: "5", type: "Morto-vivo", xp: 1800, dexterity: 16 },


    { name: "Shadow", hp: 16, ac: 12, challenge: "1/2", type: "Morto-vivo", xp: 100, dexterity: 14 },
    { name: "Allosaurus", hp: 51, ac: 13, challenge: "2", type: "Fera", xp: 450, dexterity: 12 },
    { name: "Plesiosaurus", hp: 68, ac: 13, challenge: "2", type: "Fera", xp: 450, dexterity: 15 },
    { name: "Triceratops", hp: 95, ac: 13, challenge: "5", type: "Fera", xp: 1800, dexterity: 9 },
    { name: "Ankylosaurus", hp: 68, ac: 15, challenge: "3", type: "Fera", xp: 700, dexterity: 11 },
    { name: "Pteranodon", hp: 13, ac: 13, challenge: "1/4", type: "Fera", xp: 50, dexterity: 15 },












    { name: "Mephit de Poeira", hp: 5, ac: 12, challenge: "1/2", type: "Elemental", xp: 100, dexterity: 14 },
    { name: "Mephit de Gelo", hp: 21, ac: 11, challenge: "1/2", type: "Elemental", xp: 100, dexterity: 13 },
    { name: "Mephit de Magma", hp: 22, ac: 11, challenge: "1/2", type: "Elemental", xp: 100, dexterity: 12 },
    { name: "Mephit de Lama", hp: 27, ac: 11, challenge: "1/4", type: "Elemental", xp: 50, dexterity: 12 },
    { name: "Sahuagin Baron", hp: 76, ac: 16, challenge: "5", type: "Humanoide", xp: 1800, dexterity: 12 },
    { name: "Sahuagin Priestess", hp: 33, ac: 12, challenge: "2", type: "Humanoide", xp: 450, dexterity: 11 },
    { name: "Kuo-toa", hp: 18, ac: 13, challenge: "1/4", type: "Humanoide", xp: 50, dexterity: 10 },
    { name: "Kuo-toa Archpriest", hp: 97, ac: 13, challenge: "6", type: "Humanoide", xp: 2300, dexterity: 14 },
    { name: "Kuo-toa Whip", hp: 25, ac: 11, challenge: "1", type: "Humanoide", xp: 200, dexterity: 10 }
];
