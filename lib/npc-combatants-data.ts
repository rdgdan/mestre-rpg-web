
export interface NPCTemplate {
    name: string;
    hp: number;
    ac: number;
    challenge: string;
    description: string;
    xp: number;
    role?: string; // Papel: 'civilian', 'soldier', 'villain', 'specialist'
    race?: string;
}

export const npcTemplates: NPCTemplate[] = [
    // --- CIVIS E PROFISSÕES ---
    { name: "Plebeu", hp: 4, ac: 10, challenge: "0", description: "Um cidadão comum.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Ferreiro", hp: 12, ac: 12, challenge: "1/8", description: "Um artesão forte e resistente.", xp: 25, role: 'civilian', race: 'Humano' },
    { name: "Taverneiro", hp: 10, ac: 10, challenge: "0", description: "O dono do estabelecimento local.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Mercador", hp: 8, ac: 10, challenge: "0", description: "Um viajante negociante.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Fazendeiro", hp: 6, ac: 10, challenge: "0", description: "Trabalhador do campo.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Aristocrata", hp: 6, ac: 11, challenge: "0", description: "Membro da alta sociedade.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Escriba", hp: 4, ac: 10, challenge: "0", description: "Um estudioso ou burocrata.", xp: 10, role: 'civilian', race: 'Humano' },
    { name: "Menino de Rua", hp: 3, ac: 12, challenge: "0", description: "Uma criança ágil das ruas.", xp: 0, role: 'civilian', race: 'Humano' },

    // --- SOLDADOS E MERCENÁRIOS ---
    { name: "Guarda", hp: 11, ac: 16, challenge: "1/8", description: "Um soldado comum da cidade.", xp: 25, role: 'soldier', race: 'Humano' },
    { name: "Arqueiro", hp: 15, ac: 14, challenge: "1/4", description: "Soldado treinado com arco.", xp: 50, role: 'soldier', race: 'Humano' },
    { name: "Batedor", hp: 16, ac: 13, challenge: "1/2", description: "Especialista em exploração e furtividade.", xp: 100, role: 'soldier', race: 'Humano' },
    { name: "Bandido", hp: 11, ac: 12, challenge: "1/8", description: "Um mercenário ou ladrão de estrada.", xp: 25, role: 'soldier', race: 'Humano' },
    { name: "Capitão dos Bandidos", hp: 65, ac: 15, challenge: "2", description: "Líder de um bando de criminosos.", xp: 450, role: 'soldier', race: 'Humano' },
    { name: "Valentão", hp: 32, ac: 13, challenge: "1/2", description: "Um capanga forte.", xp: 100, role: 'soldier', race: 'Humano' },
    { name: "Berserker", hp: 67, ac: 13, challenge: "2", description: "Guerreiro movido pela fúria.", xp: 450, role: 'soldier', race: 'Humano' },
    { name: "Cavaleiro", hp: 52, ac: 18, challenge: "3", description: "Guerreiro montado de elite.", xp: 700, role: 'soldier', race: 'Humano' },
    { name: "Veterano", hp: 58, ac: 17, challenge: "3", description: "Um soldado experiente em muitas guerras.", xp: 700, role: 'soldier', race: 'Humano' },
    { name: "Gladiador", hp: 112, ac: 16, challenge: "5", description: "Campeão da arena.", xp: 1800, role: 'soldier', race: 'Humano' },
    { name: "Espião", hp: 27, ac: 12, challenge: "1", description: "Agente secreto e assassino.", xp: 200, role: 'specialist', race: 'Humano' },
    { name: "Assassino", hp: 78, ac: 15, challenge: "8", description: "Mestre da morte silenciosa.", xp: 3900, role: 'specialist', race: 'Humano' },

    // --- CONJURADORES ---
    { name: "Acólito", hp: 9, ac: 10, challenge: "1/4", description: "Servo júnior de um templo.", xp: 50, role: 'specialist', race: 'Humano' },
    { name: "Sacerdote", hp: 27, ac: 13, challenge: "2", description: "Líder religioso com poderes divinos.", xp: 450, role: 'specialist', race: 'Humano' },
    { name: "Mago Aprendiz", hp: 9, ac: 10, challenge: "1/4", description: "Estudante das artes arcanas.", xp: 50, role: 'specialist', race: 'Humano' },
    { name: "Mago", hp: 40, ac: 12, challenge: "6", description: "Conjurador arcano poderoso.", xp: 2300, role: 'specialist', race: 'Humano' },
    { name: "Arquimago", hp: 99, ac: 15, challenge: "12", description: "Mestre supremo da magia.", xp: 8400, role: 'specialist', race: 'Humano' },
    { name: "Druida", hp: 27, ac: 11, challenge: "2", description: "Protetor da natureza.", xp: 450, role: 'specialist', race: 'Humano' },
    { name: "Bardo", hp: 44, ac: 15, challenge: "2", description: "Artista e manipulador de magia.", xp: 450, role: 'specialist', race: 'Humano' },
    { name: "Bruxo (Cultista Fanático)", hp: 33, ac: 13, challenge: "2", description: "Servo de entidades sombrias.", xp: 450, role: 'villain', race: 'Humano' },

    // --- VARIANTES RACIAIS ---
    { name: "Guerreiro Anão", hp: 18, ac: 16, challenge: "1/2", description: "Defensor robusto das montanhas.", xp: 100, role: 'soldier', race: 'Anão' },
    { name: "Batedor Elfo", hp: 16, ac: 14, challenge: "1/2", description: "Arqueiro e rastreador da floresta.", xp: 100, role: 'soldier', race: 'Elfo' },
    { name: "Soldado Orc", hp: 15, ac: 13, challenge: "1/2", description: "Guerreiro brutal da tribo.", xp: 100, role: 'soldier', race: 'Orc' },
    { name: "Ladino Halfling", hp: 10, ac: 14, challenge: "1/4", description: "Pequeno e furtivo.", xp: 50, role: 'specialist', race: 'Halfling' },
    { name: "Guarda Hobgoblin", hp: 15, ac: 16, challenge: "1/2", description: "Soldado disciplinado.", xp: 100, role: 'soldier', race: 'Hobgoblin' },
    { name: "Guerreiro Drow", hp: 13, ac: 15, challenge: "1/4", description: "Guerreiro das profundezas.", xp: 50, role: 'soldier', race: 'Elfo Negro' },

    // --- VILÕES E INIMIGOS ---
    { name: "Cultista", hp: 9, ac: 12, challenge: "1/8", description: "Adorador de deuses proibidos.", xp: 25, role: 'villain', race: 'Humano' },
    { name: "Líder do Culto", hp: 50, ac: 14, challenge: "4", description: "Cabeça de uma seita perigosa.", xp: 1100, role: 'villain', race: 'Humano' },
    { name: "Necromante", hp: 60, ac: 12, challenge: "6", description: "Mago que ergue os mortos.", xp: 2300, role: 'villain', race: 'Humano' },
    { name: "Senhor da Guerra", hp: 120, ac: 18, challenge: "9", description: "Comandante militar temido.", xp: 5000, role: 'villain', race: 'Humano' },
    { name: "Cavaleiro da Morte", hp: 180, ac: 20, challenge: "17", description: "Paladino caído morto-vivo.", xp: 18000, role: 'villain', race: 'Morto-Vivo' },

    // --- ESPECIAIS ---
    { name: "Herói Iniciante", hp: 12, ac: 14, challenge: "1", description: "Um aventureiro começando sua jornada.", xp: 200, role: 'specialist', race: 'Humano' },
    { name: "Aventureiro Experiente", hp: 45, ac: 16, challenge: "5", description: "Um herói com muitas histórias.", xp: 1800, role: 'specialist', race: 'Humano' },
    { name: "Lenda Viva", hp: 150, ac: 20, challenge: "15", description: "Um herói conhecido em todo o reino.", xp: 13000, role: 'specialist', race: 'Humano' }
];

export function getNpcByRole(role: string): NPCTemplate[] {
    return npcTemplates.filter(t => t.role === role);
}

export function searchNpcs(query: string): NPCTemplate[] {
    const q = query.toLowerCase();
    return npcTemplates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.race?.toLowerCase().includes(q)
    );
}
