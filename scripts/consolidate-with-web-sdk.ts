import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  doc,
  writeBatch,
  query
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function consolidateMonsters() {
  console.log('🔄 Iniciando consolidação de monstros...\n');

  try {
    // Get all monsters from 'monsters' collection
    const monstersSnapshot = await getDocs(collection(db, 'monsters'));
    const existingNames = new Set<string>();
    const monstersMap = new Map<string, any>();

    console.log(`📦 Coleção "monsters": ${monstersSnapshot.size} documentos`);

    // Build set of existing monster names (normalized)
    monstersSnapshot.forEach(doc => {
      const name = (doc.data().name || '').toLowerCase().trim();
      if (name) {
        existingNames.add(name);
        monstersMap.set(name, doc.id);
      }
    });

    // Get all monsters from 'monstros' collection
    const oldMonstersSnapshot = await getDocs(collection(db, 'monstros'));
    console.log(`📦 Coleção "monstros": ${oldMonstersSnapshot.size} documentos\n`);

    let movedCount = 0;
    let skippedCount = 0;
    const skippedMonsters: string[] = [];
    const toDelete: string[] = [];

    // Process old monsters collection
    for (const oldDoc of oldMonstersSnapshot.docs) {
      const monsterData = oldDoc.data();
      const name = (monsterData.name || '').toLowerCase().trim();

      if (existingNames.has(name)) {
        console.log(`⏭️  Pulando duplicata: ${monsterData.name || 'SEM NOME'}`);
        skippedCount++;
        skippedMonsters.push(monsterData.name || `Doc ID: ${oldDoc.id}`);
        toDelete.push(oldDoc.id);
        continue;
      }

      try {
        // Add to monsters collection
        const newDoc = await addDoc(collection(db, 'monsters'), monsterData);
        console.log(`✅ Movido: ${monsterData.name || 'SEM NOME'} (ID: ${newDoc.id})`);
        movedCount++;
        existingNames.add(name); // Add to set to prevent duplicates in current batch
        toDelete.push(oldDoc.id); // Mark old doc for deletion
      } catch (error) {
        console.error(`❌ Erro ao mover ${monsterData.name || 'SEM NOME'}:`, error);
      }
    }

    // Delete all documents from 'monstros' in batch
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deletando ${toDelete.length} documentos de 'monstros'...`);
      const batch = writeBatch(db);
      
      for (const docId of toDelete) {
        batch.delete(doc(db, 'monstros', docId));
      }
      
      await batch.commit();
      console.log('✅ Documentos deletados!');
    }

    console.log('\n📊 RESUMO DA CONSOLIDAÇÃO:');
    console.log(`✅ Monstros movidos: ${movedCount}`);
    console.log(`⏭️  Duplicatas puladas: ${skippedCount}`);
    console.log(`🗑️  Documentos deletados: ${toDelete.length}`);
    console.log(`📁 Total na coleção "monsters": ${monstersSnapshot.size + movedCount}`);

    if (skippedMonsters.length > 0 && skippedMonsters.length <= 15) {
      console.log('\n📋 Monstros duplicados encontrados:');
      skippedMonsters.forEach(m => console.log(`  - ${m}`));
    }

    console.log('\n✨ Consolidação concluída com sucesso!');
    console.log('Agora você pode verificar se a coleção "monstros" está vazia no Firestore.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na consolidação:', error);
    process.exit(1);
  }
}

consolidateMonsters();
