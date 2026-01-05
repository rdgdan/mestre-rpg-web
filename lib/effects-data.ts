
export interface GameEffectTemplate {
    name: string;
    duration: number; // Duração sugerida em rodadas
    description: string;
    category: 'condição' | 'classe' | 'magia' | 'outro';
}

export const BASE_EFFECTS: GameEffectTemplate[] = [
    // Condições Padrão D&D 5e
    { name: 'Abatido (Prone)', duration: 99, description: 'Movimento custa o dobro. Ataques corpo a corpo contra têm vantagem. Ataques à distância têm desvantagem.', category: 'condição' },
    { name: 'Agarrado (Grappled)', duration: 99, description: 'Deslocamento se torna 0.', category: 'condição' },
    { name: 'Amedrontado (Frightened)', duration: 1, description: 'Desvantagem em testes e ataques enquanto a fonte do medo estiver visível.', category: 'condição' },
    { name: 'Atordoado (Stunned)', duration: 1, description: 'Incapacitado, falha em salvaguardas de Força e Destreza, ataques contra têm vantagem.', category: 'condição' },
    { name: 'Cego (Blinded)', duration: 1, description: 'Falha em testes de visão. Ataques contra têm vantagem. Seus ataques têm desvantagem.', category: 'condição' },
    { name: 'Charmado (Charmed)', duration: 1, description: 'Não pode atacar quem charmultou.', category: 'condição' },
    { name: 'Enfeitiçado (Charmed)', duration: 1, description: 'Não pode atacar quem o enfeitiçou. O feitiçador tem vantagem em interações sociais.', category: 'condição' },
    { name: 'Envenenado (Poisoned)', duration: 1, description: 'Desvantagem em jogadas de ataque e testes de atributo.', category: 'condição' },
    { name: 'Incapacitado (Incapacitated)', duration: 1, description: 'Não pode realizar ações ou reações.', category: 'condição' },
    { name: 'Inconsciente (Unconscious)', duration: 99, description: 'Incapacitado, larga o que estiver segurando, falha em salvaguardas de Força e Destreza. Ataques contra têm vantagem e são críticos se a 1,5m.', category: 'condição' },
    { name: 'Invisível (Invisible)', duration: 1, description: 'Impossível de ser visto sem ajuda magia. Ataques contra têm desvantagem. Seus ataques têm vantagem.', category: 'condição' },
    { name: 'Paralisado (Paralyzed)', duration: 1, description: 'Incapacitado, falha em salvaguardas de Força e Destreza. Ataques contra têm vantagem e são críticos se a 1,5m.', category: 'condição' },
    { name: 'Petrificado (Petrified)', duration: 99, description: 'Transformado em substância inanimada sólida. Peso aumenta 10x. Não envelhece.', category: 'condição' },
    { name: 'Preso (Restrained)', duration: 1, description: 'Deslocamento 0. Ataques contra têm vantagem. Seus ataques e salvaguardas de Destreza têm desvantagem.', category: 'condição' },
    { name: 'Surdo (Deafened)', duration: 1, description: 'Falha em testes de audição.', category: 'condição' },

    // Efeitos de Classe Comuns
    { name: 'Fúria (Barbarian Rage)', duration: 10, description: 'Vantagem em testes de Força, bônus de dano, resistência a danos físicos.', category: 'classe' },
    { name: 'Inspiração Bárdica', duration: 10, description: 'Adiciona um dado de bônus em um teste, ataque ou salvaguarda.', category: 'classe' },
    { name: 'Marca do Caçador', duration: 10, description: 'Dano extra de 1d6 ao acertar o alvo marcado.', category: 'classe' },
    { name: 'Benção (Bless)', duration: 10, description: 'Adiciona 1d4 em ataques e salvaguardas.', category: 'magia' },
    { name: 'Maldição (Bane)', duration: 10, description: 'Subtrai 1d4 de ataques e salvaguardas.', category: 'magia' },
    { name: 'Velocidade (Haste)', duration: 10, description: 'CA+2, vantagem em salvaguarda de Destreza, ação extra limitada.', category: 'magia' },
    { name: 'Fogo Fátuo (Faerie Fire)', duration: 10, description: 'Ataques contra o alvo têm vantagem.', category: 'magia' },
    { name: 'Escudo da Fé', duration: 10, description: 'CA +2.', category: 'magia' },
];
