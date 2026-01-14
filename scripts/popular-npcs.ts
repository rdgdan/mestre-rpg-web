/**
 * Script para popular o Firestore com NPCs padrão do código
 * 
 * Este script:
 * 1. Lê os NPCs de lib/npc-combatants-data.ts
 * 2. Popula a coleção 'npcs' (padrão do sistema)
 * 3. Evita duplicados verificando por nome
 * 
 * IMPORTANTE: Execute em modo teste primeiro!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { npcTemplates } from '../lib/npc-combatants-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuração do Firebase
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

async function popularNpcs(dryRun: boolean = true) {
    console.log('\n🛡️  POPULANDO NPCs PADRÃO NO FIRESTORE\n');
    console.log('='.repeat(60));

    try {
        // 1. Buscar NPCs existentes
        const npcsRef = collection(db, 'npcs'); // Coleção separada para NPCs do sistema
        const snapshot = await getDocs(npcsRef);

        const npcsExistentes = new Set<string>();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name) {
                npcsExistentes.add(data.name.toLowerCase().trim());
            }
        });

        console.log(`\n📊 NPCs já no banco: ${npcsExistentes.size}`);
        console.log(`📚 NPCs no código: ${npcTemplates.length}\n`);

        // 2. Identificar novos NPCs
        const novos = npcTemplates.filter(n =>
            !npcsExistentes.has(n.name.toLowerCase().trim())
        );

        if (novos.length === 0) {
            console.log('✅ Todos os NPCs já estão no banco!\n');
            return;
        }

        console.log(`✨ Novos NPCs a adicionar: ${novos.length}\n`);

        // 3. Adicionar novos NPCs
        if (!dryRun) {
            const batch = writeBatch(db);
            let batchCount = 0;

            for (const npc of novos) {
                // Usar o nome como ID (normalizado, sem caracteres especiais)
                const docId = npc.name
                    .toLowerCase()
                    .normalize('NFD') // Remove acentos
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '-') // Substitui não-alphanum por hífen
                    .replace(/-+/g, '-') // Remove hífens duplicados
                    .replace(/^-|-$/g, ''); // Remove hífen do começo/fim

                const docRef = doc(db, 'npcs', docId);

                batch.set(docRef, {
                    ...npc,
                    source: 'system', // Marca como NPC do sistema
                    createdAt: new Date().toISOString()
                });

                batchCount++;
                console.log(`➕ Adicionando: ${npc.name} (${npc.role})`);
            }

            await batch.commit();
            console.log(`\n💾 ${batchCount} NPCs salvos com sucesso!\n`);

        } else {
            // Modo de teste
            console.log('📋 NPCs QUE SERIAM ADICIONADOS:\n');
            novos.forEach(n => {
                console.log(`   ➕ ${n.name} (${n.role}, ${n.race})`);
            });

            console.log('\n' + '='.repeat(60));
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
            console.log(`   Execute com --execute para popular o banco.\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao popular NPCs:', error);
        throw error;
    }
}

// Executar
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
popularNpcs(dryRun).then(() => process.exit(0)).catch(() => process.exit(1));
