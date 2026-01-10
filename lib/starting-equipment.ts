
// lib/starting-equipment.ts

export interface EquipmentOption {
    label: string;
    choices: Array<{
        name: string;
        quantity: number;
        type: 'weapon' | 'armor' | 'shield' | 'other';
        defaultName?: string; // Para casos de escolha genérica como "Uma arma simples"
    }>;
}

export interface ClassStartingEquipment {
    options: EquipmentOption[][]; // Array de opções onde o usuário escolhe UM item/pacote de cada sub-array
    defaultItems: Array<{ // Itens que todos da classe ganham
        name: string;
        quantity: number;
        type: 'weapon' | 'armor' | 'shield' | 'other';
    }>;
}

// Dados Simplificados baseados no SRD
export const CLASS_STARTING_EQUIPMENT: Record<string, ClassStartingEquipment> = {
    "Bárbaro": {
        options: [
            [
                { label: "Machado Grande (Greataxe)", choices: [{ name: "Machado Grande", quantity: 1, type: 'weapon' }] },
                { label: "Qualquer Arma Marcial", choices: [{ name: "Espada Longa", quantity: 1, type: 'weapon', defaultName: "Arma Marcial" }] }
            ],
            [
                { label: "Dois Machadinhas", choices: [{ name: "Machadinha", quantity: 2, type: 'weapon' }] },
                { label: "Qualquer Arma Simples", choices: [{ name: "Azagaia", quantity: 1, type: 'weapon', defaultName: "Arma Simples" }] }
            ]
        ],
        defaultItems: [
            { name: "Pacote de Explorador", quantity: 1, type: 'other' },
            { name: "Azagaia", quantity: 4, type: 'weapon' }
        ]
    },
    "Bardo": {
        options: [
            [
                { label: "Rapieira", choices: [{ name: "Rapieira", quantity: 1, type: 'weapon' }] },
                { label: "Espada Longa", choices: [{ name: "Espada Longa", quantity: 1, type: 'weapon' }] },
                { label: "Qualquer Arma Simples", choices: [{ name: "Adaga", quantity: 1, type: 'weapon', defaultName: "Arma Simples" }] }
            ],
            [
                { label: "Pacote de Diplomata", choices: [{ name: "Pacote de Diplomata", quantity: 1, type: 'other' }] },
                { label: "Pacote de Artista", choices: [{ name: "Pacote de Artista", quantity: 1, type: 'other' }] }
            ],
            [
                { label: "Alaúde", choices: [{ name: "Alaúde", quantity: 1, type: 'other' }] },
                { label: "Qualquer Instrumento Musical", choices: [{ name: "Flauta", quantity: 1, type: 'other', defaultName: "Instrumento Musical" }] }
            ]
        ],
        defaultItems: [
            { name: "Armadura de Couro", quantity: 1, type: 'armor' },
            { name: "Adaga", quantity: 1, type: 'weapon' }
        ]
    },
    "Clérigo": {
        options: [
            [
                { label: "Maça", choices: [{ name: "Maça", quantity: 1, type: 'weapon' }] },
                { label: "Martelo de Guerra (se proficiente)", choices: [{ name: "Martelo de Guerra", quantity: 1, type: 'weapon' }] }
            ],
            [
                { label: "Cota de Malha (se proficiente)", choices: [{ name: "Cota de Malha", quantity: 1, type: 'armor' }] },
                { label: "Couro Batido", choices: [{ name: "Armadura de Couro Batido", quantity: 1, type: 'armor' }] },
                { label: "Cota de Escamas", choices: [{ name: "Cota de Escamas", quantity: 1, type: 'armor' }] }
            ],
            [
                { label: "Besta Leve e 20 virotes", choices: [{ name: "Besta Leve", quantity: 1, type: 'weapon' }, { name: "Virotes", quantity: 20, type: 'other' }] },
                { label: "Qualquer Arma Simples", choices: [{ name: "Clava", quantity: 1, type: 'weapon', defaultName: "Arma Simples" }] }
            ],
            [
                { label: "Pacote de Sacerdote", choices: [{ name: "Pacote de Sacerdote", quantity: 1, type: 'other' }] },
                { label: "Pacote de Explorador", choices: [{ name: "Pacote de Explorador", quantity: 1, type: 'other' }] }
            ]
        ],
        defaultItems: [
            { name: "Escudo", quantity: 1, type: 'shield' },
            { name: "Símbolo Sagrado", quantity: 1, type: 'other' }
        ]
    },
    // Adicionar outras classes conforme necessário (Guerreiro, Ladino, Mago, etc.)
    // Por brevidade, vou implementar logica genérica ou placeholders para as demais, e focar nas principais para teste.
    "Guerreiro": {
        options: [
            [
                { label: "Cota de Malha", choices: [{ name: "Cota de Malha", quantity: 1, type: 'armor' }] },
                { label: "Armadura de Couro, Arco Longo e 20 flechas", choices: [{ name: "Armadura de Couro", quantity: 1, type: 'armor' }, { name: "Arco Longo", quantity: 1, type: 'weapon' }, { name: "Flechas", quantity: 20, type: 'other' }] }
            ],
            [
                { label: "Uma Arma Marcial e Escudo", choices: [{ name: "Espada Longa", quantity: 1, type: 'weapon', defaultName: "Arma Marcial" }, { name: "Escudo", quantity: 1, type: 'shield' }] },
                { label: "Duas Armas Marciais", choices: [{ name: "Espada Longa", quantity: 1, type: 'weapon', defaultName: "Arma Marcial 1" }, { name: "Machado de Batalha", quantity: 1, type: 'weapon', defaultName: "Arma Marcial 2" }] }
            ],
            [
                { label: "Besta Leve e 20 virotes", choices: [{ name: "Besta Leve", quantity: 1, type: 'weapon' }, { name: "Virotes", quantity: 20, type: 'other' }] },
                { label: "Dois Machadinhas", choices: [{ name: "Machadinha", quantity: 2, type: 'weapon' }] }
            ],
            [
                { label: "Pacote de Aventureiro", choices: [{ name: "Pacote de Aventureiro", quantity: 1, type: 'other' }] },
                { label: "Pacote de Explorador", choices: [{ name: "Pacote de Explorador", quantity: 1, type: 'other' }] }
            ]
        ],
        defaultItems: []
    },
    "Ladino": {
        options: [
            [
                { label: "Rapieira", choices: [{ name: "Rapieira", quantity: 1, type: 'weapon' }] },
                { label: "Espada Curta", choices: [{ name: "Espada Curta", quantity: 1, type: 'weapon' }] }
            ],
            [
                { label: "Arco Curto e 20 flechas", choices: [{ name: "Arco Curto", quantity: 1, type: 'weapon' }, { name: "Flechas", quantity: 20, type: 'other' }] },
                { label: "Espada Curta", choices: [{ name: "Espada Curta", quantity: 1, type: 'weapon' }] }
            ],
            [
                { label: "Pacote de Assaltante", choices: [{ name: "Pacote de Assaltante", quantity: 1, type: 'other' }] },
                { label: "Pacote de Aventureiro", choices: [{ name: "Pacote de Aventureiro", quantity: 1, type: 'other' }] },
                { label: "Pacote de Explorador", choices: [{ name: "Pacote de Explorador", quantity: 1, type: 'other' }] }
            ]
        ],
        defaultItems: [
            { name: "Armadura de Couro", quantity: 1, type: 'armor' },
            { name: "Adaga", quantity: 2, type: 'weapon' },
            { name: "Ferramentas de Ladrão", quantity: 1, type: 'other' }
        ]
    },
    "Mago": {
        options: [
            [
                { label: "Bastão", choices: [{ name: "Bastão", quantity: 1, type: 'weapon' }] },
                { label: "Adaga", choices: [{ name: "Adaga", quantity: 1, type: 'weapon' }] }
            ],
            [
                { label: "Bolsa de Componentes", choices: [{ name: "Bolsa de Componentes", quantity: 1, type: 'other' }] },
                { label: "Foco Arcano", choices: [{ name: "Foco Arcano", quantity: 1, type: 'other' }] }
            ],
            [
                { label: "Pacote de Estudioso", choices: [{ name: "Pacote de Estudioso", quantity: 1, type: 'other' }] },
                { label: "Pacote de Explorador", choices: [{ name: "Pacote de Explorador", quantity: 1, type: 'other' }] }
            ]
        ],
        defaultItems: [
            { name: "Livro de Magias", quantity: 1, type: 'other' }
        ]
    }
};
