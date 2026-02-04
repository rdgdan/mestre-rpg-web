// lib/items-data.ts
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    weight?: number;
    // Novos campos para sincronia com Biblioteca
    isCustomDamage?: boolean;
    isProficient?: boolean;
    sourceClass?: string;
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
    weight?: number;
    sourceClass?: string;
}

export interface Inventory {
    weapons: Weapon[];
    currency: Currency;
    // O campo otherEquipment foi atualizado de string para um array de objetos
    otherEquipment: OtherEquipmentItem[];
}

// --- LISTAS DE DADOS PADRÃO ---

// Lista de armas padrão do D&D 5e
// Lista de armas padrão do D&D 5e (Pesos aproximados: 1 lb = 0.5 kg)
export const dndWeapons = [
    { name: "Adaga", damage: "1d4", damageType: "Perfurante", properties: ["Acuidade", "Leve", "Arremesso (distância 6/18m)"], weight: 0.5 },
    { name: "Azagaia", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 9/36m)"], weight: 1.0 },
    { name: "Bordão", damage: "1d6", damageType: "Concussão", properties: ["Versátil (1d8)"], weight: 2.0 },
    { name: "Clava Grande", damage: "1d8", damageType: "Concussão", properties: ["Duas Mãos"], weight: 5.0 },
    { name: "Foice Curta", damage: "1d4", damageType: "Cortante", properties: ["Leve"], weight: 1.0 },
    { name: "Lança Curta", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 6/18m)", "Versátil (1d8)"], weight: 1.5 },
    { name: "Maça", damage: "1d6", damageType: "Concussão", properties: [], weight: 2.0 },
    { name: "Machadinha", damage: "1d6", damageType: "Cortante", properties: ["Leve", "Arremesso (distância 6/18m)"], weight: 1.0 },
    { name: "Martelo Leve", damage: "1d4", damageType: "Concussão", properties: ["Leve", "Arremesso (distância 6/18m)"], weight: 1.0 },
    { name: "Besta Leve", damage: "1d8", damageType: "Perfurante", properties: ["Munição (distância 24/96m)", "Recarga", "Duas Mãos"], weight: 2.5 },
    { name: "Dardo", damage: "1d4", damageType: "Perfurante", properties: ["Acuidade", "Arremesso (distância 6/18m)"], weight: 0.1 },
    { name: "Arco Curto", damage: "1d6", damageType: "Perfurante", properties: ["Munição (distância 24/96m)", "Duas Mãos"], weight: 1.0 },
    { name: "Funda", damage: "1d4", damageType: "Concussão", properties: ["Munição (distância 9/36m)"], weight: 0 },
    { name: "Alabarda", damage: "1d10", damageType: "Cortante", properties: ["Pesada", "Alcance", "Duas Mãos"], weight: 3.0 },
    { name: "Cimitarra", damage: "1d6", damageType: "Cortante", properties: ["Acuidade", "Leve"], weight: 1.5 },
    { name: "Chicote", damage: "1d4", damageType: "Cortante", properties: ["Acuidade", "Alcance"], weight: 1.5 },
    { name: "Espada Curta", damage: "1d6", damageType: "Perfurante", properties: ["Acuidade", "Leve"], weight: 1.0 },
    { name: "Espada Longa", damage: "1d8", damageType: "Cortante", properties: ["Versátil (1d10)"], weight: 1.5 },
    { name: "Glaive", damage: "1d10", damageType: "Cortante", properties: ["Pesada", "Alcance", "Duas Mãos"], weight: 3.0 },
    { name: "Lança de Montaria", damage: "1d12", damageType: "Perfurante", properties: ["Alcance", "Especial"], weight: 3.0 },
    { name: "Machado de Batalha", damage: "1d8", damageType: "Cortante", properties: ["Versátil (1d10)"], weight: 2.0 },
    { name: "Machado Grande", damage: "1d12", damageType: "Cortante", properties: ["Pesada", "Duas Mãos"], weight: 3.5 },
    { name: "Malho", damage: "2d6", damageType: "Concussão", properties: ["Pesada", "Duas Mãos"], weight: 5.0 },
    { name: "Mangual", damage: "1d8", damageType: "Concussão", properties: [], weight: 1.0 },
    { name: "Martelo de Guerra", damage: "1d8", damageType: "Concussão", properties: ["Versátil (1d10)"], weight: 1.0 },
    { name: "Montante", damage: "2d6", damageType: "Cortante", properties: ["Pesada", "Duas Mãos"], weight: 3.0 },
    { name: "Picareta de Guerra", damage: "1d8", damageType: "Perfurante", properties: [], weight: 1.0 },
    { name: "Rapieira", damage: "1d8", damageType: "Perfurante", properties: ["Acuidade"], weight: 1.0 },
    { name: "Tridente", damage: "1d6", damageType: "Perfurante", properties: ["Arremesso (distância 6/18m)", "Versátil (1d8)"], weight: 2.0 },
    { name: "Arco Longo", damage: "1d8", damageType: "Perfurante", properties: ["Munição (distância 45/180m)", "Pesada", "Duas Mãos"], weight: 1.0 },
    { name: "Besta de Mão", damage: "1d6", damageType: "Perfurante", properties: ["Munição (distância 9/36m)", "Leve", "Recarga"], weight: 1.5 },
    { name: "Besta Pesada", damage: "1d10", damageType: "Perfurante", properties: ["Munição (distância 30/120m)", "Pesada", "Recarga", "Duas Mãos"], weight: 4.0 },
    { name: "Zarabatana", damage: "1", damageType: "Perfurante", properties: ["Munição (distância 7,5/30m)", "Recarga"], weight: 0.5 },
];

// Nova lista de equipamentos padrão para popular o banco de dados
export const dndEquipments = [
    { name: "Mochila", weight: 2.5 },
    { name: "Ração de viagem (1 dia)", weight: 1.0 },
    { name: "Pé de cabra", weight: 2.5 },
    { name: "Martelo", weight: 1.5 },
    { name: "Píton", weight: 0.1 },
    { name: "Caixa de Fogo", weight: 0.5 },
    { name: "Cantil (cheio)", weight: 2.5 },
    { name: "Tocha", weight: 0.5 },
    { name: "Corda (15m)", weight: 5.0 },
    { name: "Saco de Dormir", weight: 2.5 }
];

// Utilitário para converter strings de dano em dados estruturados
export function parseDamageString(damage: string) {
    // Regex para capturar [quantidade]d[faces] [+ bônus] - mais flexível com texto depois
    const regex = /^(\d+)d(\d+)\s*(?:\+\s*(\d+))?.*$/i;
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

import { firestoreCache } from './cache-service';

// Buscar itens globais do Firestore
export async function fetchGlobalItems() {
    try {
        const cached = firestoreCache.get('itens');
        if (cached) return cached;

        const itemsRef = collection(db, 'itens');
        const querySnapshot = await getDocs(itemsRef);
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
                id: doc.id,
                ...data,
                name: data.name || doc.id
            });
        });

        firestoreCache.set('itens', items);
        return items;
    } catch (error) {
        console.error('Erro ao carregar itens globais:', error);
        return [];
    }
}
