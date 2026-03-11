// Base de dados de Magias D&D 5e (Português)
// Fonte: SRD 5.1 traduzido
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export interface Spell {
    id: string;
    name: string;
    level: number;
    school: string; // Changed to string to allow custom schools
    castingTime: string;
    range: string;
    components: string;
    duration: string;
    description: string;
    classes: string[]; // Classes que podem usar esta magia
    ritual?: boolean;
    concentration?: boolean;
    subclass?: string; // New field for user categorization
    prepared?: boolean; // Se a magia está preparada (para classes que preparam)
    sourceClass?: string;
}

export const spellsDatabase: Spell[] = [
    {
        id: 'bola-de-fogo',
        name: 'Bola de Fogo',
        level: 3,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '45 metros',
        components: 'V, S, M (uma pequena esfera de guano de morcego e enxofre)',
        duration: 'Instantânea',
        description: 'Um raio brilhante sai de seu dedo apontado para um ponto que você escolher dentro do alcance e então eclode com um rugido baixo em uma explosão de chamas. Cada criatura em uma esfera de 6 metros de raio centrada naquele ponto deve fazer um teste de resistência de Destreza. Um alvo sofre 8d6 de dano de fogo em um fracasso, ou metade do dano em um sucesso. O fogo se espalha ao redor de cantos. Ele incendeia objetos inflamáveis na área que não estejam sendo vestidos ou carregados.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'misseis-magicos',
        name: 'Mísseis Mágicos',
        level: 1,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '36 metros',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Você cria três dardos brilhantes de energia mágica. Cada dardo atinge uma criatura de sua escolha que você possa ver dentro do alcance. Um dardo causa 1d4 + 1 de dano de energia ao seu alvo. Os dardos atingem simultaneamente e você pode direcioná-los para atingir uma criatura ou várias.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'cura-ferimentos',
        name: 'Curar Ferimentos',
        level: 1,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Toque',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Uma criatura que você tocar recupera um número de pontos de vida igual a 1d8 + seu modificador de habilidade de conjuração. Esta magia não tem efeito sobre mortos-vivos ou constructos.',
        classes: ['Clérigo', 'Paladino', 'Druida', 'Bardo'],
        concentration: false
    },
    {
        id: 'escudo-arcano',
        name: 'Escudo Arcano',
        level: 1,
        school: 'Abjuração',
        castingTime: '1 reação',
        range: 'Pessoal',
        components: 'V, S',
        duration: '1 rodada',
        description: 'Uma barreira invisível de força mágica aparece e o protege. Até o início de seu próximo turno, você tem um bônus de +5 na CA, incluindo contra o ataque desencadeador, e você não sofre dano de mísseis mágicos.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'bencao',
        name: 'Benção',
        level: 1,
        school: 'Encantamento',
        castingTime: '1 ação',
        range: '9 metros',
        components: 'V, S, M (um borrifo de água benta)',
        duration: 'Concentração, até 1 minuto',
        description: 'Você abençoa até três criaturas de sua escolha dentro do alcance. Sempre que um alvo fizer um teste de ataque ou um teste de resistência antes da magia acabar, o alvo pode rolar um d4 e adicionar o número rolado ao teste de ataque ou teste de resistência.',
        classes: ['Clérigo', 'Paladino'],
        concentration: true
    },
    {
        id: 'raio-eldritch',
        name: 'Raio Místico',
        level: 0,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '36 metros',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Um raio de energia crepitante atinge uma criatura dentro do alcance. Faça um ataque de magia à distância contra o alvo. Em um acerto, o alvo sofre 1d10 de dano de energia. O dano da magia aumenta em 1d10 quando você alcança o 5º nível (2d10), 11º nível (3d10) e 17º nível (4d10).',
        classes: ['Bruxo'],
        concentration: false
    },
    {
        id: 'armadura-arcana',
        name: 'Armadura Arcana',
        level: 1,
        school: 'Abjuração',
        castingTime: '1 ação',
        range: 'Toque',
        components: 'V, S, M (um pedaço de couro curtido)',
        duration: '8 horas',
        description: 'Você toca uma criatura voluntária que não esteja vestindo armadura, e uma força mágica protetora a envolve até a magia acabar. A CA base do alvo se torna 13 + seu modificador de Destreza. A magia acaba se o alvo colocar uma armadura ou se você dissipá-la usando uma ação.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'detectar-magia',
        name: 'Detectar Magia',
        level: 1,
        school: 'Adivinhação',
        castingTime: '1 ação',
        range: 'Pessoal',
        components: 'V, S',
        duration: 'Concentração, até 10 minutos',
        description: 'Pela duração, você sente a presença de magia a até 9 metros de você. Se você sentir magia dessa forma, você pode usar sua ação para ver uma aura fraca ao redor de qualquer criatura ou objeto visível na área que tenha magia, e você descobre a escola de magia, se houver.',
        classes: ['Mago', 'Feiticeiro', 'Clérigo', 'Paladino', 'Bardo', 'Druida', 'Patrulheiro'],
        concentration: true,
        ritual: true
    },
    // TRUQUES (Nível 0)
    {
        id: 'luz',
        name: 'Luz',
        level: 0,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Toque',
        components: 'V, M (um vaga-lume ou musgo fosforescente)',
        duration: '1 hora',
        description: 'Você toca um objeto que não seja maior que 3 metros em qualquer dimensão. Até a magia acabar, o objeto emite luz plena em um raio de 6 metros e penumbra por mais 6 metros. A luz pode ter qualquer cor que você escolher.',
        classes: ['Mago', 'Feiticeiro', 'Clérigo', 'Bardo'],
        concentration: false
    },
    {
        id: 'prestidigitacao',
        name: 'Prestidigitação',
        level: 0,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: '3 metros',
        components: 'V, S',
        duration: 'Até 1 hora',
        description: 'Esta magia é um truque mágico menor que conjuradores novatos usam para praticar. Você cria um dos seguintes efeitos mágicos dentro do alcance: um efeito sensorial inofensivo instantâneo, acende ou apaga uma vela/tocha/fogueira, limpa ou suja um objeto, esfria/esquenta/tempera material inanimado, ou faz aparecer uma marca ou símbolo em um objeto.',
        classes: ['Mago', 'Feiticeiro', 'Bardo', 'Bruxo'],
        concentration: false
    },
    {
        id: 'lamina-flamejante',
        name: 'Lâmina Flamejante',
        level: 0,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Pessoal',
        components: 'V, S, M (uma folha de sumagre)',
        duration: 'Concentração, até 10 minutos',
        description: 'Você evoca uma lâmina de fogo em sua mão livre. A lâmina é similar em tamanho e forma a uma cimitarra, e dura pela duração. Se você soltar a lâmina, ela desaparece, mas você pode evocar a lâmina novamente com uma ação bônus. Você pode usar sua ação para fazer um ataque corpo a corpo com a lâmina de fogo. Em um acerto, o alvo sofre 3d6 de dano de fogo.',
        classes: ['Druida', 'Feiticeiro'],
        concentration: true
    },
    // NÍVEL 1
    {
        id: 'sono',
        name: 'Sono',
        level: 1,
        school: 'Encantamento',
        castingTime: '1 ação',
        range: '27 metros',
        components: 'V, S, M (uma pitada de areia fina, pétalas de rosa ou um grilo)',
        duration: '1 minuto',
        description: 'Esta magia envia criaturas em um sono mágico. Role 5d8; o total é quantos pontos de vida de criaturas esta magia pode afetar. Criaturas a até 6 metros de um ponto que você escolher dentro do alcance são afetadas em ordem ascendente de seus pontos de vida atuais (ignorando criaturas inconscientes).',
        classes: ['Mago', 'Feiticeiro', 'Bardo'],
        concentration: false
    },
    {
        id: 'enfeiticar-pessoa',
        name: 'Enfeitiçar Pessoa',
        level: 1,
        school: 'Encantamento',
        castingTime: '1 ação',
        range: '9 metros',
        components: 'V, S',
        duration: '1 hora',
        description: 'Você tenta enfeitiçar um humanoide que você possa ver dentro do alcance. Ele deve fazer um teste de resistência de Sabedoria, e o faz com vantagem se você ou seus companheiros estiverem lutando com ele. Se ele falhar no teste de resistência, ele é enfeitiçado por você até a magia acabar ou até você ou seus companheiros fazerem qualquer coisa nociva a ele.',
        classes: ['Mago', 'Feiticeiro', 'Bardo', 'Bruxo', 'Druida'],
        concentration: false
    },
    {
        id: 'maos-flamejantes',
        name: 'Mãos Flamejantes',
        level: 1,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Pessoal (cone de 4,5 metros)',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Ao manter suas mãos com os polegares se tocando e os dedos abertos, um fino lençol de chamas sai de seus dedos estendidos. Cada criatura em um cone de 4,5 metros deve fazer um teste de resistência de Destreza. Uma criatura sofre 3d6 de dano de fogo em um fracasso, ou metade do dano em um sucesso.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    // NÍVEL 2
    {
        id: 'invisibilidade',
        name: 'Invisibilidade',
        level: 2,
        school: 'Ilusão',
        castingTime: '1 ação',
        range: 'Toque',
        components: 'V, S, M (um cílio encapsulado em goma arábica)',
        duration: 'Concentração, até 1 hora',
        description: 'Uma criatura que você toca se torna invisível até a magia acabar. Qualquer coisa que o alvo esteja vestindo ou carregando é invisível enquanto estiver com o alvo. A magia acaba para um alvo que ataque ou conjure uma magia.',
        classes: ['Mago', 'Feiticeiro', 'Bardo', 'Bruxo'],
        concentration: true
    },
    {
        id: 'levitacao',
        name: 'Levitação',
        level: 2,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: '18 metros',
        components: 'V, S, M (um pequeno laço de couro ou um pedaço de fio de ouro dobrado em forma de xícara com uma haste longa em uma ponta)',
        duration: 'Concentração, até 10 minutos',
        description: 'Uma criatura ou objeto solto de sua escolha que você possa ver dentro do alcance sobe verticalmente, até 6 metros, e permanece suspenso lá pela duração. A magia pode levitar um alvo que pese até 250 kg. Uma criatura involuntária que seja bem-sucedida em um teste de resistência de Constituição não é afetada.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: true
    },
    {
        id: 'sugestao',
        name: 'Sugestão',
        level: 2,
        school: 'Encantamento',
        castingTime: '1 ação',
        range: '9 metros',
        components: 'V, M (uma língua de cobra e um pedaço de favo de mel ou uma gota de óleo doce)',
        duration: 'Concentração, até 8 horas',
        description: 'Você sugere um curso de atividade (limitado a uma sentença ou duas) e magicamente influencia uma criatura que você possa ver dentro do alcance e que possa ouvi-lo e entendê-lo. A sugestão deve ser formulada de maneira a fazer o curso de ação parecer razoável.',
        classes: ['Mago', 'Feiticeiro', 'Bardo', 'Bruxo'],
        concentration: true
    },
    // NÍVEL 3
    {
        id: 'relampago',
        name: 'Relâmpago',
        level: 3,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Pessoal (linha de 30 metros)',
        components: 'V, S, M (um pouco de pelo e uma vareta de âmbar, cristal ou vidro)',
        duration: 'Instantânea',
        description: 'Um raio de luz cintilante lampeja de sua mão em uma linha de 30 metros de comprimento e 1,5 metro de largura. Cada criatura na linha deve fazer um teste de resistência de Destreza. Uma criatura sofre 8d6 de dano elétrico em um fracasso, ou metade do dano em um sucesso.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'voo',
        name: 'Voo',
        level: 3,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: 'Toque',
        components: 'V, S, M (uma pena de asa de qualquer pássaro)',
        duration: 'Concentração, até 10 minutos',
        description: 'Você toca uma criatura voluntária. O alvo ganha um deslocamento de voo de 18 metros pela duração. Quando a magia acabar, o alvo cai se ainda estiver no ar, a menos que possa parar a queda.',
        classes: ['Mago', 'Feiticeiro', 'Bruxo'],
        concentration: true
    },
    {
        id: 'contra-magica',
        name: 'Contra-Mágica',
        level: 3,
        school: 'Abjuração',
        castingTime: '1 reação',
        range: '18 metros',
        components: 'S',
        duration: 'Instantânea',
        description: 'Você tenta interromper uma criatura no processo de conjurar uma magia. Se a criatura estiver conjurando uma magia de 3º nível ou inferior, sua magia falha e não tem efeito. Se ela estiver conjurando uma magia de 4º nível ou superior, faça um teste de habilidade usando sua habilidade de conjuração. A CD é igual a 10 + o nível da magia.',
        classes: ['Mago', 'Feiticeiro', 'Bruxo'],
        concentration: false
    },
    // NÍVEL 4
    {
        id: 'dissipar-magia',
        name: 'Dissipar Magia',
        level: 3,
        school: 'Abjuração',
        castingTime: '1 ação',
        range: '36 metros',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Escolha uma criatura, objeto ou efeito mágico dentro do alcance. Qualquer magia de 3º nível ou inferior no alvo termina. Para cada magia de 4º nível ou superior no alvo, faça um teste de habilidade de conjuração. A CD é 10 + o nível da magia. Em um sucesso, a magia termina.',
        classes: ['Mago', 'Feiticeiro', 'Clérigo', 'Druida', 'Paladino', 'Bardo', 'Bruxo'],
        concentration: false
    },
    {
        id: 'padrao-hipnotico',
        name: 'Padrão Hipnótico',
        level: 3,
        school: 'Ilusão',
        castingTime: '1 ação',
        range: '36 metros',
        components: 'S, M (um bastão de incenso brilhante ou um frasco de cristal cheio de material fosforescente)',
        duration: 'Concentração, até 1 minuto',
        description: 'Você cria um padrão distorcido de cores que se move pelo ar dentro de um cubo de 9 metros dentro do alcance. O padrão aparece por um momento e desaparece. Cada criatura na área que ver o padrão deve fazer um teste de resistência de Sabedoria. Em uma falha, a criatura fica enfeitiçada pela duração. Enquanto enfeitiçada por esta magia, a criatura fica incapacitada e tem deslocamento 0.',
        classes: ['Bardo', 'Feiticeiro', 'Bruxo', 'Mago'],
        concentration: true
    },
    {
        id: 'tempestade-de-gelo',
        name: 'Tempestade de Gelo',
        level: 4,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '90 metros',
        components: 'V, S, M (uma pitada de pó e algumas gotas de água)',
        duration: 'Instantânea',
        description: 'Uma chuva de pedras de gelo duras como pedra cai no chão em um cilindro de 6 metros de raio e 12 metros de altura centrado em um ponto dentro do alcance. Cada criatura no cilindro deve fazer um teste de resistência de Destreza. Uma criatura sofre 2d8 de dano de concussão e 4d6 de dano de gelo em um fracasso, ou metade do dano em um sucesso.',
        classes: ['Mago', 'Feiticeiro', 'Druida'],
        concentration: false
    },
    {
        id: 'porta-dimensional',
        name: 'Porta Dimensional',
        level: 4,
        school: 'Conjuração',
        castingTime: '1 ação',
        range: '150 metros',
        components: 'V',
        duration: 'Instantânea',
        description: 'Você se teletransporta do seu local atual para qualquer outro local dentro do alcance. Você chega exatamente no local desejado. Pode ser um lugar que você possa ver, um que você possa visualizar, ou um que você possa descrever indicando distância e direção.',
        classes: ['Mago', 'Feiticeiro', 'Bruxo', 'Bardo'],
        concentration: false
    },
    // NÍVEL 5
    {
        id: 'cone-de-frio',
        name: 'Cone de Frio',
        level: 5,
        school: 'Evocação',
        castingTime: '1 ação',
        range: 'Pessoal (cone de 18 metros)',
        components: 'V, S, M (um pequeno cone de cristal ou vidro)',
        duration: 'Instantânea',
        description: 'Uma rajada de ar frio irrompe de suas mãos. Cada criatura em um cone de 18 metros deve fazer um teste de resistência de Constituição. Uma criatura sofre 8d8 de dano de gelo em um fracasso, ou metade do dano em um sucesso. Uma criatura morta por esta magia se torna uma estátua congelada até derreter.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'mao-arcana',
        name: 'Mão Arcana',
        level: 5,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '36 metros',
        components: 'V, S, M (uma casca de ovo e uma luva de cobra)',
        duration: 'Concentração, até 1 minuto',
        description: 'Você cria uma Mão Grande de força cintilante e translúcida em um espaço desocupado que você possa ver dentro do alcance. A mão dura pela duração da magia, e se move a seu comando, imitando os movimentos de sua própria mão. A mão é um objeto que tem CA 20 e pontos de vida iguais ao seu máximo de pontos de vida.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: true
    },
    {
        id: 'telecinese',
        name: 'Telecinese',
        level: 5,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: '18 metros',
        components: 'V, S',
        duration: 'Concentração, até 10 minutos',
        description: 'Você ganha a habilidade de mover ou manipular criaturas ou objetos com o pensamento. Quando você conjura a magia, e com sua ação em cada rodada pela duração, você pode exercer sua vontade em uma criatura ou objeto que você possa ver dentro do alcance, causando o efeito apropriado abaixo.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: true
    },
    // NÍVEL 6
    {
        id: 'desintegrar',
        name: 'Desintegrar',
        level: 6,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: '18 metros',
        components: 'V, S, M (um ímã e uma pitada de pó)',
        duration: 'Instantânea',
        description: 'Um fino raio verde sai de seu dedo apontado para um alvo que você possa ver dentro do alcance. O alvo pode ser uma criatura, um objeto, ou uma criação de força mágica, como a parede criada por parede de energia. Uma criatura alvo deve fazer um teste de resistência de Destreza. Em um fracasso, o alvo sofre 10d6 + 40 de dano de energia. Se este dano reduzir o alvo a 0 pontos de vida, ele é desintegrado.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'globo-de-invulnerabilidade',
        name: 'Globo de Invulnerabilidade',
        level: 6,
        school: 'Abjuração',
        castingTime: '1 ação',
        range: 'Pessoal (raio de 3 metros)',
        components: 'V, S, M (uma conta de vidro ou cristal que se estilhaça quando a magia termina)',
        duration: 'Concentração, até 1 minuto',
        description: 'Uma barreira imóvel e brilhante surge em um raio de 3 metros ao seu redor e permanece pela duração. Qualquer magia de 5º nível ou inferior conjurada de fora da barreira não pode afetar criaturas ou objetos dentro dela, mesmo se a magia for conjurada usando um espaço de magia de nível superior.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: true
    },
    // NÍVEL 7
    {
        id: 'bola-de-fogo-controlada',
        name: 'Bola de Fogo Controlada',
        level: 7,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '45 metros',
        components: 'V, S, M (uma pequena esfera de guano de morcego e enxofre)',
        duration: 'Instantânea',
        description: 'Uma explosão de chamas emana de um ponto que você escolher dentro do alcance. Cada criatura em uma esfera de 6 metros de raio centrada naquele ponto deve fazer um teste de resistência de Destreza. Um alvo sofre 12d6 de dano de fogo em um fracasso, ou metade do dano em um sucesso. Você pode escolher até 6 criaturas para serem automaticamente bem-sucedidas no teste de resistência.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'teletransporte',
        name: 'Teletransporte',
        level: 7,
        school: 'Conjuração',
        castingTime: '1 ação',
        range: '3 metros',
        components: 'V',
        duration: 'Instantânea',
        description: 'Esta magia instantaneamente transporta você e até oito criaturas voluntárias de sua escolha que você possa ver dentro do alcance, ou um único objeto que você possa ver dentro do alcance, para um destino que você selecionar. Se você mirar em um local, você e suas companhias aparecem no espaço desocupado mais próximo do local que você descreveu.',
        classes: ['Mago', 'Feiticeiro', 'Bardo'],
        concentration: false
    },
    // NÍVEL 8
    {
        id: 'terremoto',
        name: 'Terremoto',
        level: 8,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '150 metros',
        components: 'V, S, M (uma pitada de terra, um pedaço de rocha e um torrão de argila)',
        duration: 'Concentração, até 1 minuto',
        description: 'Você cria uma perturbação sísmica em um ponto no chão que você possa ver dentro do alcance. Pela duração, um tremor intenso rasga o chão em um círculo de 30 metros de raio centrado naquele ponto e sacode criaturas e estruturas em contato com o chão naquela área.',
        classes: ['Mago', 'Feiticeiro', 'Clérigo', 'Druida'],
        concentration: true
    },
    {
        id: 'dominar-monstro',
        name: 'Dominar Monstro',
        level: 8,
        school: 'Encantamento',
        castingTime: '1 ação',
        range: '18 metros',
        components: 'V, S',
        duration: 'Concentração, até 1 hora',
        description: 'Você tenta seduzir uma criatura que você possa ver dentro do alcance. Ela deve ser bem-sucedida em um teste de resistência de Sabedoria ou será enfeitiçada por você pela duração. Se você ou criaturas que sejam amigáveis a você estiverem lutando com ela, ela tem vantagem no teste de resistência.',
        classes: ['Mago', 'Feiticeiro', 'Bardo', 'Bruxo'],
        concentration: true
    },
    // NÍVEL 9
    {
        id: 'desejo',
        name: 'Desejo',
        level: 9,
        school: 'Conjuração',
        castingTime: '1 ação',
        range: 'Pessoal',
        components: 'V',
        duration: 'Instantânea',
        description: 'Desejo é a mais poderosa magia que um mortal pode conjurar. Ao simplesmente falar em voz alta, você pode alterar os próprios fundamentos da realidade de acordo com seus desejos. O uso básico desta magia é duplicar qualquer outra magia de 8º nível ou inferior. Você não precisa atender aos requisitos daquela magia, incluindo componentes custosos.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'chuva-de-meteoros',
        name: 'Chuva de Meteoros',
        level: 9,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '1,5 km',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Orbes flamejantes caem no chão em quatro pontos diferentes que você possa ver dentro do alcance. Cada criatura em uma esfera de 12 metros de raio centrada em cada ponto que você escolher deve fazer um teste de resistência de Destreza. A esfera se espalha ao redor de cantos. Uma criatura sofre 20d6 de dano de fogo e 20d6 de dano de concussão em um fracasso, ou metade do dano em um sucesso.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'corrente-de-relampagos',
        name: 'Corrente de Relâmpagos',
        level: 6,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '45 metros',
        components: 'V, S, M (um pouco de pelo; uma vareta de âmbar, cristal ou vidro; e três contas de prata)',
        duration: 'Instantânea',
        description: 'Você cria um relâmpago que atinge um alvo de sua escolha que você possa ver dentro do alcance. Três raios então saltam do alvo para outros três alvos, cada um dos quais deve estar a até 9 metros do alvo primário. Um alvo sofre 10d8 de dano elétrico em um fracasso, ou metade em um sucesso.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    },
    {
        id: 'cura-completa',
        name: 'Cura Completa (Heal)',
        level: 6,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '18 metros',
        components: 'V, S',
        duration: 'Instantânea',
        description: 'Uma onda de energia curativa flui através de uma criatura que você possa ver dentro do alcance. O alvo recupera 70 pontos de vida. Esta magia também encerra cegueira, surdez e qualquer doença que afete o alvo.',
        classes: ['Clérigo', 'Druida'],
        concentration: false
    },
    {
        id: 'inverter-a-gravidade',
        name: 'Inverter a Gravidade',
        level: 7,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: '30 metros',
        components: 'V, S, M (uma caneca de ferro e um pouco de limalha de ferro)',
        duration: 'Concentração, até 1 minuto',
        description: 'Esta magia inverte a gravidade em um cilindro de 15 metros de raio e 30 metros de altura centrado em um ponto dentro do alcance. Todas as criaturas e objetos que não estejam fixados ao chão na área caem para cima e param no topo da área pela duração.',
        classes: ['Mago', 'Feiticeiro', 'Druida'],
        concentration: true
    },
    {
        id: 'explosao-solar',
        name: 'Explosão Solar (Sunburst)',
        level: 8,
        school: 'Evocação',
        castingTime: '1 ação',
        range: '45 metros',
        components: 'V, S, M (uma lupa e um pedaço de calcita)',
        duration: 'Instantânea',
        description: 'Luz solar brilhante brilha em um raio de 18 metros centrado em um ponto que você escolher dentro do alcance. Cada criatura na luz deve fazer um teste de resistência de Constituição. Em um fracasso, uma criatura sofre 12d6 de dano radiante e fica cega por 1 minuto.',
        classes: ['Mago', 'Feiticeiro', 'Clérigo', 'Druida'],
        concentration: false
    },
    {
        id: 'parar-o-tempo',
        name: 'Parar o Tempo',
        level: 9,
        school: 'Transmutação',
        castingTime: '1 ação',
        range: 'Pessoal',
        components: 'V',
        duration: 'Instantânea',
        description: 'Você para brevemente o fluxo do tempo para todos, exceto para você. O tempo não passa para outras criaturas, enquanto você realiza 1d4 + 1 turnos em sequência, durante os quais você pode usar ações e mover-se normalmente.',
        classes: ['Mago', 'Feiticeiro'],
        concentration: false
    }
];

import { firestoreCache } from './cache-service';

// Função para buscar magias do Firestore
export async function fetchGlobalSpells(): Promise<Spell[]> {
    try {
        const cachedSpells = firestoreCache.get('magias');
        if (cachedSpells) {
            console.log('📦 [CacheService] Recuperando do cache: magias');
            return cachedSpells as Spell[];
        }

        console.log('🔥 [Firestore] Buscando magias do banco de dados...');
        const spellsRef = collection(db, 'magias');
        const q = query(spellsRef, orderBy('name'));
        const snapshot = await getDocs(q);

        const dbSpells = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Spell));

        console.log(`✅ [Firestore] ${dbSpells.length} magias carregadas do banco de dados`);

        // ⚠️ REMOVIDO: Não mesclar com spellsDatabase hardcoded
        firestoreCache.set('magias', dbSpells);
        return dbSpells;
    } catch (error) {
        console.error('❌ [Firestore] Erro ao buscar magias:', error);
        // Fallback: retornar array vazio ao invés de hardcoded
        console.warn('⚠️ Retornando array vazio devido ao erro');
        return [];
    }
}

