// lib/oracle-data.ts

// --- TIPOS ---
export interface OracleResult {
    title: string;
    description: string;
    details: string[];
}

// --- UTILITÁRIOS ---
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- DADOS DO ORÁCULO ---

// AMBIENTES
const ENVIRONMENTS: Record<string, { mood: string[], sights: string[], sounds: string[], smells: string[] }> = {
    'urbano': {
        mood: [
            "movimentada", "opulenta", "decadente", "criminosa", "festiva", 
            "labiríntica", "vigilante", "miserável", "tecnológica", "assombrada",
            "comercial", "religiosa", "militarizada", "fantasma", "subterrânea",
            "flutuante", "incendiada", "alagada", "congelada", "em quarentena",
            "revolucionária", "aristocrática", "acadêmica", "portuária", "insana"
        ],
        sights: [
            "bandeiras de guildas tremulando", "mendigos pedindo esmola nas sombras", "carroças de mercadores bloqueando a rua", "guardas patrulhando em formação", "uma execução pública acontecendo",
            "lanternas de papel coloridas suspensas", "estátuas de heróis antigos cobertas de musgo", "grafites arcanos brilhando nas paredes", "crianças brincando de guerra com espadas de madeira", "uma procissão fúnebre solene",
            "telhados conectados por pontes precárias", "gárgulas que parecem observar os passantes", "uma fonte jorrando vinho em vez de água", "bancas de mercado vendendo itens ilegais", "animais exóticos sendo leiloados",
            "uma torre de vigia em ruínas", "fumaça colorida saindo das chaminés dos alquimistas", "cartazes de procurado com rostos familiares", "um bardo tocando para uma multidão hipnotizada", "construções desafiando a gravidade",
            "esgotos a céu aberto correndo pelas sarjetas", "jardins suspensos nas sacadas dos nobres", "autômatos realizando tarefas domésticas", "portais mágicos instáveis nas esquinas", "ruas pavimentadas com pedras preciosas falsas"
        ],
        sounds: [
            "o barulho de rodas de madeira no calçamento", "gritos de vendedores ambulantes", "risadas vindas de uma taverna próxima", "sinos de templo tocando ao longe", "discussão acalorada entre mercadores",
            "o som rítmico de ferreiros trabalhando", "cânticos religiosos ecoando nas vielas", "latidos de cães de guarda", "música exótica de instrumentos desconhecidos", "o estalar de chicotes dos capatazes",
            "sussurros conspiratórios em becos escuros", "o clangor de armaduras em marcha", "gritos de gaivotas no porto", "o som de moedas sendo contadas", "fogos de artifício estourando",
            "o raspar de vassouras nas calçadas", "cantigas de ninar vindas das janelas", "o trote de cavalos apressados", "discussões sobre política ou teologia", "o silêncio tenso antes de uma briga"
        ],
        smells: [
            "pão recém assado", "esgoto e lixo acumulado", "perfume barato e suor", "fumaça de chaminés industriais", "peixe fresco e especiarias",
            "incenso queimando nos templos", "couro curtido e óleos", "cerveja derramada e serragem", "flores exóticas dos jardins nobres", "carne assada com ervas",
            "pólvora e enxofre", "papel velho e tinta", "maresia e sal", "ervas medicinais secando", "esterco de cavalo e feno",
            "madeira queimada", "metal quente e óleo", "frutas podres no mercado", "vinho azedo", "sabão e lavanda das lavadeiras"
        ]
    },
    'selvagem': {
        mood: [
            "primitiva", "serena", "ameaçadora", "mística", "desolada",
            "vibrante", "tóxica", "congelante", "feérica", "ancestral",
            "caótica", "silenciosa", "sussurrante", "petrificada", "luminosa",
            "inundada", "vulcânica", "cristalina", "nebulosa", "sombria"
        ],
        sights: [
            "árvores retorcidas com formas humanoides", "rastros frescos de uma besta gigante", "ruínas de um altar druídico", "vagalumes de cores não naturais", "uma névoa densa cobrindo o chão",
            "flores gigantes que parecem observar", "cogumelos brilhantes pulsando no escuro", "uma cachoeira que flui para cima", "pedras flutuantes desafiando a gravidade", "teias de aranha do tamanho de redes de pesca",
            "esqueletos de animais pré-históricos", "um círculo de fadas feito de cogumelos", "vinhas espinhosas bloqueando o caminho", "um lago de águas cristalinas e profundas", "cavernas escondidas atrás de folhagens",
            "totens tribais marcando território", "ninhos de pássaros gigantes nas copas", "frutas estranhas que brilham", "pegadas de fogo deixadas por uma criatura", "rochas que formam rostos quando vistas de longe",
            "um campo de batalha antigo coberto pela natureza", "árvores sangrando seiva vermelha", "uma clareira onde a luz do sol nunca toca", "estátuas de pedra cobertas de musgo", "um rio de cor púrpura ou neon"
        ],
        sounds: [
            "o uivo de lobos ao longe", "galhos estalando sem vento aparente", "o canto hipnótico de fadas", "zumbido constante de insetos", "o rugido de uma cachoeira distante",
            "o farfalhar de folhas como se alguém caminhasse", "gritos de pássaros desconhecidos", "o som de tambores tribais distantes", "o som de água gotejando de folhas gigantes", "o silêncio absoluto e antinatural",
            "o som de pedras rolando encosta abaixo", "o bater de asas de criaturas enormes", "sussurros trazidos pelo vento", "o som de madeira rangendo", "o crocodilar de anfíbios no pântano",
            "o som de gelo estalando", "trovões distantes sem nuvens no céu", "o som de respiração pesada vinda da mata", "ecos de vozes antigas", "o canto de sereias ou harpias"
        ],
        smells: [
            "terra molhada e folhas em decomposição", "ozônio antes da tempestade", "resina de pinheiro", "carniça levada pelo vento", "flores silvestres com aroma adocicado",
            "cheiro de chuva chegando", "aroma de frutas maduras demais", "fumaça de fogueira distante", "cheiro metálico de sangue fresco", "enxofre de fontes termais",
            "mofo e umidade de caverna", "cheiro de pelo molhado", "aroma picante de especiarias selvagens", "cheiro de pântano e gás metano", "perfume enjoativo de flores venenosas",
            "cheiro de cinzas vulcânicas", "ar frio e cortante", "cheiro de sal marinho (mesmo longe do mar)", "aroma de mel silvestre", "cheiro de magia (ozônio e estática)"
        ]
    },
    'masmorra': {
        mood: [
            "claustrofóbica", "antiga", "sombria", "amaldiçoada", "silenciosa",
            "úmida", "empoeirada", "inundada", "congelada", "infernal",
            "labiríntica", "assombrada", "tecnológica", "biológica", "instável",
            "sagrada", "profana", "esquecida", "vigiada", "tóxica"
        ],
        sights: [
            "teias de aranha espessas como cordas", "estátuas com expressões de agonia", "manchas de sangue seco e antigo", "tochas queimando com chamas azuis", "equipamento de aventureiros mortos",
            "murais antigos descrevendo o apocalipse", "armadilhas visíveis mas já disparadas", "portas reforçadas com runas brilhantes", "um trono feito de ossos", "espelhos que não refletem a realidade",
            "correntes penduradas no teto", "buracos nas paredes de onde saem sons", "poços sem fundo aparente", "pilhas de ouro que na verdade são ilusões", "esqueletos acorrentados às paredes",
            "bibliotecas com livros que se desfazem ao toque", "altares profanados com símbolos estranhos", "jardins subterrâneos de fungos venenosos", "prisões com celas minúsculas", "mecanismos de relógio gigantes",
            "rios de lava cruzando o caminho", "cristais gigantes iluminando o ambiente", "sarcófagos entreabertos", "marcas de garras nas pedras", "mensagens de aviso escritas em sangue"
        ],
        sounds: [
            "passos ecoando que não são os seus", "correntes sendo arrastadas", "gotejar lento e rítmico de água", "sussurros em uma língua morta", "portas de pedra rangendo sozinhas",
            "o som de algo grande se arrastando", "risadas maníacas distantes", "o som de vento uivando pelos corredores", "batidas rítmicas nas paredes", "o som de desmoronamento ao longe",
            "gritos abafados vindos de baixo", "o som de mecanismos sendo ativados", "o bater de asas de morcegos", "o som de respiração rasgada", "cânticos de um ritual profano",
            "o som de metal contra pedra", "o chiar de tochas", "o som de vermes rastejando", "silêncio opressivo", "o som do próprio batimento cardíaco"
        ],
        smells: [
            "mofo e ar viciado", "enxofre vulcânico", "aroma metálico de sangue", "poeira de séculos", "cheiro acre de medo",
            "incenso rançoso", "carne podre", "óleo queimado", "urina e fezes de ratos", "cheiro de morte e conservantes",
            "aroma adocicado de embalsamamento", "fumaça de velas de sebo", "cheiro de ferro enferrujado", "aroma de comida estragada", "cheiro de gás venenoso (amêndoas amargas)",
            "cheiro de terra revirada", "cheiro de ozônio mágico", "aroma de álcool forte", "cheiro de couro velho", "cheiro de umidade e limo"
        ]
    }
};

