// Base de dados de Magias D&D 5e (Português)
// Fonte: SRD 5.1 traduzido

export interface Spell {
    id: string;
    name: string;
    level: number;
    school: 'Abjuração' | 'Adivinhação' | 'Conjuração' | 'Encantamento' | 'Evocação' | 'Ilusão' | 'Necromancia' | 'Transmutação';
    castingTime: string;
    range: string;
    components: string;
    duration: string;
    description: string;
    classes: string[]; // Classes que podem usar esta magia
    ritual?: boolean;
    concentration?: boolean;
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
    }
];

// Função auxiliar para buscar magias
export function searchSpells(query: string, filters?: {
    level?: number;
    school?: string;
    class?: string;
}): Spell[] {
    let results = spellsDatabase;

    // Filtro de texto
    if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(spell =>
            spell.name.toLowerCase().includes(lowerQuery) ||
            spell.description.toLowerCase().includes(lowerQuery)
        );
    }

    // Filtros adicionais
    if (filters?.level !== undefined) {
        results = results.filter(spell => spell.level === filters.level);
    }

    if (filters?.school) {
        results = results.filter(spell => spell.school === filters.school);
    }

    if (filters?.class) {
        results = results.filter(spell => spell.classes.includes(filters.class));
    }

    return results;
}
