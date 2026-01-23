import * as dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore } from "firebase/firestore";
import path from "path";
import { dndMonsters } from "../lib/monsters-data";

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

async function seedMonsters() {
    console.log("🐉 POPULANDO MONSTROS NO FIRESTORE");
    console.log("============================================================");

    try {
        const monstrosRef = collection(db, "monstros");
        const snapshot = await getDocs(monstrosRef);
        const existingNames = new Set(snapshot.docs.map(doc => doc.data().name.toLowerCase()));

        console.log(`📊 Monstros já no banco: ${existingNames.size}`);
        console.log(`📚 Monstros no código: ${dndMonsters.length}`);

        const toAdd = dndMonsters.filter(m => !existingNames.has(m.name.toLowerCase()));

        console.log(`✨ Novos monstros a adicionar: ${toAdd.length}`);
        console.log(`⚪ Monstros já existentes: ${dndMonsters.length - toAdd.length}`);

        if (toAdd.length === 0) {
            console.log("✅ Tudo sincronizado!");
            return;
        }

        if (!execute) {
            console.log("\n📋 MONSTROS QUE SERIAM ADICIONADOS:");
            toAdd.slice(0, 10).forEach(m => console.log(`   ➕ ${m.name} (CR ${m.challenge}, ${m.type})`));
            if (toAdd.length > 10) console.log(`   ... e mais ${toAdd.length - 10} monstros`);

            console.log("\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!");
            console.log("   Execute com --execute para popular o banco.");
            return;
        }

        console.log("\n🚀 Executando ritual de invocação...");

        for (const monster of toAdd) {
            await addDoc(monstrosRef, {
                ...monster,
                createdAt: new Date().toISOString(),
                source: 'system-default'
            });
            process.stdout.write(".");
        }

        console.log("\n\n✅ Sucesso! O Bestiário foi preenchido com sabedoria antiga.");
    } catch (error) {
        console.error("\n❌ Erro durante a invocação:", error);
    }
}

seedMonsters();
