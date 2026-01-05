// Extensão do banco de dados de monstros com descrições e busca
import { MonsterData, dndMonsters } from './monsters-data';

// Interface estendida com descrição
export interface MonsterDataExtended extends MonsterData {
    description: string;
    classes?: string[];
    subclass?: string;
}

// Descrições dos monstros (mapeamento)
const monsterDescriptions: { [key: string]: string } = {
    "Goblin": "Pequenos humanoides verdes e maliciosos que vivem em tribos e atacam em bandos.",
    "Orc": "Guerreiros selvagens e brutais que valorizam a força acima de tudo.",
    "Esqueleto": "Restos ósseos animados por magia negra, desprovidos de mente, mas capazes de seguir ordens complexas.",
    "Zumbi": "Corpos em decomposição reanimados, lentos e implacáveis na busca por carne viva.",
    "Lobo": "Predadores ágeis que caçam em matilhas coordenadas.",
    "Urso-Coruja": "Criatura híbrida feroz com corpo de urso e cabeça de coruja, extremamente territorial.",
    "Dragão Vermelho Jovem": "Dragão arrogante e ganancioso que cospe fogo devastador. Adora acumular tesouros.",
    "Beholder": "Esfera flutuante com olho central gigante e tentáculos oculares que disparam raios mágicos mortais.",
    "Lich": "Mago morto-vivo de poder incomensurável que conquistou a imortalidade através de magia negra.",
    "Tarrasque": "A criatura mais temida do multiverso, um titã de destruição capaz de devorar cidades inteiras.",
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
    "Unicórnio": "Criatura celestial majestosa, protetora das florestas sagradas. Seu chifre detém poder curativo e purificador.",
    "Yeti": "Criatura das montanhas geladas, forte e territorial.",
    "Bebê Dragão de Latão": "Pequena e curiosa criatura que adora conversar em vez de lutar.",
    "Gnomo das Profundezas (Svirfneblin)": "Humanoide resiliente que vive sob a terra, mestre da camuflagem.",
    "Duergar": "Anão cinzento do Subterrâneo, capaz de crescer em tamanho ou ficar invisível.",
    "Ettin": "Gigante de duas cabeças que nunca dorme completamente, pois uma cabeça está sempre alerta.",
    "Fantasma": "Alma penada que atravessa paredes e envelhece suas vítimas de susto.",
    "Ghast": "Versão mais poderosa e fétida do Carniçal, cujo odor paralisa inimigos.",
    "Ghoul": "Carniçal esfomeado que vive em cemitérios e paralisa com as garras.",
    "Gigante de Pedra": "Poderoso e estóico, prefere a solidão das montanhas e é mestre em arremesso de pedras.",
    "Glaistig": "Fada sedutora que oculta suas pernas de cabra e drena a energia dos incautos.",
    "Gnoll": "Humanoide hiena sedento por sangue que serve a entidades demoníacas.",
    "Gorgon": "Touro metálico monstruoso que exala um gás capaz de petrificar.",
    "Grell": "Cérebro flutuante com bico e tentáculos paralisantes que caça nas sombras.",
    "Harpia": "Criatura alada com torso humano cujo canto atrai marinheiros para a morte.",
    "Hezrou": "Demônio sapo fétido que serve como tropa de elite nos Abismos.",
    "Hipogrifo": "Híbrido de águia e cavalo, mais dócil que um grifo e excelente montaria.",
    "Hobgoblin": "Goblinoide disciplinado e militarista que valoriza a glória em batalha.",
    "Homúnculo": "Pequena criatura artificial vinculada telepaticamente ao seu criador.",
    "Lamia": "Criatura com torso de mulher e corpo de leão, mestre em ilusões e corrupção.",
    "Lizardfolk": "Povo lagarto que vive em pântanos e segue uma lógica puramente utilitária.",
    "Mephit de Vapor": "Pequeno elemental impertinente que sopra jatos de vapor escaldante.",
    "Mind Flayer": "Devorador de mentes psíquico que consome cérebros para sobreviver.",
    "Montículo Errante": "Massa de vegetação podre animada que captura e digere intrusos.",
    "Múmia": "Cadáver preservado amaldiçoado que protege tumbas antigas com medo e podridão.",
    "Naga de Osso": "Serpente esquelética que retém alguns de seus poderes mágicos de vida.",
    "Nightmare": "Corcel infernal com crina de fogo, capaz de viajar entre planos.",
    "Oni": "Ogro mago japonês que muda de forma e devora crianças.",
    "Otyugh": "Aberração de três pernas e tentáculos que vive em lixos e esgotos.",
    "Pseudo-dragão": "Pequeno dragão do tamanho de um gato, inteligente e com ferrão venenoso.",
    "Quasit": "Pequeno demônio metamorfo que serve como familiar para bruxos malignos.",
    "Remorhaz": "Centopeia gigante das geleiras que gera calor intenso em seu corpo.",
    "Revenant": "Morto-vivo movido puramente por vingança contra quem o matou.",
    "Roc": "Pássaro colossal capaz de carregar elefantes em suas garras.",
    "Roper": "Criatura de pedra viva que usa tentáculos pegajosos para puxar presas.",
    "Sahuagin": "Saqueadores marítimos conhecidos como 'demônios das profundezas'.",
    "Salamandra": "Ser reptiliano do plano do fogo, envolto em calor extremo.",
    "Sater": "Criatura festiva e travessa, metade homem, metade bode.",
    "Slaad": "Criatura sapo do caos que infecta outras criaturas com seus ovos.",
    "Sombra": "Criatura de escuridão pura que drena a Força de quem toca.",
    "T-Rex": "O rei dos dinossauros, uma máquina de matar implacável.",
    "Vrock": "Demônio abutre que emite um grito atordoante.",
    "Will-o'-Wisp": "Luz fátua que atrai viajantes para pântanos e se alimenta de sua agonia.",
    "Wyvern": "Parente menor dos dragões com um ferrão venenoso na cauda.",
    "Xorn": "Criatura de pedra com três braços e três pernas que come pedras preciosas.",
    "Bico de Machado": "Ave de rapina terrestre grande e veloz com um bico afiado."
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
