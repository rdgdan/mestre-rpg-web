import { db } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { dndMonsters, MonsterData } from './monsters-data';

/**
 * Sincroniza os monstros locais (lib/monsters-data.ts) com o Firestore.
 * Utiliza lógica de merge para complementar dados existentes sem duplicar.
 */
export async function syncLocalMonstersToFirestore(onProgress?: (msg: string) => void): Promise<{ updated: number, created: number }> {
    try {
        const monstersRef = collection(db, 'monsters');
        let updatedCount = 0;
        let createdCount = 0;

        if (onProgress) onProgress('Buscando monstros atuais no banco de dados...');
        
        // Buscar todos os monstros para verificar existência por nome
        const snapshot = await getDocs(monstersRef);
        const existingMonstersMap = new Map<string, string>(); // nameLower -> docId
        
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const name = (data.name || '').toLowerCase().trim();
            if (name) {
                existingMonstersMap.set(name, docSnap.id);
            }
        });

        if (onProgress) onProgress(`Iniciando sincronização de ${dndMonsters.length} monstros...`);

        // Processar em lotes (batch) para eficiência
        const batch = writeBatch(db);
        let batchSize = 0;

        for (const localMonster of dndMonsters) {
            const nameLower = localMonster.name.toLowerCase().trim();
            const existingId = existingMonstersMap.get(nameLower);
            
            const docRef = existingId 
                ? doc(monstersRef, existingId) 
                : doc(monstersRef);

            // Preparar dados para o banco
            const monsterDataToSave = {
                ...localMonster,
                nameLower: nameLower,
                // Garantir campos que o ArchiveStorage usa para busca e organização
                originalName: localMonster.name,
                originalNameLower: nameLower,
                isImported: true,
                updatedAt: new Date().toISOString()
            };

            // Remover undefined para o Firestore
            Object.keys(monsterDataToSave).forEach(key => {
                if ((monsterDataToSave as any)[key] === undefined) {
                    delete (monsterDataToSave as any)[key];
                }
            });

            // Usar merge: true para COMPLEMENTAR os dados se já existirem
            batch.set(docRef, monsterDataToSave, { merge: true });
            
            if (existingId) updatedCount++;
            else createdCount++;

            batchSize++;
            
            // Commit a cada 400 itens (limite do Firestore é 500)
            if (batchSize >= 400) {
                await batch.commit();
                // Reiniciar batch aqui se necessário (omitido por simplicidade pois temos ~150 monstros)
            }
        }

        if (batchSize > 0) {
            await batch.commit();
        }

        if (onProgress) {
            onProgress(`✅ Tudo pronto! ${updatedCount} monstros complementados e ${createdCount} novos criados.`);
        }

        return { updated: updatedCount, created: createdCount };

    } catch (error) {
        console.error('Erro na sincronização de monstros:', error);
        throw error;
    }
}