// NPCs
const NPC_ROLES: Record<string, string[]> = {
    'comum': ["Taverneiro", "Ferreiro", "Mercador", "Fazendeiro", "Guarda", "Pescador", "Mineiro", "Carpinteiro", "Coveiro", "Músico", "Cozinheiro", "Mensageiro", "Marinheiro", "Caçador", "Parteira", "Escriba", "Servo", "Mendigo", "Artesão", "Professor"],
    'nobre': ["Duque", "Sacerdote", "Diplomata", "Erudito", "Cortesão", "Rei/Rainha", "Príncipe/Princesa", "Barão", "Inquisidor", "General", "Conselheiro", "Magistrado", "Cavaleiro", "Banquineiro", "Dono de Terras", "Arquimago", "Líder de Guilda", "Mecenas", "Senhor da Guerra", "Herdeiro"],
    'submundo': ["Ladrão", "Assassino", "Contrabandista", "Espião", "Informante", "Falsificador", "Sequestrador", "Mercenário", "Agiota", "Traficante", "Líder de Gangue", "Cultista", "Necromante", "Vigarista", "Pirata", "Sabotador", "Mestre dos Disfarces", "Executor", "Ladrão de Tumbas", "Alquimista Ilegal"]
};

const NPC_TRAITS = [
    "fala muito rápido", "tem uma cicatriz no olho", "brinca com uma moeda o tempo todo",
    "sussurra em vez de falar", "tem um tique nervoso nos olhos", "usa roupas extravagantes e coloridas",
    "fede a álcool barato e tabaco", "está sempre olhando por cima do ombro", "fala de si mesmo na terceira pessoa",
    "tem uma tatuagem de uma organização secreta", "carrega um animal exótico no ombro", "tem dentes de ouro ou prata",
    "falta-lhe um dedo na mão direita", "tem uma voz extremamente anasalada", "suas mãos tremem constantemente",
    "está sempre comendo alguma coisa", "tem um olho de vidro que não se move", "usa muitas joias falsas",
    "tem uma risada irritante e aguda", "fala com um sotaque estrangeiro pesado", "tem o rosto coberto de verrugas",
    "parece estar sempre com sono", "é extremamente supersticioso", "carrega um livro grosso e velho",
    "tem uma postura impecável e rígida", "cheira a perfume caro demais", "está coberto de bandagens misteriosas",
    "tem unhas roídas até a carne", "se veste inteiramente de preto", "tem um olhar penetrante e desconfortável",
    "carrega armas demais para uma pessoa só", "tem o cabelo tingido de uma cor estranha", "está sempre limpando as unhas com uma adaga",
    "tem uma tosse seca e constante", "parece ter medo do próprio reflexo", "fala rimando acidentalmente",
    "tem uma pele pálida como a de um cadáver", "anda mancando de uma perna", "tem orelhas pontudas demais",
    "fala com objetos inanimados", "tem medo visível de magia", "parece reconhecer os heróis de algum lugar",
    "está sempre suando frio", "tem mãos calejadas de trabalhador", "tem um sorriso que não chega aos olhos"
];

