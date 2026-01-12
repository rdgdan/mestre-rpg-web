/**
 * Script para corrigir, traduzir e remover duplicatas de monstros no Firestore
 * 
 * Uso:
 * npx ts-node scripts/corrigir-monstros-banco.ts [--dry-run]
 * 
 * --dry-run: Simula as operações sem alterar o banco
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { MONSTER_NAMES, MONSTER_TYPES, translateMonster } from '../lib/monster-translator';

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

const DRY_RUN = process.argv.includes('--dry-run');

interface MonsterDoc {
    id: string;
    data: any;
}

async function corrigirMonstros() {
    console.log(`\n🦕 INICIANDO CORREÇÃO DE MONSTROS DO BANCO DE DADOS`);
    if (DRY_RUN) console.log(`⚠️  MODO DRY-RUN: Nenhuma alteração será salva.`);
    console.log('='.repeat(60));

    const colecoes = ['monstros', 'custom_monsters'];
    let totalProcessados = 0;
    let totalAlterados = 0;
    let totalDeletados = 0;

    // Set para rastrear unicidade (Nome normalizado -> ID do documento mantido)
    // Se encontrarmos outro documento com o mesmo nome, é duplicata.
    const monstrosUnicos = new Map<string, string>();

    for (const nomeColecao of colecoes) {
        console.log(`\n📂 Processando coleção: ${nomeColecao}...`);

        try {
            const ref = collection(db, nomeColecao);
            const snapshot = await getDocs(ref);

            if (snapshot.empty) {
                console.log(`   ⚪ Coleção vazia.`);
                continue;
            }

            console.log(`   Encontrados ${snapshot.size} documentos.`);

            // Processar em lotes de 500 (limite do batch)
            const documentos: MonsterDoc[] = snapshot.docs.map(d => ({ id: d.id, data: d.data() }));

            // Vamos iterar todos e preparar as operações
            const operacoes: { type: 'update' | 'delete', id: string, data?: any, razao: string }[] = [];

            for (const doc of documentos) {
                const monstro = doc.data;
                const nomeOriginal = monstro.name;

                if (typeof nomeOriginal !== 'string' || !nomeOriginal) {
                    console.warn(`   ⚠️  Documento ${doc.id} sem nome ou nome inválido. Ignorando.`);
                    continue;
                }

                // 1. Tradução
                const monstroTraduzido = translateMonster(monstro);
                const houveAlteracao = monstroTraduzido.name !== monstro.name || monstroTraduzido.type !== monstro.type;

                const nomeTraduzido = monstroTraduzido.name;
                const tipoTraduzido = monstroTraduzido.type;
                const dataParaSalvar = houveAlteracao ? monstroTraduzido : monstro;

                // Normaliza o nome para checar duplicatas (agora em português se foi traduzido)
                const nomeFinal = nomeTraduzido.trim().toLowerCase();

                // 2. Deduplicação
                if (monstrosUnicos.has(nomeFinal)) {
                    // DUPLICATA ENCONTRADA
                    const idOriginal = monstrosUnicos.get(nomeFinal);
                    operacoes.push({
                        type: 'delete',
                        id: doc.id,
                        razao: `Duplicata de ${idOriginal} (${nomeTraduzido})`
                    });
                    totalDeletados++;
                } else {
                    // NOVO REGISTRO ÚNICO
                    monstrosUnicos.set(nomeFinal, doc.id);

                    if (houveAlteracao) {
                        operacoes.push({
                            type: 'update',
                            id: doc.id,
                            data: dataParaSalvar,
                            razao: `Tradução: ${nomeOriginal} -> ${nomeTraduzido}`
                        });
                        totalAlterados++;
                    }
                }
                totalProcessados++;
            }

            // Executar operações em lotes
            if (operacoes.length > 0) {
                console.log(`   Processando ${operacoes.length} operações...`);

                // Firestore batch limita a 500 operações
                const chunkSize = 500;
                for (let i = 0; i < operacoes.length; i += chunkSize) {
                    const chunk = operacoes.slice(i, i + chunkSize);
                    const batch = writeBatch(db);

                    if (DRY_RUN) {
                        console.log(`   [Simulação lote ${i / chunkSize + 1}]`);
                    }

                    chunk.forEach(op => {
                        const docRef = doc(db, nomeColecao, op.id);
                        if (op.type === 'delete') {
                            if (!DRY_RUN) batch.delete(docRef);
                            console.log(`      ❌ DELETE [${op.id}]: ${op.razao}`);
                        } else {
                            if (!DRY_RUN) batch.update(docRef, op.data);
                            console.log(`      ✏️  UPDATE [${op.id}]: ${op.razao}`);
                        }
                    });

                    if (!DRY_RUN) {
                        await batch.commit();
                        console.log(`   ✅ Lote ${i / chunkSize + 1} executado.`);
                    }
                }
            } else {
                console.log(`   ✅ Nenhuma alteração necessária nesta coleção.`);
            }

        } catch (error: any) {
            console.error(`   ❌ Erro ao processar coleção ${nomeColecao}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 RESUMO FINAL ${DRY_RUN ? '(DRY-RUN)' : ''}`);
    console.log(`   Processados: ${totalProcessados}`);
    console.log(`   Alterados (Tradução): ${totalAlterados}`);
    console.log(`   Deletados (Duplicatas): ${totalDeletados}`);
    console.log('='.repeat(60));
    process.exit(0);
}

corrigirMonstros().catch(e => {
    console.error("Erro fatal:", e);
    process.exit(1);
});
