// Utilitário para sincronizar regras SRD com Firestore
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { srdBook, Chapter } from './srd-book-data';

/**
 * Sincroniza os capítulos do SRD para o Firestore
 * Mescla dados do código com dados existentes no banco
 */
export async function syncSRDToFirestore(): Promise<void> {
    try {
        const chaptersRef = collection(db, 'game_rules', 'srd', 'chapters');
        const snapshot = await getDocs(chaptersRef);

        // Criar mapa com capítulos existentes
        const existingMap = new Map<string, any>();
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.id) {
                existingMap.set(data.id, { ...data, _docId: docSnap.id });
            }
        });

        // Mesclar com dados do código (código tem prioridade)
        const batch = writeBatch(db);
        let batchCount = 0;

        srdBook.chapters.forEach(chapter => {
            const existing = existingMap.get(chapter.id);
            const docRef = existing?._docId
                ? doc(chaptersRef, existing._docId)
                : doc(chaptersRef, chapter.id);

            batch.set(docRef, chapter, { merge: true });
            batchCount++;
        });

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ SRD: ${batchCount} capítulos sincronizados com Firestore`);
        }
    } catch (error) {
        console.error('❌ Erro ao sincronizar SRD:', error);
        throw error;
    }
}

/**
 * Busca os capítulos do SRD do Firestore
 * Se não existirem, sincroniza automaticamente
 */
export async function fetchSRDFromFirestore(): Promise<Chapter[]> {
    try {
        const chaptersRef = collection(db, 'game_rules', 'srd', 'chapters');
        const snapshot = await getDocs(chaptersRef);

        // Se vazio, sincroniza primeiro
        if (snapshot.empty) {
            console.log('📚 SRD não encontrado no Firestore, sincronizando...');
            await syncSRDToFirestore();
            const newSnapshot = await getDocs(chaptersRef);
            return newSnapshot.docs.map(doc => doc.data() as Chapter);
        }

        return snapshot.docs.map(doc => doc.data() as Chapter);
    } catch (error) {
        console.error('❌ Erro ao buscar SRD do Firestore, usando dados locais:', error);
        // Fallback para dados locais em caso de erro
        return srdBook.chapters;
    }
}

/**
 * Busca o livro SRD completo do Firestore
 */
export async function fetchSRDBookFromFirestore() {
    const chapters = await fetchSRDFromFirestore();
    return {
        id: srdBook.id,
        title: srdBook.title,
        description: srdBook.description,
        chapters
    };
}