const NPC_MOTIVATIONS = [
    "pagar uma dívida de jogo astronômica", "encontrar um parente desaparecido há anos", "vingar a morte de um parceiro ou amor",
    "obter poder político a qualquer custo", "esconder um passado sombrio e criminoso", "provar seu valor para a família desapontada",
    "escapar de uma maldição ancestral", "ficar rico rapidamente para fugir do país", "proteger um segredo antigo e perigoso",
    "encontrar a cura para uma doença rara", "recuperar um item de família roubado", "ganhar o perdão de um deus",
    "tornar-se famoso em todo o reino", "destruir uma guilda rival", "encontrar um amor verdadeiro",
    "fugir de um casamento arranjado", "pagar pela liberdade de um escravo", "descobrir a verdade sobre sua origem",
    "aprender uma magia proibida", "conquistar terras para seu povo", "matar um monstro específico",
    "proteger sua comunidade de invasores", "pagar promessa a um santo", "reconstruir seu lar destruído",
    "sabotar os planos do rei", "servir a um mestre sombrio", "encontrar a entrada para um mundo perdido",
    "ressuscitar alguém que ama", "roubar a coroa do rei", "vender um segredo de estado",
    "escapar da justiça", "criar a maior obra de arte do mundo", "fundar sua própria religião",
    "controlar o clima da região", "fazer pacto com um demônio"
];

