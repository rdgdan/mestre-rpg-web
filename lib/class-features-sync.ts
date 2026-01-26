import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { firestoreCache } from './cache-service';
import {
    CLASS_PROGRESSION,
    ClassFeature,
    DND_FEATS,
    LevelProgression,
    RACE_FEATURES
} from './class-features';
import { db } from './firebase';
import { syncSRDToFirestore } from './srd-sync';

/**
 * Sincroniza TODAS as regras (Classes, Raças, Talentos) para o Firestore
 */
export async function syncAllGameRulesToFirestore(): Promise<void> {
    try {
        // Sincronizar Capítulos do SRD primeiro
        await syncSRDToFirestore();

        const batch = writeBatch(db);
        let batchCount = 0;

        // 1. Sincronizar Classes
        Object.entries(CLASS_PROGRESSION).forEach(([className, levels]) => {
            Object.entries(levels).forEach(([level, progression]) => {
                const docRef = doc(db, 'game_rules', 'class_features', className, level);
                batch.set(docRef, progression, { merge: true });
                batchCount++;
            });
        });

        // 2. Sincronizar Raças
        Object.entries(RACE_FEATURES).forEach(([raceName, features]) => {
            const docRef = doc(db, 'game_rules', 'race_features', 'races', raceName);
            batch.set(docRef, { features }, { merge: true });
            batchCount++;
        });

        // 3. Sincronizar Talentos (Feats)
        DND_FEATS.forEach((feat) => {
            const docRef = doc(db, 'game_rules', 'feats', 'list', feat.name);
            batch.set(docRef, feat, { merge: true });
            batchCount++;
        });

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Regras de Jogo: ${batchCount} itens sincronizados`);
        }
    } catch (error) {
        console.error('❌ Erro ao sincronizar regras de jogo:', error);
        throw error;
    }
}

/**
 * Legado: mantendo a função original para compatibilidade
 */
export async function syncClassFeaturesToFirestore(): Promise<void> {
    return syncAllGameRulesToFirestore();
}

/**
 * Busca as características de uma classe específica do Firestore
 * Se não existirem, sincroniza automaticamente
 */
export async function fetchClassFeaturesFromFirestore(className: string): Promise<Record<number, LevelProgression>> {
    try {
        const cacheKey = `class_features_${className}`;
        const cached = firestoreCache.get(cacheKey);
        if (cached) return cached as any;

        const classRef = collection(db, 'game_rules', 'class_features', className);
        const snapshot = await getDocs(classRef);

        // Se vazio, sincroniza primeiro
        if (snapshot.empty) {
            console.log(`📚 Características de ${className} não encontradas, sincronizando...`);
            await syncClassFeaturesToFirestore();
            const newSnapshot = await getDocs(classRef);

            const features: Record<number, LevelProgression> = {};
            newSnapshot.docs.forEach(doc => {
                const level = parseInt(doc.id);
                features[level] = doc.data() as LevelProgression;
            });
            firestoreCache.set(cacheKey, features);
            return features;
        }

        const features: Record<number, LevelProgression> = {};
        snapshot.docs.forEach(doc => {
            const level = parseInt(doc.id);
            features[level] = doc.data() as LevelProgression;
        });

        firestoreCache.set(cacheKey, features);
        return features;
    } catch (error) {
        console.error(`❌ Erro ao buscar características de ${className}, usando dados locais:`, error);
        // Fallback para dados locais
        return CLASS_PROGRESSION[className] || {};
    }
}

/**
 * Busca todas as características de classe do Firestore
 */
export async function fetchAllClassFeaturesFromFirestore(): Promise<Record<string, Record<number, LevelProgression>>> {
    try {
        const allFeatures: Record<string, Record<number, LevelProgression>> = {};

        // Buscar todas as classes do código como referência
        const classNames = Object.keys(CLASS_PROGRESSION);

        for (const className of classNames) {
            allFeatures[className] = await fetchClassFeaturesFromFirestore(className);
        }

        return allFeatures;
    } catch (error) {
        console.error('❌ Erro ao buscar todas as características, usando dados locais:', error);
        return CLASS_PROGRESSION;
    }
}

/**
 * Busca as características de uma raça específica
 */
export async function fetchRaceFeaturesFromFirestore(raceName: string): Promise<ClassFeature[]> {
    try {
        const cacheKey = `race_features_${raceName}`;
        const cached = firestoreCache.get(cacheKey);
        if (cached) return cached as any;

        const docRef = doc(db, 'game_rules', 'race_features', 'races', raceName);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            const features = snapshot.data().features as ClassFeature[];
            firestoreCache.set(cacheKey, features);
            return features;
        }

        // Se não existir no Firestore, tenta sincronizar e buscar novamente
        console.log(`🌲 Características de raça ${raceName} não encontradas, sincronizando...`);
        await syncAllGameRulesToFirestore();

        const newSnapshot = await getDoc(docRef);
        if (newSnapshot.exists()) {
            const features = newSnapshot.data().features as ClassFeature[];
            firestoreCache.set(cacheKey, features);
            return features;
        }

        // Fallback local se falhar o sync ou continuar não existindo
        return RACE_FEATURES[raceName] || [];
    } catch (error) {
        console.error(`❌ Erro ao buscar características de raça ${raceName}:`, error);
        return RACE_FEATURES[raceName] || [];
    }
}

/**
 * Busca todos os talentos (feats)
 */
export async function fetchAllFeatsFromFirestore(): Promise<ClassFeature[]> {
    try {
        const cached = firestoreCache.get('feats_list');
        if (cached) return cached;

        const featsRef = collection(db, 'game_rules', 'feats', 'list');
        const snapshot = await getDocs(featsRef);

        if (snapshot.empty) {
            return DND_FEATS;
        }

        const feats = snapshot.docs.map(doc => doc.data() as ClassFeature);
        firestoreCache.set('feats_list', feats);
        return feats;
    } catch (error) {
        console.error('❌ Erro ao buscar talentos:', error);
        return DND_FEATS;
    }
}

/**
 * Salva uma subclasse gerada por I.A. no repositório global
 */
export async function saveGeneratedSubclassToFirestore(className: string, subclassName: string, data: Record<number, LevelProgression>): Promise<void> {
    try {
        const docRef = doc(db, 'game_rules', 'subclasses', className, subclassName);
        await setDoc(docRef, {
            name: subclassName,
            className,
            features: data,
            isAIGenerated: true,
            createdAt: new Date().toISOString()
        }, { merge: true });
        console.log(`✅ Subclasse ${subclassName} salva no repositório global.`);
    } catch (error) {
        console.error(`❌ Erro ao salvar subclasse ${subclassName}:`, error);
    }
}

/**
 * Busca subclasses da comunidade/geradas por I.A. para uma classe
 */
export async function fetchCommunitySubclasses(className: string): Promise<Record<string, any>> {
    try {
        const subRef = collection(db, 'game_rules', 'subclasses', className);
        const snapshot = await getDocs(subRef);
        const subclasses: Record<string, any> = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            subclasses[doc.id] = data.features;
        });
        return subclasses;
    } catch (error) {
        console.error(`❌ Erro ao buscar subclasses da comunidade para ${className}:`, error);
        return {};
    }
}
