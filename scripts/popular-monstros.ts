/**
 * Script para popular o Firestore com monstros do código
 * 
 * Este script:
 * 1. Lê os monstros de lib/monsters-data.ts
 * 2. Verifica se cada monstro já existe no Firestore (por nome)
 * 3. Só adiciona se não existir (evita duplicados)
 * 
 * IMPORTANTE: Execute em modo teste primeiro!
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch, query, where } from 'firebase/firestore';
import { dndMonsters } from '../lib/monsters-data';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔧 Verificando configuração Firebase...');
console.log('   Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

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

/**
 * Popula o Firestore com monstros, evitando duplicados
 */
async function popularMonstros(dryRun: boolean = true) {
    console.log('\n🐉 POPULANDO MONSTROS NO FIRESTORE\n');
    console.log('='.repeat(60));

    try {
        // 1. Buscar monstros existentes
        const monstrosRef = collection(db, 'monsters');
        const snapshot = await getDocs(monstrosRef);

        const monstrosExistentes = new Set<string>();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name) {
                monstrosExistentes.add(data.name.toLowerCase().trim());
            }
        });

        console.log(`\n📊 Monstros já no banco: ${monstrosExistentes.size}`);
        console.log(`📚 Monstros no código: ${dndMonsters.length}\n`);

        // 2. Identificar novos monstros
        const novos = dndMonsters.filter(m =>
            !monstrosExistentes.has(m.name.toLowerCase().trim())
        );

        const duplicados = dndMonsters.filter(m =>
            monstrosExistentes.has(m.name.toLowerCase().trim())
        );

        console.log(`✨ Novos monstros a adicionar: ${novos.length}`);
        console.log(`⚪ Monstros já existentes: ${duplicados.length}\n`);

        if (novos.length === 0) {
            console.log('✅ Todos os monstros já estão no banco!\n');
            return;
        }

        // 3. Adicionar novos monstros
        if (!dryRun) {
            const batch = writeBatch(db);
            let batchCount = 0;
            let totalAdicionados = 0;

            for (const monstro of novos) {
                // Usar o nome como ID (normalizado, sem caracteres especiais)
                const docId = monstro.name
                    .toLowerCase()
                    .normalize('NFD') // Remove acentos
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]/g, '-') // Substitui não-alphanum por hífen
                    .replace(/-+/g, '-') // Remove hífens duplicados
                    .replace(/^-|-$/g, ''); // Remove hífen do começo/fim

                const docRef = doc(db, 'monsters', docId);

                batch.set(docRef, {
                    ...monstro,
                    createdAt: new Date().toISOString(),
                    source: 'system' // Marca como monstro do sistema
                });

                batchCount++;
                totalAdicionados++;

                console.log(`➕ Adicionando: ${monstro.name} (CR ${monstro.challenge})`);

                // Firestore permite máx 500 operações por batch
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`\n💾 Salvando lote de ${batchCount} monstros...\n`);
                    batchCount = 0;
                }
            }

            // Commit final
            if (batchCount > 0) {
                await batch.commit();
                console.log(`\n💾 Salvando lote final de ${batchCount} monstros...\n`);
            }

            console.log('\n' + '='.repeat(60));
            console.log(`\n📊 RESUMO:`);
            console.log(`   ✅ Monstros adicionados: ${totalAdicionados}`);
            console.log(`   ⚪ Já existentes (ignorados): ${duplicados.length}`);
            console.log(`\n✅ Monstros populados com sucesso!\n`);

        } else {
            // Modo de teste - apenas listar
            console.log('📋 MONSTROS QUE SERIAM ADICIONADOS:\n');
            novos.slice(0, 10).forEach(m => {
                console.log(`   ➕ ${m.name} (CR ${m.challenge}, ${m.type})`);
            });

            if (novos.length > 10) {
                console.log(`   ... e mais ${novos.length - 10} monstros`);
            }

            console.log('\n' + '='.repeat(60));
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
            console.log(`   Execute com --execute para popular o banco.\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao popular monstros:', error);
        throw error;
    }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');

    console.log('\n🐲 SCRIPT DE POPULAÇÃO DE MONSTROS');
    console.log('='.repeat(60));

    if (dryRun) {
        console.log('\n⚠️  EXECUTANDO EM MODO DE TESTE (dry-run)');
        console.log('   Nenhuma alteração será feita no banco!');
        console.log('   Use --execute para aplicar as mudanças.\n');
    } else {
        console.log('\n🔴 EXECUTANDO EM MODO REAL');
        console.log('   Os monstros SERÃO adicionados ao banco!\n');

        // Delay de segurança
        console.log('   Aguardando 3 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        await popularMonstros(dryRun);
        console.log('\n✅ Script concluído com sucesso!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro durante a execução:', error);
        process.exit(1);
    }
}

// Executar
main();