// QUESTS
const QUEST_THEMES: Record<string, { hooks: string[], twists: string[] }> = {
    'combate': {
        hooks: [
            "Uma besta está aterrorizando as fazendas locais nas noites de lua cheia", "Bandidos sequestraram a filha do ferreiro e exigem um regaste impossível", "A mina foi invadida por goblins que parecem organizados demais", "Um torneio de gladiadores oferece um prêmio misterioso e valioso",
            "Um dragão jovem está exigindo tributos de gado e ouro", "Mortos-vivos estão se levantando do cemitério local todas as noites", "Uma alcateia de lobos gigantes está bloqueando a estrada comercial", "Guerreiros de terras distantes estão saqueando a costa",
            "Um golem descontrolado está destruindo a cidade", "Uma seita está invocando demônios no porão da taverna", "Caçadores de monstros precisam de ajuda para abater uma hidra", "Guardas da cidade estão sendo assassinados um por um",
            "Um gigante desceu das montanhas e está dormindo na ponte principal", "Ratos gigantes infestaram os celeiros de grãos", "Uma experiência mágica criou plantas carnívoras vorazes", "Um bando de orcs está construindo uma fortaleza perto da cidade"
        ],
        twists: [
            "A besta é na verdade um druida amaldiçoado que pede ajuda", "A filha fugiu com o líder dos bandidos por vontade própria e amor", "Os goblins estão fugindo de algo muito pior nas profundezas da terra", "O prêmio é um artefato amaldiçoado que consome a alma do vencedor",
            "O dragão está protegendo seus ovos de caçadores", "Os mortos-vivos estão tentando avisar a cidade de um perigo maior", "Os lobos são familiares de um mago eremita", "Os guerreiros estão fugindo de uma guerra em sua terra natal",
            "O golem está tentando proteger uma criança escondida", "A seita está, na verdade, tentando conter o demônio, não invocá-lo", "A hidra é guardiã de um local sagrado", "Os guardas assassinados eram corruptos e faziam parte de uma rede de tráfico",
            "O gigante está ferido e delirando de febre", "Os ratos são controlados por um flautista mágico vingativo", "As plantas são a única cura para uma praga que está por vir", "Os orcs querem negociar paz, mas não sabem como"
        ]
    },
    'investigacao': {
        hooks: [
            "O cadáver de um nobre foi encontrado sem marcas de violência num quarto trancado", "Itens mágicos estão desaparecendo da torre do mago sem deixar rastros", "Uma praga estranha afeta apenas os animais de uma cor específica", "Alguém está substituindo os cidadãos por sósias perfeitos",
            "Símbolos estranhos apareceram em todas as portas da cidade durante a noite", "O rio local ficou vermelho como sangue repentinamente", "Pessoas estão sonhando o mesmo sonho todas as noites e acordando exaustas", "Um fantasma está assombrando a ópera e exigindo mudanças na peça",
            "Livros da biblioteca real estão sendo reescritos magicamente", "Uma estátua na praça chora lágrimas reais", "Animais da floresta estão falando charadas", "Um navio fantasma apareceu no porto sem tripulação",
            "O tempo parece estar passando mais rápido em uma parte da cidade", "Sombras estão se movendo independentemente de seus donos", "Reflexos nos espelhos mostram algo diferente da realidade", "Uma mensagem em código foi encontrada no estômago de um peixe"
        ],
        twists: [
            "O nobre forjou a própria morte para fugir de dívidas", "Os itens estão sendo roubados pelo próprio familiar do mago, que se sente negligenciado", "A praga é causada pela água envenenada acidentalmente por um alquimista", "Os sósias são, na verdade, os originais que foram presos em espelhos",
            "Os símbolos são um pedido de socorro de uma guilda de ladrões", "O rio vermelho é resultado de um vazamento de tintura de uma fábrica ilegal", "O sonho é um chamado telepático de uma criatura psíquica aprisionada", "O fantasma é o antigo diretor da ópera que odiava a peça atual",
            "Os livros estão ganhando consciência e não querem ser lidos", "A estátua contém a alma de uma santa aprisionada", "Os animais foram encantados por um fada brincalhona", "O navio transporta uma praga invisível",
            "Um mago está experimentando com o tempo para salvar sua esposa", "As sombras são seres tentando entrar em nossa dimensão", "Os espelhos mostram o verdadeiro alinhamento moral das pessoas", "A mensagem é uma receita de bolo antiga e perdida, não um código"
        ]
    },
    'diplomacia': {
        hooks: [
            "Duas guildas rivais estão prestes a iniciar uma guerra nas ruas da cidade", "Um espírito da floresta exige um tributo para soltar a passagem da ponte", "O rei precisa de escolta discreta para uma reunião secreta com inimigos", "Negociar a paz com uma tribo de orcs que bloqueou a rota comercial",
            "Convencer um dragão a mudar seu covil para longe da cidade", "Mediar um casamento entre duas famílias nobres que se odeiam", "Obter permissão de entrada em uma biblioteca sagrada e restrita", "Defender um inocente em um tribunal tendencioso",
            "Acalmar uma multidão enfurecida que quer linchar um mago", "Negociar a libertação de reféns sem derramamento de sangue", "Convencer um deus menor a abençoar a colheita", "Resolver uma disputa de terras entre elfos e anões",
            "Organizar um festival que agrade a todas as facções da cidade", "Descobrir quem está espalhando boatos para incitar uma rebelião", "Persuadir um lich a não destruir o mundo (por enquanto)", "Unir clãs bárbaros contra um inimigo comum"
        ],
        twists: [
            "Uma terceira guilda está manipulando ambas para se destruir", "O espírito é uma ilusão criada por bandidos para cobrar pedágio", "A reunião é uma armadilha armada pelo próprio rei para eliminar os inimigos", "O líder orc quer se casar com alguém do grupo de aventureiros como parte do tratado",
            "O dragão está protegendo algo que mantém a cidade segura de terremotos", "Os noivos estão apaixonados por outras pessoas", "A biblioteca contém segredos que poderiam destruir o reino", "O inocente é culpado, mas por uma razão nobre",
            "O mago realmente cometeu o crime, mas estava sob controle mental", "Os reféns já simpatizam com os sequestradores (Síndrome de Estocolmo)", "O deus exige um sacrifício pessoal de um dos heróis", "A terra em disputa é amaldiçoada e ninguém deveria tê-la",
            "O festival é um ritual disfarçado para invocar algo", "Os boatos são verdadeiros, mas inconvenientes para a coroa", "O lich só quer companhia e alguém para jogar xadrez", "O inimigo comum foi inventado para unir os clãs"
        ]
    }
};

