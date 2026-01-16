import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Get service account from environment or try to load from file
let serviceAccount: any;

try {
  // Try to load from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Try to find service account key in common locations
    const possiblePaths = [
      'serviceAccountKey.json',
      '../serviceAccountKey.json',
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.firebase/mestre-rpg-web-key.json'),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        console.log(`Found service account key at: ${filePath}`);
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        break;
      }
    }
  }

  if (!serviceAccount) {
    console.error('❌ Service account key not found!');
    console.error('Options:');
    console.error('1. Set FIREBASE_SERVICE_ACCOUNT environment variable');
    console.error('2. Place serviceAccountKey.json in the project root');
    console.error('3. Check firebase.json for embedded service account');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error loading service account:', error);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'mestre-rpg-web',
});

const db = admin.firestore();

async function consolidateMonsters() {
  console.log('🔄 Iniciando consolidação de monstros...\n');

  try {
    // Get all monsters from 'monsters' collection
    const monstersSnapshot = await db.collection('monsters').get();
    const existingNames = new Set<string>();

    console.log(`📦 Coleção "monsters": ${monstersSnapshot.size} documentos`);

    // Build set of existing monster names (normalized)
    monstersSnapshot.forEach(doc => {
      const name = (doc.data().name || '').toLowerCase().trim();
      if (name) {
        existingNames.add(name);
      }
    });

    // Get all monsters from 'monstros' collection
    const oldMonstersSnapshot = await db.collection('monstros').get();
    console.log(`📦 Coleção "monstros": ${oldMonstersSnapshot.size} documentos\n`);

    let movedCount = 0;
    let skippedCount = 0;
    const skippedMonsters: string[] = [];

    // Process old monsters collection
    for (const oldDoc of oldMonstersSnapshot.docs) {
      const monsterData = oldDoc.data();
      const name = (monsterData.name || '').toLowerCase().trim();

      if (existingNames.has(name)) {
        console.log(`⏭️  Pulando duplicata: ${monsterData.name || 'SEM NOME'}`);
        skippedCount++;
        skippedMonsters.push(monsterData.name || `Doc ID: ${oldDoc.id}`);
        continue;
      }

      try {
        // Add to monsters collection
        const newDocRef = await db.collection('monsters').add(monsterData);
        console.log(`✅ Movido: ${monsterData.name || 'SEM NOME'} (ID: ${newDocRef.id})`);
        movedCount++;
        existingNames.add(name);

        // Delete from old collection
        await db.collection('monstros').doc(oldDoc.id).delete();
      } catch (error) {
        console.error(`❌ Erro ao processar ${monsterData.name || 'SEM NOME'}:`, error);
      }
    }

    console.log('\n📊 RESUMO DA CONSOLIDAÇÃO:');
    console.log(`✅ Monstros movidos: ${movedCount}`);
    console.log(`⏭️  Duplicatas puladas: ${skippedCount}`);
    console.log(`📁 Total na coleção "monsters": ${monstersSnapshot.size + movedCount}`);

    if (skippedMonsters.length > 0 && skippedMonsters.length <= 20) {
      console.log('\n📋 Monstros duplicados encontrados:');
      skippedMonsters.forEach(m => console.log(`  - ${m}`));
    }

    // Check if old collection is empty
    const finalOldSnapshot = await db.collection('monstros').limit(1).get();
    if (finalOldSnapshot.empty) {
      console.log('\n✅ Coleção "monstros" agora está vazia!');
      console.log('💡 Você ainda pode deletar a coleção no Firestore Console se desejar.');
    }

    console.log('\n✨ Consolidação concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na consolidação:', error);
    process.exit(1);
  }
}

consolidateMonsters();
