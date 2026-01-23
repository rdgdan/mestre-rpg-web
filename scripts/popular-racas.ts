import * as dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore } from "firebase/firestore";
import path from "path";
import { RACES } from "../lib/races-data";

// Carrega variáveis do .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

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

const execute = process.argv.includes("--execute");

async function seedRaces() {
    console.log("🧝 POPULANDO RAÇAS NO FIRESTORE");
    console.log("============================================================");

    try {
        const racasRef = collection(db, "racas");
        const snapshot = await getDocs(racasRef);
        const existingNames = new Set(snapshot.docs.map(doc => doc.data().name.toLowerCase()));

        console.log(`📊 Raças já no banco: ${existingNames.size}`);
        console.log(`📚 Raças no código: ${RACES.length}`);

        const toAdd = RACES.filter(r => !existingNames.has(r.name.toLowerCase()));

        console.log(`✨ Novas raças a adicionar: ${toAdd.length}`);

        if (toAdd.length === 0) {
            console.log("✅ Tudo sincronizado!");
            return;
        }

        if (!execute) {
            console.log("\n📋 RAÇAS QUE SERIAM ADICIONADAS:");
            toAdd.forEach(r => console.log(`   ➕ ${r.name}`));

            console.log("\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!");
            console.log("   Execute com --execute para popular o banco.");
            return;
        }

        console.log("\n🚀 Executando ritual de invocação...");

        for (const race of toAdd) {
            await addDoc(racasRef, {
                ...race,
                createdAt: new Date().toISOString(),
                source: 'system-default'
            });
            console.log(`   ✅ ${race.name} adicionada.`);
        }

        console.log("\n✅ Sucesso! As Raças foram registradas nos anais do tempo.");
    } catch (error) {
        console.error("\n❌ Erro durante a invocação:", error);
    }
}

seedRaces();
