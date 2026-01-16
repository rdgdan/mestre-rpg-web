/**
 * Script para consolidar monstros
 * Move todos de 'monstros' para 'monsters' e remove duplicatas
 * 
 * Uso: npx tsx scripts/consolidate-monsters.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function consolidateMonsters() {
    console.log('🔄 Iniciando consolidação de monstros...\n');

    try {
        // 1. Carregar todos os monstros existentes em 'monsters'
        const monstersSnapshot = await getDocs(collection(db, 'monsters'));
        const existingNames = new Set<string>();
        
        monstersSnapshot.forEach(doc => {
            const name = (doc.data().name || '').toLowerCase().trim();
            if (name) {
                existingNames.add(name);
            }
        });

        console.log(`✅ Encontrados ${existingNames.size} monstros em 'monsters'`);

        // 2. Carregar monstros da coleção antiga 'monstros'
        const oldMonstersSnapshot = await getDocs(collection(db, 'monstros'));
        let movedCount = 0;
        let skippedCount = 0;

        for (const oldDoc of oldMonstersSnapshot.docs) {
            const data = oldDoc.data();
            const name = (data.name || '').toLowerCase().trim();

            // Verificar duplicata
            if (existingNames.has(name)) {
                console.log(`⏭️  Pulando duplicata: ${data.name}`);
                skippedCount++;
                continue;
            }

            // Mover para nova coleção
            try {
                await addDoc(collection(db, 'monsters'), data);
                existingNames.add(name);
                movedCount++;
                console.log(`✅ Movido: ${data.name}`);
            } catch (error) {
                console.error(`❌ Erro ao mover ${data.name}:`, error);
            }
        }

        console.log(`\n📊 Resultado:`);
        console.log(`   ✅ Movidos: ${movedCount}`);
        console.log(`   ⏭️  Pulados (duplicatas): ${skippedCount}`);

        // 3. Deletar coleção antiga (comentado por segurança)
        console.log(`\n⚠️  Para DELETAR a coleção 'monstros', execute:`);
        console.log(`   npx tsx scripts/delete-collection.ts monstros\n`);

    } catch (error) {
        console.error('❌ Erro na consolidação:', error);
    }

    process.exit(0);
}

consolidateMonsters();