// Função para calcular o número de truques conhecidos por classe e nível
export function getKnownTricksCount(className: string, lvl: number): number {
    const lower = className.toLowerCase();

    if (lower.includes('bardo')) {
        if (lvl >= 10) return 4;
        if (lvl >= 4) return 3;
        return 2;
    }
    if (lower.includes('clérigo') || lower.includes('clerigo')) {
        if (lvl >= 10) return 5;
        if (lvl >= 4) return 4;
        return 3;
    }
    if (lower.includes('druida')) {
        if (lvl >= 10) return 4;
        if (lvl >= 4) return 3;
        return 2;
    }
    if (lower.includes('feiticeiro')) {
        if (lvl >= 10) return 6;
        if (lvl >= 4) return 4;
        return 3;
    }
    if (lower.includes('mago')) {
        if (lvl >= 10) return 5;
        if (lvl >= 4) return 4;
        return 3;
    }
    if (lower.includes('bruxo')) {
        if (lvl >= 10) return 4;
        if (lvl >= 4) return 3;
        return 2;
    }
    if (lower.includes('artífice') || lower.includes('artifice')) {
        if (lvl >= 14) return 4;
        if (lvl >= 10) return 3;
        return 2;
    }
    if (lower.includes('guardião') || lower.includes('guardiao')) {
        if (lvl >= 14) return 4;
        if (lvl >= 10) return 3;
        return 2;
    }
    return 0; // Para classes que não conhecem truques
}