// --- CLASSE ORACLE ---

export const Oracle = {
    /**
     * Gera uma cena detalhada baseada no tipo de ambiente
     */
    generateScene(environmentType: string = 'urbano', userContext?: string): OracleResult {
        const envKey = (Object.keys(ENVIRONMENTS).find(k => k === environmentType) || 'urbano') as keyof typeof ENVIRONMENTS;
        const data = ENVIRONMENTS[envKey];
        
        const mood = pickRandom(data.mood);
        const sight1 = pickRandom(data.sights);
        const sight2 = pickRandom(data.sights);
        const sound = pickRandom(data.sounds);
        const smell = pickRandom(data.smells);

        const cleanContext = userContext?.replace(/['"]/g, "");

        let description = `O local possui uma atmosfera ${mood}. Logo de cara, seus olhos captam ${sight1} e, mais ao fundo, ${sight2}. `;
        description += `O som de ${sound} é constante, compondo a cena junto com um forte cheiro de ${smell}.`;

        if (cleanContext) description += `\n\nDetalhe Adicional: ${cleanContext} - Isso se reflete nas sombras e cores do ambiente.`;

        return {
            title: `Cena: ${environmentType.charAt(0).toUpperCase() + environmentType.slice(1)}`,
            description,
            details: [
                `Clima: ${mood}`,
                `Destaques Visuais: ${sight1}, ${sight2}`,
                `Sons: ${sound}`,
                `Odores: ${smell}`
            ]
        };
    },

    /**
     * Gera um NPC com Papel e Motivação
     */
    generateNPC(roleType: string = 'comum', extraContext?: string): OracleResult {
        const roleKey = (Object.keys(NPC_ROLES).find(k => k === roleType) || 'comum') as keyof typeof NPC_ROLES;
        const roles = NPC_ROLES[roleKey];
        
        const role = pickRandom(roles);
        const trait = pickRandom(NPC_TRAITS);
        const motivation = pickRandom(NPC_MOTIVATIONS);
        
        // Gerador de nome simples (pode ser melhorado)
        const names = [
            "Brog", "Eldrin", "Kael", "Mara", "Thorne", "Vex", "Zara", "Orin", "Faelar", "Durnan",
            "Aeliana", "Tharok", "Grom", "Lira", "Silas", "Vanya", "Morthos", "Dalia", "Ragnar", "Elara",
            "Finn", "Gorim", "Hana", "Ivar", "Jinx", "Kira", "Leon", "Mina", "Nox", "Ophelia",
            "Pike", "Quinn", "Ryla", "Stig", "Tyra", "Ulric", "Vera", "Wren", "Xander", "Yara", "Zephyr"
        ];
        const name = pickRandom(names);

        const cleanContext = extraContext?.replace(/['"]/g, "");

        let description = `${name}, um(a) ${role}. `;
        description += `Sua aparência é marcada pois ele(a) ${trait}. `;
        description += `Atualmente, seu principal objetivo é ${motivation} context.`;
        
        if (cleanContext) description = description.replace("context", ` (relacionado a: ${cleanContext})`);
        else description = description.replace(" context", ".");

        return {
            title: `${name} - ${role}`,
            description,
            details: [
                `Função: ${role}`,
                `Traço: ${trait}`,
                `Motivação: ${motivation}`
            ]
        };
    },

    /**
     * Gera um gancho de aventura
     */
    generateQuest(themeType: string = 'combate', campaignContext?: string): OracleResult {
        const themeKey = (Object.keys(QUEST_THEMES).find(k => k === themeType) || 'combate') as keyof typeof QUEST_THEMES;
        const data = QUEST_THEMES[themeKey];

        const hook = pickRandom(data.hooks);
        const twist = pickRandom(data.twists);
        
        const cleanContext = campaignContext?.replace(/['"]/g, "");

        let description = `Missão: ${hook}. `;
        if (cleanContext) description += `Isso parece estar ligado à ${cleanContext}. `;
        description += `\n\nO Segredo: No entanto, o que os heróis não sabem é que ${twist}.`;

        return {
            title: `Gancho: ${themeType.charAt(0).toUpperCase() + themeType.slice(1)}`,
            description,
            details: [
                `Gancho: ${hook}`,
                `Reviravolta: ${twist}`
            ]
        };
    }
};
