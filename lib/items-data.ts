
// lib/items-data.ts

export interface Weapon {
    id: string;
    name: string;
    damage: string;
    damageType: string;
    properties: string[];
    quantity: number;
    isMagical: boolean;
    magicalBonus: number;
    magicalEffect: string;
    // Novos campos para sincronia com Biblioteca
    diceQty?: number;
    diceType?: string;
    diceBonus?: number;
    isCustomDamage?: boolean;
    isProficient?: boolean;
}

export interface Currency {
    cp: number; // Peças de Cobre
    sp: number; // Peças de Prata
    ep: number; // Peças de Electro
    gp: number; // Peças de Ouro
    pp: number; // Peças de Platina
}

// --- NOVA ESTRUTURA PARA OUTROS EQUIPAMENTOS ---
export interface OtherEquipmentItem {
    id: string; // ID único para a instância do item no inventário
    name: string;
    quantity: number;
    isEquipped?: boolean;
    armorClass?: number;
    type?: 'armor' | 'shield' | 'other';
    description?: string;
    isMagical?: boolean;
    magicalBonus?: number;
    magicalEffect?: string;
}

export interface Inventory {
    weapons: Weapon[];
    currency: Currency;
    // O campo otherEquipment foi atualizado de string para um array de objetos
    otherEquipment: OtherEquipmentItem[];
}

// --- LISTAS DE DADOS PADRÃO ---

// Lista de armas padrão do D&D 5e
export const dndWeapons = [
    { name: "Adaga", damage: "1d4", damageType: "Perfurante", properties: ["Acuidade", "Leve", "Arremesso (distância 6/18m)"] },
    { name: "Azagaia", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 9/36m)"] },
    { name: "Bordão", damage: "1d6", damageType: "Concussão", properties: ["Versátil (1d8)"] },
    { name: "Clava Grande", damage: "1d8", damageType: "Concussão", properties: ["Duas Mãos"] },
    { name: "Foice Curta", damage: "1d4", damageType: "Cortante", properties: ["Leve"] },
    { name: "Lança Curta", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 6/18m)", "Versátil (1d8)"] },
    { name: "Maça", damage: "1d6", damageType: "Concussão", properties: [] },
    { name: "Machadinha", damage: "1d6", damageType: "Cortante", properties: ["Leve", "Arremesso (distância 6/18m)"] },
    { name: "Martelo Leve", damage: "1d4", damageType: "Concussão", properties: ["Leve", "Arremesso (distância 6/18m)"] },
    { name: "Besta Leve", damage: "1d8", damageType: "Perfurante", properties: ["Munição (distância 24/96m)", "Recarga", "Duas Mãos"] },
    { name: "Dardo", damage: "1d4", damageType: "Perfurante", properties: ["Acuidade", "Arremesso (distância 6/18m)"] },
    { name: "Arco Curto", damage: "1d6", damageType: "Perfurante", properties: ["Munição (distância 24/96m)", "Duas Mãos"] },
    { name: "Funda", damage: "1d4", damageType: "Concussão", properties: ["Munição (distância 9/36m)"] },
    { name: "Alabarda", damage: "1d10", damageType: "Cortante", properties: ["Pesada", "Alcance", "Duas Mãos"] },
    { name: "Cimitarra", damage: "1d6", damageType: "Cortante", properties: ["Acuidade", "Leve"] },
    { name: "Chicote", damage: "1d4", damageType: "Cortante", properties: ["Acuidade", "Alcance"] },
    { name: "Espada Curta", damage: "1d6", damageType: "Perfurante", properties: ["Acuidade", "Leve"] },
    { name: "Espada Longa", damage: "1d8", damageType: "Cortante", properties: ["Versátil (1d10)"] },
    { name: "Glaive", damage: "1d10", damageType: "Cortante", properties: ["Pesada", "Alcance", "Duas Mãos"] },
    { name: "Lança de Montaria", damage: "1d12", damageType: "Perfurante", properties: ["Alcance", "Especial"] },
    { name: "Machado de Batalha", damage: "1d8", damageType: "Cortante", properties: ["Versátil (1d10)"] },
    { name: "Machado Grande", damage: "1d12", damageType: "Cortante", properties: ["Pesada", "Duas Mãos"] },
    { name: "Malho", damage: "2d6", damageType: "Concussão", properties: ["Pesada", "Duas Mãos"] },
    { name: "Mangual", damage: "1d8", damageType: "Concussão", properties: [] },
    { name: "Martelo de Guerra", damage: "1d8", damageType: "Concussão", properties: ["Versátil (1d10)"] },
    { name: "Montante", damage: "2d6", damageType: "Cortante", properties: ["Pesada", "Duas Mãos"] },
    { name: "Picareta de Guerra", damage: "1d8", damageType: "Perfurante", properties: [] },
    { name: "Rapieira", damage: "1d8", damageType: "Perfurante", properties: ["Acuidade"] },
    { name: "Tridente", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 6/18m)", "Versátil (1d8)"] },
    { name: "Arco Longo", damage: "1d8", damageType: "Perfurante", properties: ["Munição (distância 45/180m)", "Pesada", "Duas Mãos"] },
    { name: "Besta de Mão", damage: "1d6", damageType: "Perfurante", properties: ["Munição (distância 9/36m)", "Leve", "Recarga"] },
    { name: "Besta Pesada", damage: "1d10", damageType: "Perfurante", properties: ["Munição (distância 30/120m)", "Pesada", "Recarga", "Duas Mãos"] },
    { name: "Zarabatana", damage: "1", damageType: "Perfurante", properties: ["Munição (distância 7,5/30m)", "Recarga"] },
];

// Nova lista de equipamentos padrão para popular o banco de dados
export const dndEquipments = [
    { name: "Mochila" },
    { name: "Ração de viagem" },
    { name: "Pé de cabra" },
    { name: "Martelo" },
    { name: "Píton" },
    { name: "Caixa de Fogo" },
    { name: "Cantil" },
    { name: "Tocha" },
    { name: "Capa de Respirar na Água" },
    { name: "Mochila de Carga" }
];

// Utilitário para converter strings de dano em dados estruturados
export function parseDamageString(damage: string) {
    // Regex para capturar [quantidade]d[faces] [+ bônus]
    const regex = /^(\d+)d(\d+)\s*(?:\+\s*(\d+))?$/i;
    const match = damage.trim().match(regex);

    if (match) {
        return {
            diceQty: parseInt(match[1]) || 1,
            diceType: `d${match[2]}`,
            diceBonus: parseInt(match[3]) || 0,
            isCustomDamage: false
        };
    }

    // Se não combinar com o padrão simples, retorna como customizado
    return {
        diceQty: 1,
        diceType: 'd8',
        diceBonus: 0,
        isCustomDamage: true
    };
}
