/**
 * Script para listar monstros que não têm tradução no dicionário atual
 * 
 * Uso:
 * npx tsx scripts/listar-monstros-sem-traducao.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { MONSTER_NAMES } from '../lib/monster-translator';

// Carregar variáveis de ambiente
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

async function listarFaltantes() {
    console.log(`\n🔍 PROCURANDO MONSTROS SEM TRADUÇÃO...\n`);

    const colecoes = ['monstros', 'custom_monsters'];
    const faltantes = new Set<string>();
    const processados = new Set<string>();

    for (const nomeColecao of colecoes) {
        try {
            const ref = collection(db, nomeColecao);
            const snapshot = await getDocs(ref);

            snapshot.forEach(doc => {
                const data = doc.data();
                const nome = data.name;

                if (typeof nome === 'string' && nome) {
                    processados.add(nome);

                    // Verifica se tem tradução direta
                    if (!MONSTER_NAMES[nome]) {
                        // Verifica case-insensitive
                        const key = Object.keys(MONSTER_NAMES).find(k => k.toLowerCase() === nome.toLowerCase());
                        if (!key) {
                            faltantes.add(nome);
                        }
                    }
                }
            });
        } catch (error) {
            console.error(`Erro na coleção ${nomeColecao}:`, error);
        }
    }

    console.log('='.repeat(60));
    console.log(`🧮 Total de nomes únicos encontrados: ${processados.size}`);
    console.log(`📝 Total sem tradução: ${faltantes.size}`);
    console.log('='.repeat(60));

    console.log('\n--- LISTA DE NOMES SEM TRADUÇÃO (JSON) ---\n');
    // console.log(JSON.stringify(Array.from(faltantes).sort(), null, 2));

    // Salvar em arquivo diretamente para garantir encoding
    const fs = require('fs');
    fs.writeFileSync('missing_utf8.json', JSON.stringify(Array.from(faltantes).sort(), null, 2), 'utf8');
    console.log('Arquivo missing_utf8.json salvo com sucesso.');

    process.exit(0);
}

listarFaltantes().catch(e => {
    console.error(e);
    process.exit(1);
});
