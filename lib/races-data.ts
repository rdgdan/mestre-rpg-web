// src/lib/races-data.ts

export interface Race {
    id: string;
    name: string;
    description: string;
    speed: number;
    abilityScoreBonuses: Record<string, number>;
    traits: { name: string; description: string }[];
}

export const RACES: Race[] = [
    {
        id: 'humano',
        name: 'Humano',
        description: 'Os humanos são a mais jovem das raças comuns, chegando por último no cenário mundial e com vida curta em comparação com anões, elfos e dragões.',
        speed: 9,
        abilityScoreBonuses: {
            strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1
        },
        traits: [
            { name: 'Versatilidade', description: 'Você ganha proficiência em uma perícia à sua escolha.' }
        ]
    },
    {
        id: 'elfo',
        name: 'Elfo',
        description: 'Elfos são um povo mágico de graça sobrenatural, vivendo no mundo mas não totalmente parte dele.',
        speed: 9,
        abilityScoreBonuses: { dexterity: 2 },
        traits: [
            { name: 'Sentidos Aguçados', description: 'Você tem proficiência na perícia Percepção.' },
            { name: 'Ancestralidade Feérica', description: 'Você tem vantagem em salvaguardas contra ser enfeitiçado, e magia não pode colocar você para dormir.' },
            { name: 'Visão no Escuro', description: 'Você pode enxergar no escuro até 18 metros.' }
        ]
    },
    {
        id: 'anao',
        name: 'Anão',
        description: 'Reinos ricos de grandeza antiga, salões esculpidos nas raízes das montanhas, o retinido de picaretas e martelos em minas profundas e forjas ardentes.',
        speed: 7.5,
        abilityScoreBonuses: { constitution: 2 },
        traits: [
            { name: 'Resiliência Anã', description: 'Você tem vantagem em salvaguardas contra veneno e resistência contra dano de veneno.' },
            { name: 'Treinamento de Combate Anão', description: 'Você tem proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra.' },
            { name: 'Visão no Escuro', description: 'Você pode enxergar no escuro até 18 metros.' }
        ]
    },
    {
        id: 'halfling',
        name: 'Halfling',
        description: 'Os halflings sobrevivem em um mundo cheio de criaturas maiores evitando serem notados ou, evitando o combate, evitando totalmente a atenção.',
        speed: 7.5,
        abilityScoreBonuses: { dexterity: 2 },
        traits: [
            { name: 'Sortudo', description: 'Quando você rola um 1 natural em um ataque, teste de habilidade ou salvaguarda, você pode rolar novamente o dado e deve usar a nova rolagem.' },
            { name: 'Bravura', description: 'Você tem vantagem em salvaguardas contra ser amedrontado.' }
        ]
    },
    {
        id: 'draconato',
        name: 'Draconato',
        description: 'Descendentes de dragões, caminham com orgulho através de um mundo que os saúda com um medo temeroso.',
        speed: 9,
        abilityScoreBonuses: { strength: 2, charisma: 1 },
        traits: [
            { name: 'Ancestralidade Dracônica', description: 'Você possui um sopro e resistência a dano associados ao seu tipo de dragão.' },
            { name: 'Arma de Sopro', description: 'Você pode usar sua ação para exalar energia destrutiva conforme sua ancestralidade.' }
        ]
    },
    {
        id: 'gnomo',
        name: 'Gnomo',
        description: 'Um zumbido constante de atividades permeia as vizinhanças onde os gnomos formam suas comunidades unidas.',
        speed: 7.5,
        abilityScoreBonuses: { intelligence: 2 },
        traits: [
            { name: 'Astúcia Gnômica', description: 'Você tem vantagem em todas as salvaguardas de Inteligência, Sabedoria e Carisma contra magia.' },
            { name: 'Visão no Escuro', description: 'Você pode enxergar no escuro até 18 metros.' }
        ]
    },
    {
        id: 'meio-elfo',
        name: 'Meio-Elfo',
        description: 'Caminhando entre dois mundos mas não pertencendo de fato a nenhum deles.',
        speed: 9,
        abilityScoreBonuses: { charisma: 2 },
        traits: [
            { name: 'Versatilidade em Perícia', description: 'Você ganha proficiência em duas perícias à sua escolha.' },
            { name: 'Ancestralidade Feérica', description: 'Vantagem contra encanto e imunidade a sono mágico.' }
        ]
    },
    {
        id: 'meio-orc',
        name: 'Meio-Orc',
        description: 'Meio-orcs possuem uma vitalidade e força física que lhes permite sobreviver nos ambientes mais hostis.',
        speed: 9,
        abilityScoreBonuses: { strength: 2, constitution: 1 },
        traits: [
            { name: 'Ameaçador', description: 'Você ganha proficiência na perícia Intimidação.' },
            { name: 'Resistência Implacável', description: 'Quando você é reduzido a 0 pontos de vida mas não morre, você pode voltar para 1 ponto de vida em vez disso (uma vez por descanso longo).' }
        ]
    },
    {
        id: 'tiefling',
        name: 'Tiefling',
        description: 'Ser saudado com olhares desconfiados e sussurros, sofrer violência e insultos nas ruas, e ver medo e desconfiança em todos os olhos: este é o destino do tiefling.',
        speed: 9,
        abilityScoreBonuses: { charisma: 2, intelligence: 1 },
        traits: [
            { name: 'Resistência Infernal', description: 'Você tem resistência a dano de fogo.' },
            { name: 'Legado Infernal', description: 'Você conhece o truque Taumaturgia.' },
            { name: 'Visão no Escuro', description: 'Você pode enxergar no escuro até 18 metros.' }
        ]
    }
];
