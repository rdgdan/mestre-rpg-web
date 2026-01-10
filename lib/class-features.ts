
// lib/class-features.ts

export interface ClassFeature {
    name: string;
    description: string;
    isChoice?: boolean;
    choiceText?: string;
}

export interface LevelProgression {
    features: ClassFeature[];
    hitDice?: string;
    hpIncrease?: string;
    spells?: string[]; // IDs das magias aprendidas automaticamente
}

const ASI: ClassFeature = { name: "Melhoria no Valor de Atributo", description: "Aumento de Atributo ou Talento.", isChoice: true };

export const CLASS_PROGRESSION: Record<string, Record<number, LevelProgression>> = {
    "Bárbaro": {
        1: { features: [{ name: "Fúria", description: "Vantagem em testes de Força, bônus no dano e resistência a danos físicos." }, { name: "Defesa Sem Armadura", description: "CA = 10 + Destreza + Constituição." }], hitDice: "1d12" },
        2: { features: [{ name: "Ataque Temerário", description: "Vantagem em ataques, mas ataques contra você também têm vantagem." }, { name: "Sentido de Perigo", description: "Vantagem em salvaguardas de Destreza." }] },
        3: { features: [{ name: "Caminho Primitivo", description: "Escolha sua trilha de fúria.", isChoice: true }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Ataque Extra", description: "Pode atacar duas vezes." }, { name: "Movimento Rápido", description: "Deslocamento aumenta em 3 metros." }] },
        6: { features: [{ name: "Recurso de Caminho Primitivo", description: "Habilidade baseada na sua subclasse." }] },
        7: { features: [{ name: "Instinto Selvagem", description: "Vantagem em Iniciativa." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Crítico Brutal (1 dado)", description: "Role um dado extra de dano em acertos críticos." }] },
        10: { features: [{ name: "Recurso de Caminho Primitivo", description: "Habilidade baseada na sua subclasse." }] },
        11: { features: [{ name: "Fúria Implacável", description: "Pode persistir lutando mesmo com 0 PV." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Crítico Brutal (2 dados)", description: "Role dois dados extras de dano em acertos críticos." }] },
        14: { features: [{ name: "Recurso de Caminho Primitivo", description: "Habilidade baseada na sua subclasse." }] },
        15: { features: [{ name: "Fúria Persistente", description: "Sua fúria só termina se você cair inconsciente ou encerrá-la." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Crítico Brutal (3 dados)", description: "Role três dados extras de dano em acertos críticos." }] },
        18: { features: [{ name: "Força Indomável", description: "Seu teste de Força não pode ser menor que seu valor base de Força." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Campeão Primal", description: "Sua Força e Constituição aumentam em 4, até o máximo de 24!" }] }
    },
    "Bardo": {
        1: { features: [{ name: "Inspiração Bárdica (d6)", description: "Ajude aliados com dados de bônus." }, { name: "Conjuração", description: "Lance magias através da música ou oratória." }], hitDice: "1d8" },
        2: { features: [{ name: "Pau para Toda Obra", description: "Bônus em perícias nâo proficientes." }, { name: "Canção de Descanso (d6)", description: "Aumenta cura em descansos curtos." }] },
        3: { features: [{ name: "Colégio Bárdico", description: "Escolha sua especialização.", isChoice: true }, { name: "Especialização", description: "Dobre bônus em 2 perícias.", isChoice: true }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Fonte de Inspiração", description: "Recupera Inspiração Bárdica em descansos curtos." }, { name: "Inspiração Bárdica (d8)", description: "Dado aumenta para d8." }] },
        6: { features: [{ name: "Recurso de Colégio Bárdico", description: "Habilidade de subclasse." }, { name: "Contra-encanto", description: "Use música para proteger aliados de medo ou encanto." }] },
        7: { features: [{ name: "Magias de 4º Nível", description: "Acesso a magias mais poderosas." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Canção de Descanso (d8)", description: "Cura aumentada para d8." }] },
        10: { features: [{ name: "Inspiração Bárdica (d10)", description: "Dado aumenta para d10." }, { name: "Segredos Mágicos", description: "Aprenda magias de outras classes!", isChoice: true }, { name: "Especialização", description: "Mais 2 perícias com bônus dobrado.", isChoice: true }] },
        11: { features: [{ name: "Magias de 6º Nível", description: "Acesso a segredos arcanos superiores." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Canção de Descanso (d10)", description: "Cura aumentada para d10." }] },
        14: { features: [{ name: "Recurso de Colégio Bárdico", description: "Habilidade de subclasse final." }, { name: "Segredos Mágicos", description: "Mais 2 magias de qualquer classe.", isChoice: true }] },
        15: { features: [{ name: "Inspiração Bárdica (d12)", description: "Dado aumenta para d12." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Canção de Descanso (d12)", description: "Cura máxima em descansos." }] },
        18: { features: [{ name: "Segredos Mágicos", description: "Última seleção de magias externas.", isChoice: true }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Inspiração Superior", description: "Se não tiver Inspiração ao iniciar o combate, recupera um dado." }] }
    },
    "Clérigo": {
        1: { features: [{ name: "Domínio Divino", description: "Escolha o domínio do seu deus.", isChoice: true }, { name: "Conjuração", description: "Canalize o poder dos deuses." }], hitDice: "1d8" },
        2: { features: [{ name: "Canalizar Divindade (1/uso)", description: "Use energia divina para efeitos especiais." }] },
        3: { features: [{ name: "Magias de 2º Nível", description: "Acesso a milagres maiores." }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Destruir Mortos-Vivos (ND 1/2)", description: "Expulse e destrua criaturas profanas." }] },
        6: { features: [{ name: "Canalizar Divindade (2/usos)", description: "Mais frequencia de poder divino." }, { name: "Recurso de Domínio", description: "Habilidade de subclasse." }] },
        7: { features: [{ name: "Magias de 4º Nível", description: "Milagres de grande escala." }] },
        8: { features: [ASI], hpIncrease: "Potencializa seus ataques ou magias." },
        9: { features: [{ name: "Magias de 5º Nível", description: "Milagres supremos." }] },
        10: { features: [{ name: "Intervenção Divina", description: "Peça ajuda direta ao seu deus (porcentagem de chance)." }] },
        11: { features: [{ name: "Destruir Mortos-Vivos (ND 2)", description: "Destrua mortos-vivos mais fortes." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 7º Nível", description: "Poder sagrado avassalador." }] },
        14: { features: [{ name: "Destruir Mortos-Vivos (ND 3)", description: "Poder de purificação aumentado." }] },
        15: { features: [{ name: "Magias de 8º Nível", description: "Milagres lendários." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Destruir Mortos-Vivos (ND 4)", description: "Mestre da purificação." }, { name: "Recurso de Domínio", description: "Poder final da subclasse." }] },
        18: { features: [{ name: "Canalizar Divindade (3/usos)", description: "Poder divino quase constante." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Intervenção Divina Garantida", description: "Seu deus agora responde SEMPRE ao seu chamado!" }] }
    },
    "Druida": {
        1: { features: [{ name: "Druídico", description: "O idioma secreto da natureza." }, { name: "Conjuração", description: "Manipule as forças da natureza." }], hitDice: "1d8" },
        2: { features: [{ name: "Forma Selvagem", description: "Transforme-se em animais." }, { name: "Círculo Druídico", description: "Escolha seu círculo sagrado.", isChoice: true }] },
        3: { features: [{ name: "Magias de 2º Nível", description: "Acesso a magias naturais mais fortes." }] },
        4: { features: [ASI], hpIncrease: "Forma Selvagem melhorada (ND 1/2, sem voo)." },
        5: { features: [{ name: "Magias de 3º Nível", description: "Comande o clima e as plantas." }] },
        6: { features: [{ name: "Recurso de Círculo Druídico", description: "Habilidade de subclasse." }] },
        7: { features: [{ name: "Magias de 4º Nível", description: "Acesso a grandes magias naturais." }] },
        8: { features: [ASI], hpIncrease: "Forma Selvagem melhorada (ND 1, com voo)." },
        9: { features: [{ name: "Magias de 5º Nível", description: "Fale com o próprio mundo." }] },
        10: { features: [{ name: "Recurso de Círculo Druídico", description: "Habilidade de subclasse superior." }] },
        11: { features: [{ name: "Magias de 6º Nível", description: "Poder natural devastador." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 7º Nível", description: "Acesso a eras antigas da natureza." }] },
        14: { features: [{ name: "Recurso de Círculo Druídico", description: "Poder final da natureza." }] },
        15: { features: [{ name: "Magias de 8º Nível", description: "Regência sobre o bioma." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Magias de 9º Nível", description: "Avatar da natureza." }] },
        18: { features: [{ name: "Corpo Atemporal", description: "Envelhece 10 anos a cada 100!" }, { name: "Magias de Fera", description: "Lance magias enquanto estiver em Forma Selvagem." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Arquidruida", description: "Uso de Forma Selvagem ILIMITADO e ignora componentes verbais/somáticos!" }] }
    },
    "Guerreiro": {
        1: { features: [{ name: "Estilo de Luta", description: "Sua especialidade marcial.", isChoice: true }, { name: "Retomada de Fôlego", description: "Cura rápida em combate." }], hitDice: "1d10" },
        2: { features: [{ name: "Surto de Ação (1/uso)", description: "Ação extra no turno." }] },
        3: { features: [{ name: "Arquétipo Marcial", description: "Escolha sua especialidade.", isChoice: true }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Ataque Extra (1)", description: "Dois ataques por ação." }] },
        6: { features: [ASI] },
        7: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade de subclasse." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Indomável (1/uso)", description: "Role novamente uma salvaguarda falha." }] },
        10: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade marcante da subclasse." }] },
        11: { features: [{ name: "Ataque Extra (2)", description: "Três ataques por ação!" }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Indomável (2/usos)", description: "Mais resiliência mental e física." }] },
        14: { features: [ASI] },
        15: { features: [{ name: "Recurso de Arquétipo", description: "Poder avançado da subclasse." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Surto de Ação (2/usos)", description: "Duas vezes a ação extra.", choiceText: "Não no mesmo turno." }, { name: "Indomável (3/usos)", description: "Coração de aço." }] },
        18: { features: [{ name: "Recurso de Arquétipo", description: "Poder final da subclasse." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Ataque Extra (3)", description: "QUATRO ataques em uma única ação! O terror dos campos de batalha." }] }
    },
    "Ladino": {
        1: { features: [{ name: "Ataque Furtivo (1d6)", description: "Dano extra em alvos vulneráveis." }, { name: "Especialização", description: "Foco extremo em 2 perícias.", isChoice: true }, { name: "Gíria de Ladrão", description: "Linguagem secreta do submundo." }], hitDice: "1d8" },
        2: { features: [{ name: "Ação Astuta", description: "Corre, Desengaja ou Esconde como Bônus." }] },
        3: { features: [{ name: "Arquétipo de Ladino", description: "Escolha sua especialidade.", isChoice: true }, { name: "Ataque Furtivo (2d6)", description: "Dano aumentado." }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Esquiva Sobrenatural", description: "Reduza dano de ataques pela metade usando Reação." }, { name: "Ataque Furtivo (3d6)", description: "Dano aumentado." }] },
        6: { features: [{ name: "Especialização", description: "Mais 2 perícias com bônus dobrado.", isChoice: true }] },
        7: { features: [{ name: "Evasão", description: "Dano zero em salvaguardas de Destreza bem-sucedidas." }, { name: "Ataque Furtivo (4d6)", description: "Dano aumentado." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade de subclasse." }, { name: "Ataque Furtivo (5d6)", description: "Dano aumentado." }] },
        10: { features: [ASI] },
        11: { features: [{ name: "Talento Confiável", description: "Suas rolagens de perícias (proficientes) nunca são menores que 10 no dado.", choiceText: "Transforma qualquer resultado 1-9 em 10." }, { name: "Ataque Furtivo (6d6)", description: "Dano aumentado." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade superior de subclasse." }, { name: "Ataque Furtivo (7d6)", description: "Dano aumentado." }] },
        14: { features: [{ name: "Sentido Cego", description: "Perceba criaturas escondidas a 3 metros." }] },
        15: { features: [{ name: "Mente Escorregadia", description: "Proficiência em testes de Sabedoria." }, { name: "Ataque Furtivo (8d6)", description: "Dano aumentado." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade final de subclasse." }, { name: "Ataque Furtivo (9d6)", description: "Dano aumentado." }] },
        18: { features: [{ name: "Evasivo", description: "Ataques contra você não têm vantagem se você não estiver incapacitado." }] },
        19: { features: [ASI], hpIncrease: "Ataque Furtivo (10d6)" },
        20: { features: [{ name: "Golpe de Sorte", description: "Transforme uma falha em sucesso natural (1/descanso curto)." }] }
    },
    "Monge": {
        1: { features: [{ name: "Defesa Sem Armadura", description: "CA = 10 + Destreza + Sabedoria." }, { name: "Artes Marciais (d4)", description: "Bônus para ataques desarmados." }], hitDice: "1d8" },
        2: { features: [{ name: "Ki", description: "Energia mística para Rajada de Golpes, Defesa Paciente e Passo do Vento." }, { name: "Movimento Sem Armadura (+3m)", description: "Velocidade aumentada." }] },
        3: { features: [{ name: "Tradição Monástica", description: "Escolha seu monastério.", isChoice: true }, { name: "Defletir Projéteis", description: "Pegue ou desvie flechas." }] },
        4: { features: [ASI], hpIncrease: "Queda Suave (Dano reduzido: 5x nível de monge)." },
        5: { features: [{ name: "Ataque Extra", description: "Dois ataques por ação." }, { name: "Ataque Atordoante", description: "Gaste Ki para atordoar alvos." }, { name: "Artes Marciais (d6)", description: "Dano aumentado." }] },
        6: { features: [{ name: "Golpes de Ki", description: "Seus ataques desarmados contam como mágicos." }, { name: "Movimento Sem Armadura (+4,5m)", description: "Velocidade aumentada." }] },
        7: { features: [{ name: "Evasão", description: "Evite dano de áreas de efeito." }, { name: "Tranquilidade de Mente", description: "Encerre efeitos de medo ou encanto em si mesmo." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Passo das Nuvens", description: "Pode correr por superfícies líquidas e paredes." }, { name: "Movimento Sem Armadura (+6m)", description: "Velocidade aumentada." }] },
        10: { features: [{ name: "Pureza de Corpo", description: "Imunidade a doenças e venenos." }, { name: "Artes Marciais (d8)", description: "Dano aumentado." }] },
        11: { features: [{ name: "Recurso de Tradição", description: "Habilidade superior de monge." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Língua do Sol e da Lua", description: "Entenda e fale todos os idiomas." }] },
        14: { features: [{ name: "Alma Diamantina", description: "Proficiência em TODAS as salvaguardas!" }, { name: "Movimento Sem Armadura (+7,5m)", description: "Velocidade aumentada." }] },
        15: { features: [{ name: "Corpo Atemporal", description: "Não sofre efeitos da velhice e não precisa comer/beber." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Recurso de Tradição", description: "Mestria final da subclasse." }, { name: "Artes Marciais (d10)", description: "Dano aumentado." }] },
        18: { features: [{ name: "Corpo Vazio", description: "Invisibilidade e projeção astral usando Ki." }, { name: "Movimento Sem Armadura (+9m)", description: "Velocidade aumentada." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Auto-perfeição", description: "Se não tiver Ki ao iniciar combate, recupera 4 pontos de Ki." }] }
    },
    "Paladino": {
        1: { features: [{ name: "Sentido Divino", description: "Detecte seres celestiais, fiéis ou mortos-vivos." }, { name: "Mãos Curadoras", description: "Cure feridas com seu toque (5x nível)." }], hitDice: "1d10" },
        2: { features: [{ name: "Estilo de Luta", description: "Sua especialidade defensiva ou ofensiva.", isChoice: true }, { name: "Conjuração", description: "Lance magias de paladino." }, { name: "Destruição Divina", description: "Converta magias em dano radiante extra!" }] },
        3: { features: [{ name: "Saúde Divina", description: "Imunidade a doenças." }, { name: "Juramento Sagrado", description: "Sua subclasse e dever.", isChoice: true }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Ataque Extra", description: "Dois ataques por ação." }] },
        6: { features: [{ name: "Aura de Proteção", description: "Bônus de Carisma para salvaguardas de aliados próximos (3m)." }] },
        7: { features: [{ name: "Recurso de Juramento", description: "Habilidade de aura da subclasse." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Magias de 3º Nível", description: "Acesso a poderes sagrados superiores." }] },
        10: { features: [{ name: "Aura de Coragem", description: "Aliados próximos não podem ser amedrontados." }] },
        11: { features: [{ name: "Destruição Divina Aprimorada", description: "Seus ataques causam +1d8 radiante SEMPRE." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 4º Nível", description: "Poder de campeão divino." }] },
        14: { features: [{ name: "Toque Purificador", description: "Use sua ação para encerrar magias em você ou aliados." }] },
        15: { features: [{ name: "Recurso de Juramento", description: "Habilidade avançada da subclasse." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Magias de 5º Nível", description: "O ápice do poder sagrado." }] },
        18: { features: [{ name: "Melhoria de Áura", description: "O alcance de todas as suas auras aumenta para 9 metros!" }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Avatar Sagrado", description: "Forma final baseada no seu juramento (1/dia).", isChoice: true }] }
    },
    "Patrulheiro": {
        1: { features: [{ name: "Inimigo Favorito", description: "Bônus contra tipos específicos de criaturas.", isChoice: true }, { name: "Explorador Natural", description: "Vantagem em terrenos específicos.", isChoice: true }], hitDice: "1d10" },
        2: { features: [{ name: "Estilo de Luta", description: "Arqueiro, Duelista, etc.", isChoice: true }, { name: "Conjuração", description: "Lance magias de patrulheiro." }] },
        3: { features: [{ name: "Arquétipo de Patrulheiro", description: "Escolha sua especialidade.", isChoice: true }, { name: "Prontidão Primal", description: "Detecte criaturas a quilômetros." }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Ataque Extra", description: "Dois ataques por ação." }] },
        6: { features: [{ name: "Melhoria de Inimigo/Explorador", description: "Escolha novos tipos.", isChoice: true }] },
        7: { features: [{ name: "Recurso de Arquétipo", description: "Habilidade de subclasse." }] },
        8: { features: [ASI], hpIncrease: "Caminhar na Terra (Ignore terreno difícil não mágico)." },
        9: { features: [{ name: "Magias de 3º Nível", description: "Acesso a domínios da natureza." }] },
        10: { features: [{ name: "Desaparecer", description: "Pode usar Esconder-se como ação bônus." }, { name: "Camuflagem na Natureza", description: "Crie disfarces de lama e folhagem." }] },
        11: { features: [{ name: "Recurso de Arquétipo", description: "Poder superior da subclasse." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 4º Nível", description: "Poder de caçador supremo." }] },
        14: { features: [{ name: "Melhoria de Inimigo/Explorador", description: "Escolha novos tipos.", isChoice: true }, { name: "Sentido Desvanecente", description: "Vantagem em Testes de Sobrevivência contra rastros." }] },
        15: { features: [{ name: "Recurso de Arquétipo", description: "Mestria final da subclasse." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Magias de 5º Nível", description: "O ápice do patrulheiro." }] },
        18: { features: [{ name: "Sentidos Selvagens", description: "Lute perfeitamente contra alvos que não consegue ver." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Matador de Inimigos", description: "Adicione modificador de Sabedoria ao dano contra seus Inimigos Favoritos!" }] }
    },
    "Feiticeiro": {
        1: { features: [{ name: "Origem Feiticeira", description: "A fonte do seu poder inato.", isChoice: true }, { name: "Conjuração", description: "Lance magias através da força de vontade." }], hitDice: "1d6" },
        2: { features: [{ name: "Fonte de Magia", description: "Pontos de Feitiçaria para criar espaços de magia." }] },
        3: { features: [{ name: "Metamagia (2 opções)", description: "Molde suas magias.", isChoice: true }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Magias de 3º Nível", description: "Acesso a explosões de poder arcano." }] },
        6: { features: [{ name: "Recurso de Origem", description: "Habilidade de subclasse." }] },
        7: { features: [{ name: "Magias de 4º Nível", description: "Dobre a realidade ao seu redor." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Magias de 5º Nível", description: "Manifestações épicas de poder." }] },
        10: { features: [{ name: "Metamagia (3ª opção)", description: "Mais controle sobre sua magia.", isChoice: true }] },
        11: { features: [{ name: "Magias de 6º Nível", description: "Poder arcano avassalador." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 7º Nível", description: "Mestria sobre o cosmos." }] },
        14: { features: [{ name: "Recurso de Origem", description: "Poder superior da subclasse." }] },
        15: { features: [{ name: "Magias de 8º Nível", description: "Poder divino de feiticeiro." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Magias de 9º Nível", description: "Manifestação definitiva da magia." }, { name: "Metamagia (4ª opção)", description: "Domínio total sobre feitiços.", isChoice: true }] },
        18: { features: [{ name: "Recurso de Origem", description: "Mestria final da subclasse." }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Restauração de Feiticeiro", description: "Recupere 4 pontos de feitiçaria em descansos curtos." }] }
    },
    "Bruxo": {
        1: { features: [{ name: "Patrono Transcendente", description: "Entidade com quem fez seu pacto.", isChoice: true }, { name: "Magia de Pacto", description: "Recupera espaços de magia em descansos CURTOS!" }], hitDice: "1d8" },
        2: { features: [{ name: "Invocações Místicas (2)", description: "Poderes extras concedidos pelo patrono.", isChoice: true }] },
        3: { features: [{ name: "Dádiva do Pacto", description: "Bênção especial (Lâmina, Tomo ou Corrente).", isChoice: true }, { name: "Magias de 2º Nível", description: "Poder de sombra aumentado." }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Invocações Místicas (3)", description: "Novos segredos aprendidos.", isChoice: true }, { name: "Magias de 3º Nível", description: "Energia do patrono aumentada." }] },
        6: { features: [{ name: "Recurso de Patrono", description: "Habilidade de subclasse." }] },
        7: { features: [{ name: "Invocações Místicas (4)", description: "Segredos proibidos.", isChoice: true }, { name: "Magias de 4º Nível", description: "Manifestação de poder obscuro." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Invocações Místicas (5)", description: "Poderes ocultos.", isChoice: true }, { name: "Magias de 5º Nível", description: "O máximo da Magia de Pacto." }] },
        10: { features: [{ name: "Recurso de Patrono", description: "Resiliência ou poder extra." }] },
        11: { features: [{ name: "Arcano Místico (6º Nível)", description: "Um segredo de 6º nível que pode ser usado 1/dia." }, { name: "Invocações Místicas (6)", description: "Conhecimento sombrio.", isChoice: true }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Arcano Místico (7º Nível)", description: "Um segredo de 7º nível.", isChoice: true }, { name: "Invocações Místicas (7)", description: "Segredos finais.", isChoice: true }] },
        14: { features: [{ name: "Recurso de Patrono", description: "Poder final da entidade pactuada." }] },
        15: { features: [{ name: "Arcano Místico (8º Nível)", description: "Um segredo de 8º nível.", isChoice: true }, { name: "Invocações Místicas (8)", description: "O ápice das invocações.", isChoice: true }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Arcano Místico (9º Nível)", description: "O segredo oculto final de 9º nível.", isChoice: true }] },
        18: { features: [{ name: "Invocações Místicas (9)", description: "Lenda viva das sombras.", isChoice: true }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Mestre do Pacto", description: "Peça ao seu patrono para recuperar todos os seus espaços de magia instantaneamente (1/descanso longo)!" }] }
    },
    "Mago": {
        1: { features: [{ name: "Recuperação Arcana", description: "Recupere magias em descansos curtos." }, { name: "Conjuração", description: "Lance magias através do estudo e estudo." }], hitDice: "1d6" },
        2: { features: [{ name: "Tradição Arcana", description: "Sua escola de especialização mágica.", isChoice: true }] },
        3: { features: [{ name: "Magias de 2º Nível", description: "Segredos básicos revelados." }] },
        4: { features: [ASI] },
        5: { features: [{ name: "Magias de 3º Nível", description: "Acesso a Bolas de Fogo e mais." }] },
        6: { features: [{ name: "Recurso de Tradição", description: "Habilidade de subclasse." }] },
        7: { features: [{ name: "Magias de 4º Nível", description: "Manipule as leis da física." }] },
        8: { features: [ASI] },
        9: { features: [{ name: "Magias de 5º Nível", description: "Segredos arcanos superiores." }] },
        10: { features: [{ name: "Recurso de Tradição", description: "Habilidade avançada de escola." }] },
        11: { features: [{ name: "Magias de 6º Nível", description: "Poder de arquimago incipiente." }] },
        12: { features: [ASI] },
        13: { features: [{ name: "Magias de 7º Nível", description: "Mestria sobre o espaço-tempo." }] },
        14: { features: [{ name: "Recurso de Tradição", description: "Poder final de escola mágica." }] },
        15: { features: [{ name: "Magias de 8º Nível", description: "Segredos que desafiam a morte." }] },
        16: { features: [ASI] },
        17: { features: [{ name: "Magias de 9º Nível", description: "O ápice do conhecimento arcano." }] },
        18: { features: [{ name: "Mestria em Magia", description: "Escolha uma magia de 1º e 2º nível para lançar SEM gastar espaços!", isChoice: true }] },
        19: { features: [ASI] },
        20: { features: [{ name: "Assinatura Mágica", description: "Duas magias de 3º nível sempre preparadas e que não contam no limite!", isChoice: true }] }
    }
};

export const RACE_FEATURES: Record<string, ClassFeature[]> = {
    "Anão da Colina": [
        { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18 metros como se fosse luz plena, e na escuridão como se fosse penumbra." },
        { name: "Resiliência Anã", description: "Vantagem em salvaguardas contra veneno e resistência a dano de veneno." },
        { name: "Treinamento Anão em Combate", description: "Proficiência com machados de batalha, machadinhas, martelos leves e martelos de guerra." },
        { name: "Tenacidade Anã", description: "Seu máximo de pontos de vida aumenta em 1, e aumenta em 1 a cada nível." }
    ],
    "Anão da Montanha": [
        { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18 metros." },
        { name: "Resiliência Anã", description: "Vantagem contra veneno e resistência a veneno." },
        { name: "Treinamento Anão em Armaduras", description: "Proficiência com armaduras leves e médias." }
    ],
    "Elfo Alto": [
        { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18 metros." },
        { name: "Ancestralidade Feérica", description: "Vantagem em salvaguardas contra ser enfeitiçado e magia não pode colocar você para dormir." },
        { name: "Transe", description: "Elfos não precisam dormir. Meditam por 4 horas para obter os benefícios de um descanso longo." },
        { name: "Truque", description: "Você conhece um truque da lista de magias de mago. Inteligência é seu atributo de conjuração." }
    ],
    "Elfo da Floresta": [
        { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18 metros." },
        { name: "Ancestralidade Feérica", description: "Vantagem contra encanto e imune a sono mágico." },
        { name: "Pés Ligeiros", description: "Seu deslocamento base aumenta para 10,5 metros." },
        { name: "Máscara da Natureza", description: "Pode tentar se esconder mesmo quando estiver apenas levemente obscurecido por folhagem, chuva forte, neve, etc." }
    ],
    "Halfling Pés Leves": [
        { name: "Sortudo", description: "Quando rolar um 1 natural em um ataque, teste ou salvaguarda, você pode rolar novamente e deve usar o novo resultado." },
        { name: "Bravura", description: "Vantagem em salvaguardas contra medo." },
        { name: "Agilidade Halfling", description: "Pode se mover através do espaço de qualquer criatura que seja um tamanho maior que o seu." },
        { name: "Furtividade Natural", description: "Pode tentar se esconder mesmo quando estiver sendo obscurecido por uma criatura que seja pelo menos um tamanho maior que o seu." }
    ],
    "Halfling Robusto": [
        { name: "Sortudo", description: "Rola novamente 1s naturais." },
        { name: "Resiliência dos Robustos", description: "Vantagem em salvaguardas contra veneno e resistência a dano de veneno." }
    ],
    "Humano": [
        { name: "Linhagem Versátil", description: "Todas as suas pontuações de habilidade aumentam em 1." }
    ],
    "Draconato": [
        { name: "Ancestral Dracônico", description: "Escolha um tipo de dragão. Isso determina o tipo de dano da sua arma de sopro e sua resistência.", isChoice: true },
        { name: "Arma de Sopro", description: "Pode usar sua ação para exalar energia destrutiva (dano tipo do ancestral)." },
        { name: "Resistência a Dano", description: "Você tem resistência ao tipo de dano associado ao seu ancestral dracônico." }
    ],
    "Meio-Elfo": [
        { name: "Visão no Escuro", description: "18m" },
        { name: "Ancestralidade Feérica", description: "Vantagem contra encanto e imune a sono mágico." },
        { name: "Versatilidade em Perícias", description: "Você ganha proficiência em duas perícias à sua escolha." }
    ],
    "Meio-Orc": [
        { name: "Visão no Escuro", description: "18m" },
        { name: "Ameaçador", description: "Proficiência em Intimidação." },
        { name: "Resistência Implacável", description: "Quando cair a 0 PV mas não morrer, pode ficar com 1 PV (1/descanso longo)." },
        { name: "Ataques Selvagens", description: "Quando atingir um crítico com arma corpo-a-corpo, role um dos dados de dano da arma mais uma vez." }
    ],
    "Tiefling": [
        { name: "Visão no Escuro", description: "18m" },
        { name: "Resistência Infernal", description: "Resistência a dano de fogo." },
        { name: "Legado Infernal", description: "Conhece o truque Taumaturgia. No nível 3 lança Repreensão Infernal e no nível 5 lança Escuridão." }
    ]
};

export const DND_FEATS: ClassFeature[] = [
    { name: "Alerta", description: "+5 em Iniciativa, não pode ser surpreendido e outras criaturas não ganham vantagem por estarem escondidas de você." },
    { name: "Atirador de Elite", description: "Sem desvantagem por longa distância, ignora cobertura meia e três-quartos, pode sofrer -5 no ataque para causar +10 de dano." },
    { name: "Conjurador de Guerra", description: "Vantagem em Conciliação, realizar componentes somáticos com armas nas mãos e usar reação para lançar magia em vez de ataque de oportunidade." },
    { name: "Liderança Inspiradora", description: "Gasta 10 minutos para dar PV temporários a até 6 aliados (Nível + Modificador de Carisma)." },
    { name: "Mestre de Armas Grandes", description: "Ao crítico ou matar, ataque bônus. Pode sofrer -5 no ataque para causar +10 de dano." },
    { name: "Mestre de Escudos", description: "Adiciona bônus de CA do escudo em salvaguardas de Destreza, usa bônus para empurrar com ação bônus." },
    { name: "Mobilidade", description: "+3m de deslocamento, corre sem sofrer ataque de oportunidade de alvos que você tentou atacar." },
    { name: "Robusto", description: "Máximo de PV aumenta em 2x seu nível." },
    { name: "Sentinela", description: "Ataque de oportunidade reduz deslocamento a 0, pode atacar mesmo se criatura desengajar." }
];

export const SUBCLASS_CHOICE_LEVELS: Record<string, number> = {
    "Bárbaro": 3, "Bardo": 3, "Clérigo": 1, "Druida": 2, "Guerreiro": 3,
    "Monge": 3, "Paladino": 3, "Patrulheiro": 3, "Ladino": 3,
    "Feiticeiro": 1, "Bruxo": 1, "Mago": 2
};

export const SUBCLASSES: Record<string, Record<string, Record<number, LevelProgression>>> = {
    "Bárbaro": {
        "Caminho do Berserker": {
            3: { features: [{ name: "Frenesi", description: "Pode fazer um ataque extra como ação bônus enquanto em Fúria (sofre Exaustão depois)." }] },
            6: { features: [{ name: "Fúria Inabalável", description: "Não pode ser amedrontado ou enfeitiçado enquanto em Fúria." }] },
            10: { features: [{ name: "Presença Intimidante", description: "Use sua ação para amedrontar uma criatura." }] },
            14: { features: [{ name: "Retaliação", description: "Quando sofrer dano de uma criatura adjacente, use reação para atacar." }] }
        }
    },
    "Bardo": {
        "Colégio do Conhecimento": {
            3: { features: [{ name: "Perícias Adicionais", description: "Ganha proficiência em 3 perícias à sua escolha." }, { name: "Palavras de Corte", description: "Use reação e Inspiração para reduzir jogada de ataque, teste ou dano de um oponente." }] },
            6: { features: [{ name: "Segredos Mágicos Adicionais", description: "Aprenda 2 magias de qualquer classe (não contam no limite)." }] },
            14: { features: [{ name: "Habilidade Inigualável", description: "Use Inspiração Bárdica em seus próprios testes de habilidade." }] }
        }
    },
    "Clérigo": {
        "Domínio da Vida": {
            1: {
                features: [{ name: "Discípulo da Vida", description: "Suas magias de cura curam 2 + nível da magia extras." }, { name: "Proficiência Bônus", description: "Ganha proficiência com armaduras pesadas." }],
                spells: ['bencao', 'curar-ferimentos']
            },
            2: { features: [{ name: "Preservar a Vida", description: "Canalizar Divindade para curar aliados feridos." }] },
            6: { features: [{ name: "Curandeiro Abençoado", description: "Quando curar alguém, você também recupera PV." }] },
            8: { features: [{ name: "Golpe Divino", description: "+1d8 de dano radiante em ataques com arma (1/turno)." }] },
            17: { features: [{ name: "Cura Suprema", description: "Sempre usa o valor máximo dos dados ao curar." }] }
        }
    },
    "Druida": {
        "Círculo da Terra": {
            2: { features: [{ name: "Truque Adicional", description: "Ganha um truque de druida extra." }, { name: "Recuperação Natural", description: "Recupere espaços de magia em um descanso curto." }] },
            3: { features: [{ name: "Magias de Círculo", description: "Ganha magias baseadas no seu terreno escolhido.", isChoice: true }] },
            6: { features: [{ name: "Passo da Terra", description: "Terreno difícil não-mágico não custa movimento extra." }] },
            10: { features: [{ name: "Salvaguarda da Natureza", description: "Imunidade a veneno e doença, vantagem contra feérico/elemental." }] },
            14: { features: [{ name: "Santuário da Natureza", description: "Criaturas da natureza hesitam em te atacar." }] }
        }
    },
    "Guerreiro": {
        "Campeão": {
            3: { features: [{ name: "Crítico Aprimorado", description: "Seus ataques com armas marcam crítico com 19 ou 20." }] },
            7: { features: [{ name: "Atleta Extraordinário", description: "Bônus em testes físicos que não tenha proficiência e salto mais longo." }] },
            10: { features: [{ name: "Segundo Estilo de Luta", description: "Escolha um novo Estilo de Luta.", isChoice: true }] },
            15: { features: [{ name: "Crítico Superior", description: "Seus ataques marcam crítico com 18, 19 ou 20." }] },
            18: { features: [{ name: "Sobrevivente", description: "Recupera PV no início de cada turno se estiver abaixo da metade." }] }
        }
    },
    "Monge": {
        "Caminho da Mão Aberta": {
            3: { features: [{ name: "Técnica da Mão Aberta", description: "Adicione efeitos ao atingir com Rajada de Golpes (derrubar, empurrar ou impedir reações)." }] },
            6: { features: [{ name: "Integridade Corporal", description: "Cure-se em 3x seu nível como uma ação (1/descanso longo)." }] },
            11: { features: [{ name: "Tranquilidade", description: "Ganha os benefícios da magia Santuário após descanso longo." }] },
            17: { features: [{ name: "Palma Vibrante", description: "Crie vibrações letais no corpo de um oponente." }] }
        }
    },
    "Paladino": {
        "Juramento de Devoção": {
            3: { features: [{ name: "Arma Sagrada", description: "Carisma no acerto e arma emite luz.", isChoice: false }, { name: "Expulsar o Profano", description: "Amedronta mortos-vivos e ínferos." }] },
            7: { features: [{ name: "Aura de Devoção", description: "Você e aliados a 3m não podem ser enfeitiçados." }] },
            15: { features: [{ name: "Pureza de Espírito", description: "Sempre sob efeito de Proteção contra o Bem e Mal." }] },
            20: { features: [{ name: "Halo Sagrado", description: "Emite luz solar, causa dano radiante a inimigos e vantagem contra magias de mortos-vivos/ínferos." }] }
        }
    },
    "Patrulheiro": {
        "Caçador": {
            3: { features: [{ name: "Presa do Caçador", description: "Escolha entre Matador de Gigantes, Quebrador de Hordas ou Matador de Colossos.", isChoice: true }] },
            7: { features: [{ name: "Táticas Defensivas", description: "Escolha entre Escapar da Horda, Defesa Multiataque ou Vontade de Ferro.", isChoice: true }] },
            11: { features: [{ name: "Ataque de Multiataque", description: "Escolha entre Saraivada ou Ataque Giratório.", isChoice: true }] },
            15: { features: [{ name: "Defesa Superior do Caçador", description: "Escolha entre Evasão, Esquiva Sobrenatural ou Contra-atacar.", isChoice: true }] }
        }
    },
    "Ladino": {
        "Ladrão": {
            3: { features: [{ name: "Mãos Rápidas", description: "Ação bônus para Usar Objeto, Prestidigitação ou abrir fechaduras." }, { name: "Clandestino", description: "Escalar não custa movimento extra e saltos são maiores." }] },
            9: { features: [{ name: "Furtividade Suprema", description: "Vantagem em Furtividade se mover apenas metade do deslocamento." }] },
            13: { features: [{ name: "Usar Objeto Mágico", description: "Ignora requisitos de classe, raça ou nível para itens mágicos." }] },
            17: { features: [{ name: "Reflexos de Ladrão", description: "Age duas vezes no primeiro turno do combate." }] }
        }
    },
    "Feiticeiro": {
        "Linhagem Dracônica": {
            1: { features: [{ name: "Ancestral Dracônico", description: "Escolha um tipo de dragão (determina dano e resistência).", isChoice: true }, { name: "Resiliência Dracônica", description: "+1 PV por nível e CA base 13 sem armadura." }] },
            6: { features: [{ name: "Afinidade Elemental", description: "Soma Carisma no dano do seu elemento e pode ganhar resistência a ele." }] },
            14: { features: [{ name: "Asas Dracônicas", description: "Pode manifestar asas e voar com seu deslocamento normal." }] },
            18: { features: [{ name: "Presença Dracônica", description: "Aura de medo ou encanto de 18 metros." }] }
        }
    },
    "Bruxo": {
        "O Ínfero": {
            1: { features: [{ name: "Bavura do Matador", description: "Ganha PV temporários ao reduzir criatura a 0 PV." }] },
            6: { features: [{ name: "Sorte do Próprio Obscuro", description: "Adicione 1d10 a um teste ou salvaguarda (1/descanso curto)." }] },
            10: { features: [{ name: "Resiliência Diabólica", description: "Escolha um tipo de dano para ter resistência (muda a cada descanso).", isChoice: true }] },
            14: { features: [{ name: "Atirar pelo Inferno", description: "Ao atingir uma criatura, envie-a através de planos inferiores para causar 10d10 de dano psíquico." }] }
        }
    },
    "Mago": {
        "Escola de Evocação": {
            2: { features: [{ name: "Erudição de Evocação", description: "Tempo e custo para copiar magias de evocação caem pela metade." }, { name: "Esculpir Feitiços", description: "Crie áreas seguras para aliados em suas magias de área." }] },
            6: { features: [{ name: "Truque Potente", description: "Causa metade do dano mesmo se o alvo passar na salvaguarda." }] },
            10: { features: [{ name: "Evocação Fortalecida", description: "Adicione Modificador de Inteligência ao dano de magias de evocação." }] },
            14: { features: [{ name: "Sobrecarga Máxima", description: "Causa dano máximo em magias de 1º a 5º nível (sofre dano se repetir)." }] }
        }
    }
};