// Função auxiliar para buscar magias
export function searchSpells(queryText: string, filters?: {
    level?: number;
    minLevel?: number;
    school?: string;
    class?: string;
}, baseSpells?: Spell[]): Spell[] {
    let results = baseSpells || spellsDatabase;

    // Filtro de texto
    if (queryText) {
        const lowerQuery = queryText.toLowerCase();
        results = results.filter(spell =>
            spell.name.toLowerCase().includes(lowerQuery) ||
            spell.description.toLowerCase().includes(lowerQuery)
        );
    }

    // Filtros adicionais
    if (filters?.level !== undefined) {
        // Se minLevel não estiver definido, assume que queremos o nível EXATO
        // Caso contrário, mantemos a lógica de "até o nível X" para criação de personagem
        if (filters.minLevel === undefined) {
            results = results.filter(spell => spell.level === filters.level);
        } else {
            results = results.filter(spell => spell.level <= filters.level);
        }
    }

    if (filters?.minLevel !== undefined) {
        results = results.filter(spell => spell.level >= filters.minLevel);
    }

    if (filters?.school) {
        results = results.filter(spell => spell.school === filters.school);
    }

    if (filters?.class) {
        const filterClass = filters.class.toLowerCase().trim();
        
        // Mapeamento de classes equivalentes (ex: Guardião usa magias de Patrulheiro)
        const equivalentClasses = [filterClass];
        if (filterClass === 'guardião' || filterClass === 'guardiao') {
            equivalentClasses.push('patrulheiro');
            equivalentClasses.push('ranger');
            
            // Se estiver filtrando por Truques (Nível 0), Guardião também pode ver truques de Druida
            if (filters.level === 0) {
                equivalentClasses.push('druida');
                equivalentClasses.push('druid');
            }
        }

        results = results.filter(spell => {
            // Normalizar o campo classes para um array de strings
            let spellClasses: string[] = [];

            if (Array.isArray(spell.classes)) {
                spellClasses = spell.classes.map(c => 
                    typeof c === 'string' ? c.toLowerCase().trim() : 
                    (c && typeof (c as any).name === 'string' ? (c as any).name.toLowerCase().trim() : '')
                );
            } else if (typeof (spell as any).classes === 'string') {
                spellClasses = (spell as any).classes.split(',').map((s: string) => s.toLowerCase().trim());
            } else if (typeof (spell as any).classe === 'string') {
                // Suporte para campo singular 'classe'
                spellClasses = (spell as any).classe.split(',').map((s: string) => s.toLowerCase().trim());
            } else if (Array.isArray((spell as any).classe)) {
                 spellClasses = (spell as any).classe.map((c: any) => typeof c === 'string' ? c.toLowerCase().trim() : '');
            }

            // Se não tem classes definidas, tratamos como universal/visível para todos
            if (spellClasses.length === 0 || (spellClasses.length === 1 && spellClasses[0] === '')) {
                return true; 
            }

            // Regra Especial: Guardião vê Truques de Druida
            if ((filterClass === 'guardião' || filterClass === 'guardiao') && spell.level === 0) {
                 if (spellClasses.some(c => c === 'druida' || c === 'druid')) return true;
            }

            // Verifica se alguma das classes da magia bate com a classe selecionada ou equivalentes
            return spellClasses.some(c => equivalentClasses.includes(c));
        });
    }

    // Ordenação: Nível ASC -> Nome ASC
    results.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
    });

    return results;
}
