// Sistema de progressão de XP para D&D 5e
import { db } from './firebase';
import { logger } from '@/lib/logger';
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';

// Tabela oficial de XP por nível do D&D 5e
export const XP_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000
};

/**
 * Calcula o nível baseado no XP total
 */
export function getLevelFromXP(xp: number): number {
    for (let level = 20; level >= 1; level--) {
        if (xp >= XP_THRESHOLDS[level]) {
            return level;
        }
    }
    return 1;
}

/**
 * Verifica se o personagem deve subir de nível
 */
export function shouldLevelUp(currentLevel: number, xp: number): boolean {
    if (currentLevel >= 20) return false;
    const nextLevelXP = XP_THRESHOLDS[currentLevel + 1];
    return xp >= nextLevelXP;
}

/**
 * Retorna o XP necessário para o próximo nível
 */
export function getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= 20) return XP_THRESHOLDS[20];
    return XP_THRESHOLDS[currentLevel + 1];
}

/**
 * Retorna o XP necessário para o nível atual
 */
export function getXPForCurrentLevel(currentLevel: number): number {
    return XP_THRESHOLDS[currentLevel] || 0;
}

/**
 * Calcula o progresso percentual até o próximo nível
 */
export function getXPProgress(currentLevel: number, xp: number): number {
    if (currentLevel >= 20) return 100;

    const currentLevelXP = getXPForCurrentLevel(currentLevel);
    const nextLevelXP = getXPForNextLevel(currentLevel);
    const xpInCurrentLevel = xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;

    return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
}

/**
 * Valida se o XP está de acordo com o nível
 */
export function validateXPForLevel(level: number, xp: number): {
    isValid: boolean;
    suggestedLevel?: number;
    message?: string;
} {
    const calculatedLevel = getLevelFromXP(xp);

    if (calculatedLevel === level) {
        return { isValid: true };
    }

    return {
        isValid: false,
        suggestedLevel: calculatedLevel,
        message: `XP (${xp}) corresponde ao nível ${calculatedLevel}, mas o personagem está no nível ${level}`
    };
}

/**
 * UTILITÁRIO: Remove duplicatas de uma coleção do Firestore
 * Mantém apenas a primeira ocorrência de cada nome (normalizado)
 */
export async function removeDuplicatesFromFirestore(collectionName: string): Promise<{
    total: number;
    duplicates: number;
    removed: string[];
}> {
    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        const seen = new Map<string, string>(); // normalizedName -> docId
        const toDelete: string[] = [];

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const normalizedName = data.name?.toLowerCase().trim();

            if (!normalizedName) {
                logger.warn(`Documento sem nome em ${collectionName}:`, docSnap.id);
                return;
            }

            if (seen.has(normalizedName)) {
                // Duplicata encontrada!
                toDelete.push(docSnap.id);
            } else {
                // Primeira ocorrência
                seen.set(normalizedName, docSnap.id);
            }
        });

        // Deletar duplicatas
        if (toDelete.length > 0) {
            const batch = writeBatch(db);
            toDelete.forEach(docId => {
                batch.delete(doc(collectionRef, docId));
            });
            await batch.commit();
        }

        return {
            total: snapshot.docs.length,
            duplicates: toDelete.length,
            removed: toDelete
        };
    } catch (error) {
        throw error;
    }
}

/**
 * UTILITÁRIO: Limpa todas as coleções de dados do jogo
 */
export async function cleanAllGameData(): Promise<void> {
    const collections = ['itens', 'classes', 'races', 'magias'];

    for (const collectionName of collections) {
        await removeDuplicatesFromFirestore(collectionName);
    }
}
