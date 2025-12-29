// Extensão do banco de dados de monstros com descrições e busca
import { MonsterData, dndMonsters } from './monsters-data';

// Interface estendida com descrição
export interface MonsterDataExtended extends MonsterData {
    description: string;
}

// Descrições dos monstros (mapeamento)
const monsterDescriptions: { [key: string]: string } = {
    "Goblin": "Pequenos humanoides verdes e maliciosos que vivem em tribos e atacam em bandos.",
    "Orc": "Guerreiros selvagens e brutais que valorizam a força acima de tudo.",
    "Esqueleto": "Ossos animados por magia negra, servos obedientes de necromantes.",
    "Zumbi": "Cadáveres reanimados que se arrastam em busca de carne viva.",
    "Lobo": "Predadores ágeis que caçam em matilhas coordenadas.",
    "Urso-Coruja": "Criatura híbrida feroz com corpo de urso e cabeça de coruja, extremamente territorial.",
    "Dragão Vermelho Jovem": "Dragão arrogante e ganancioso que cospe fogo devastador. Adora acumular tesouros.",
    "Beholder": "Esfera flutuante com olho central gigante e tentáculos oculares que disparam raios mágicos mortais.",
    "Lich": "Mago morto-vivo de poder incomensurável que conquistou a imortalidade através de magia negra.",
    "Tarrasque": "A criatura mais destrutiva conhecida, uma força da natureza quase imparável.",
    "Kobold": "Pequenos reptilianos covardes que compensam sua fraqueza com armadilhas e números.",
    "Bugbear": "Goblinoides grandes e peludos que preferem emboscadas e ataques furtivos.",
    "Ogro": "Gigante estúpido mas incrivelmente forte, frequentemente usado como músculo por criaturas mais espertas.",
    "Troll": "Criatura regenerativa que só pode ser morta com fogo ou ácido.",
    "Verme do Gelo": "Verme colossal que habita tundras congeladas e cospe rajadas de gelo.",
    "Mímico": "Criatura metamorfa que se disfarça como objetos comuns, especialmente baús de tesouro.",
    "Cão Infernal": "Cão demoníaco que cospe fogo e caça em matilhas nos planos infernais.",
    "Gelatina Ocre": "Limo ácido que dissolve carne e metal, mas não pode ser ferido por armas não-mágicas.",
    "Gárgula": "Estátua de pedra animada que pode se camuflar perfeitamente como escultura comum.",
    "Quimera": "Monstruosidade com cabeças de leão, cabra e dragão. Voa e cospe fogo.",
    "Hidra": "Serpente de múltiplas cabeças que regenera duas cabeças para cada uma cortada.",
    "Gigante das Colinas": "O mais comum e estúpido dos gigantes, mas ainda extremamente perigoso.",
    "Gigante do Fogo": "Gigante guerreiro que forja armas em vulcões e comanda o fogo.",
    "Dragão de Ouro Adulto": "O mais nobre e sábio dos dragões metálicos, guardião do bem.",
    "Espectro": "Fantasma vingativo que drena a força vital de suas vítimas.",
    "Vampiro": "Morto-vivo aristocrático que se alimenta de sangue e possui poderes de sedução e transformação.",
    "Mantícora": "Criatura com corpo de leão, asas de dragão e cauda de escorpião que dispara espinhos.",
    "Grifo": "Majestosa criatura com corpo de leão e cabeça/asas de águia.",
    "Aranha Gigante": "Aranha do tamanho de um cavalo que tece teias e injeta veneno paralisante.",
    "Gamo Gigante": "Veado colossal frequentemente usado como montaria por elfos.",
    "Centauro": "Metade humano, metade cavalo. Guerreiros nobres das florestas.",
    "Minotauro": "Humanoide com cabeça de touro, feroz e territorial, habita labirintos.",
    "Medusa": "Mulher amaldiçoada com serpentes no lugar de cabelo. Seu olhar petrifica.",
    "Dríade": "Espírito da natureza ligado a uma árvore específica. Bela e mágica.",
    "Elemental do Fogo": "Ser de chamas puras do Plano Elemental do Fogo.",
    "Elemental da Água": "Ser de água fluida do Plano Elemental da Água.",
    "Elemental da Terra": "Ser de rocha e terra do Plano Elemental da Terra.",
    "Elemental do Ar": "Ser de ventos furiosos do Plano Elemental do Ar.",
    "Golem de Carne": "Criatura construída de partes de cadáveres costuradas e animadas por magia.",
    "Golem de Ferro": "Autômato de ferro quase indestrutível, imune à maioria das magias.",
    "Balor": "Demônio general dos Abismos, envolto em chamas e empunhando chicote e espada.",
    "Aboleth": "Criatura aquática ancestral com poderes psíquicos que escraviza mentes.",
    "Umber Hulk": "Criatura escavadora com olhos que causam confusão.",
    "Anjo Solar": "Poderoso servo dos deuses, guerreiro celestial de luz divina.",
    "Demogorgon": "Príncipe Demônio da Loucura, uma das criaturas mais poderosas do Abismo.",
    "Kraken": "Lendária criatura marinha colossal que afunda navios e devora cidades costeiras.",
    "Rakshasa": "Demônio metamorfo com cabeça de tigre, mestre em ilusões e enganos.",
    "Banshee": "Espírito feminino cujo grito anuncia a morte.",
    "Behir": "Serpente gigante com pernas que cospe relâmpagos.",
    "Bulette": "Predador subterrâneo conhecido como 'tubarão terrestre'.",
    "Gigante da Tempestade": "O mais poderoso dos gigantes, controla raios e tempestades.",
    "Unicórnio": "Criatura celestial pura e bela com poderes de cura.",
    "Yeti": "Criatura das montanhas geladas, forte e territorial."
};

// Função para obter monstros com descrições
export function getMonstersWithDescriptions(): MonsterDataExtended[] {
    return dndMonsters.map(monster => ({
        ...monster,
        description: monsterDescriptions[monster.name] || "Criatura perigosa do mundo de D&D."
    }));
}

// Função auxiliar para buscar monstros
export function searchMonsters(query: string, filters?: {
    challengeMin?: number;
    challengeMax?: number;
    type?: string;
}): MonsterDataExtended[] {
    let results = getMonstersWithDescriptions();

    // Filtro de texto
    if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(monster =>
            monster.name.toLowerCase().includes(lowerQuery) ||
            monster.type.toLowerCase().includes(lowerQuery) ||
            monster.description.toLowerCase().includes(lowerQuery)
        );
    }

    // Filtros adicionais
    if (filters?.type) {
        results = results.filter(monster => monster.type === filters.type);
    }

    // Filtro de CR (Challenge Rating)
    if (filters?.challengeMin !== undefined || filters?.challengeMax !== undefined) {
        results = results.filter(monster => {
            const cr = parseCR(monster.challenge);
            const min = filters.challengeMin ?? 0;
            const max = filters.challengeMax ?? 999;
            return cr >= min && cr <= max;
        });
    }

    return results;
}

// Função auxiliar para converter CR em número
function parseCR(cr: string): number {
    if (cr.includes('/')) {
        const [num, den] = cr.split('/').map(Number);
        return num / den;
    }
    return Number(cr);
}

// Obter tipos únicos de monstros
export function getMonsterTypes(): string[] {
    const types = new Set(dndMonsters.map(m => m.type));
    return Array.from(types).sort();
}
