const admin = require('firebase-admin');

// 1. Configure aqui o caminho para sua chave de serviço
const serviceAccount = require('../chave_privada.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function normalizeCharacters() {
  console.log('🚀 Iniciando varredura de personagens...');
  const charRef = db.collection('personagens');
  const snapshot = await charRef.get();

  if (snapshot.empty) {
    console.log('Nenhum personagem encontrado.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    let changed = false;
    const updates = {};

    // 1. Normalizar Classe Principal (PT-BR)
    const classMap = {
      'ranger': 'Patrulheiro',
      'fighter': 'Guerreiro',
      'wizard': 'Mago',
      'cleric': 'Clérigo',
      'bard': 'Bardo',
      'rogue': 'Ladino',
      'barbarian': 'Bárbaro',
      'druid': 'Druida',
      'sorcerer': 'Feiticeiro',
      'warlock': 'Bruxo',
      'paladin': 'Paladino',
      'artificer': 'Artífice',
      'guardiao': 'Guardião'
    };

    if (data.class && classMap[data.class.toLowerCase()]) {
      updates.class = classMap[data.class.toLowerCase()];
      changed = true;
    }

    // 2. Normalizar Classes no Array de Multiclasse
    if (Array.isArray(data.classes)) {
      const newClasses = data.classes.map(c => {
        if (c.name && classMap[c.name.toLowerCase()]) {
          changed = true;
          return { ...c, name: classMap[c.name.toLowerCase()] };
        }
        return c;
      });
      if (changed) updates.classes = newClasses;
    }

    // 3. Garantir que Atributos sejam números
    if (data.attributes) {
      const newAttrs = {};
      Object.keys(data.attributes).forEach(key => {
        const val = parseInt(data.attributes[key]);
        if (data.attributes[key] !== val) {
          newAttrs[key] = val;
          changed = true;
        } else {
          newAttrs[key] = val;
        }
      });
      if (changed) updates.attributes = newAttrs;
    }

    if (changed) {
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Sucesso! ${count} personagens foram normalizados.`);
  } else {
    console.log('✨ Tudo limpo! Nenhuma inconsistência encontrada.');
  }
}

normalizeCharacters().catch(console.error);
