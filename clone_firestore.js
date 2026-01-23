// Script para clonar dados do Firestore de um projeto (Android) para outro (Web)
// Use Node.js + Firebase Admin SDK
// Instruções:
// 1. Baixe as credenciais (serviceAccountKey.json) dos dois projetos no console do Firebase.
// 2. Instale as dependências: npm install firebase-admin
// 3. Edite os caminhos das credenciais abaixo.
// 4. Execute: node clone_firestore.js

const admin = require('firebase-admin');
const fs = require('fs');

// Caminhos para as credenciais dos dois projetos
const sourceServiceAccount = require('./serviceAccountKey-android.json'); // Android
const targetServiceAccount = require('./serviceAccountKey-web.json'); // Web


// Inicializa o app de origem (Android)
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(sourceServiceAccount),
  databaseURL: 'https://WR0168EySccvAQXnvPoozEEpb1u2.firebaseio.com'
}, 'source');

// Inicializa o app de destino (Web)
const targetApp = admin.initializeApp({
  credential: admin.credential.cert(targetServiceAccount),
  databaseURL: 'https://<WEB_PROJECT_ID>.firebaseio.com'
}, 'target');

const sourceDb = sourceApp.firestore();
const targetDb = targetApp.firestore();

// Coleções que deseja clonar
const collectionsToClone = [
  'itens',
  'monstros',
  'magias',
  'npcs',
  'racas',
  'classes',
  // Adicione outras coleções se necessário
];

async function cloneCollection(collectionName) {
  const snapshot = await sourceDb.collection(collectionName).get();
  const batch = targetDb.batch();
  let count = 0;
  snapshot.forEach(doc => {
    const targetDoc = targetDb.collection(collectionName).doc(doc.id);
    batch.set(targetDoc, doc.data());
    count++;
  });
  await batch.commit();
  console.log(`Clonado ${count} documentos da coleção ${collectionName}`);
}

async function main() {
  for (const col of collectionsToClone) {
    await cloneCollection(col);
  }
  console.log('Clonagem concluída!');
  process.exit(0);
}

main().catch(err => {
  console.error('Erro ao clonar:', err);
  process.exit(1);
});
