// lib/backgrounds-data.ts

export interface Background {
    id: string;
    name: string;
    description: string;
    skills: string[]; // Chaves do objeto SKILLS no character-data
    gold: number;
    equipment: string[];
}

export const BACKGROUNDS: Background[] = [
    {
        id: 'acolito',
        name: 'Acólito',
        description: 'Você passou sua vida servindo em um templo de um deus específico ou panteão de deuses.',
        skills: ['insight', 'religion'],
        gold: 15,
        equipment: ['Símbolo sagrado', 'Livro de orações', '5 varetas de incenso', 'Vestimentas', 'Roupas comuns', 'Algibeira']
    },
    {
        id: 'charlatao',
        name: 'Charlatão',
        description: 'Você sempre teve facilidade em lidar com pessoas e sabe como tirar vantagem disso.',
        skills: ['deception', 'sleightOfHand'],
        gold: 15,
        equipment: ['Roupas finas', 'Kit de disfarce', 'Ferramentas de trapaça', 'Algibeira']
    },
    {
        id: 'criminoso',
        name: 'Criminoso',
        description: 'Você é um criminoso experiente com um histórico de contravenções à lei.',
        skills: ['deception', 'stealth'],
        gold: 15,
        equipment: ['Pé de cabra', 'Roupas escuras comuns com capuz', 'Algibeira']
    },
    {
        id: 'entretenedor',
        name: 'Entretenedor',
        description: 'Você se sente em casa na frente de uma plateia. Sabe como cativar e entreter.',
        skills: ['acrobatics', 'performance'],
        gold: 15,
        equipment: ['Instrumento musical', 'Favor de um admirador', 'Figurino', 'Algibeira']
    },
    {
        id: 'heroi-povo',
        name: 'Herói do Povo',
        description: 'Você veio de uma linhagem humilde, mas está destinado a grandes feitos.',
        skills: ['animalHandling', 'survival'],
        gold: 10,
        equipment: ['Conjunto de ferramentas de artesão', 'Pá', 'Pote de ferro', 'Roupas comuns', 'Algibeira']
    },
    {
        id: 'nobre',
        name: 'Nobre',
        description: 'Você carrega um título e sua família possui terras, dinheiro e influência.',
        skills: ['history', 'persuasion'],
        gold: 25,
        equipment: ['Conjunto de roupas finas', 'Anel de sinete', 'Pergaminho de linhagem', 'Bolsa']
    },
    {
        id: 'sabio',
        name: 'Sábio',
        description: 'Você passou anos estudando a mitologia e os mistérios do multiverso.',
        skills: ['arcana', 'history'],
        gold: 10,
        equipment: ['Vidro de tinta nanquim', 'Pena', 'Faca pequena', 'Carta de um falecido colega', 'Roupas comuns', 'Algibeira']
    },
    {
        id: 'soldado',
        name: 'Soldado',
        description: 'A guerra tem sido sua vida pelo tempo que você consegue se lembrar.',
        skills: ['athletics', 'intimidation'],
        gold: 10,
        equipment: ['Insígnia de patente', 'Troféu de um inimigo caído', 'Conjunto de dados de osso ou baralho', 'Roupas comuns', 'Algibeira']
    },
    {
        id: 'orfao',
        name: 'Órfão',
        description: 'Você cresceu nas ruas, sozinho, pobre e sem ninguém para cuidar de você.',
        skills: ['sleightOfHand', 'stealth'],
        gold: 10,
        equipment: ['Faca pequena', 'Mapa da cidade natal', 'Rato de estimação', 'Token de seus pais', 'Roupas comuns', 'Algibeira']
    }
];
