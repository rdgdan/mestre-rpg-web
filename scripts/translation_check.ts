// scripts/translation_check.ts
// import 'undici/shim';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

const collections = [
    'magias', 'spells', 'custom_spells',
    'items',
    'monsters',
    'races', 'classes', 'backgrounds',
    'books'
];

function hasFullTranslation(doc: any): boolean {
    if (doc.translated === true) return true;
    const languages = ['en', 'pt', 'es'];
    return languages.every((lang) => !!doc[lang]);
}

async function main() {
    console.log('\n🔍 VERIFICAÇÃO DE TRADUÇÕES (v2 - TSX)');
    console.log('='.repeat(60));

    const missing: any[] = [];

    for (const colName of collections) {
        try {
            console.log(`\n📂 Verificando: ${colName}...`);
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);
            console.log(`   > ${snapshot.size} documentos.`);

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                if (!hasFullTranslation(data)) {
                    missing.push({ collection: colName, id: docSnap.id });
                }
            }
        } catch (err: any) {
            console.error(`ERROR em ${colName}:`, err.message);
        }
    }

    fs.writeFileSync('scripts/translation_report.json', JSON.stringify(missing, null, 2));
    console.log(`\n📄 Relatório salvo em scripts/translation_report.json (Total pendente: ${missing.length})`);
}

main().catch(console.error);
