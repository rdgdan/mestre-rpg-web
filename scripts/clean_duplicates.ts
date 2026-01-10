// scripts/clean_duplicates.ts
// import 'undici/shim'; 
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { SPELL_NAMES } from '../lib/spell-translator';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔧 Verificando configuração Firebase...');
console.log('   Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

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

// LISTA DE COLEÇÕES ORGANIZADA POR GRUPOS DE SEGURANÇA
// Itens de um grupo NÃO serão comparados com itens de outro grupo.
const SAFETY_GROUPS = [
    { name: 'Spells Group', collections: ['magias', 'spells', 'custom_spells'] },
    { name: 'Items Group', collections: ['items'] },
    { name: 'Monsters Group', collections: ['monsters'] },
    { name: 'Races Group', collections: ['races'] },
    { name: 'Classes Group', collections: ['classes'] },
    { name: 'Backgrounds Group', collections: ['backgrounds'] },
    { name: 'Books Group', collections: ['books'] }
];

function getIdentifier(docData: any): string {
    let name = (docData.slug ?? docData.name ?? '').trim();
    if (!name) return '';

    // 1. Tenta tradução DIRETA (Inglês -> Português)
    if (SPELL_NAMES[name]) {
        name = SPELL_NAMES[name];
    } else {
        // Tenta Case Insensitive match no dicionário
        const lowerName = name.toLowerCase();
        const foundKey = Object.keys(SPELL_NAMES).find(k => k.toLowerCase() === lowerName);
        if (foundKey) {
            name = SPELL_NAMES[foundKey];
        }
    }

    return name.toLowerCase(); // Normaliza para comparação
}

function hasFullTranslation(doc: any): boolean {
    if (doc.translated === true) return true;
    const languages = ['en', 'pt', 'es'];
    return languages.every((lang) => !!doc[lang]);
}

function chooseBetter(existingData: any, newData: any): boolean {
    const existingComplete = hasFullTranslation(existingData);
    const newComplete = hasFullTranslation(newData);

    if (existingComplete && !newComplete) return true;
    if (!existingComplete && newComplete) return false;
    return true;
}

// Levenshtein Implementation
function levenshtein(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

async function main() {
    console.log('\n🧹 SCRIPT DE LIMPEZA GLOBAL DE DUPLICATAS (v6 - SEGURANÇA POR TIPO)');
    console.log('   Modo: Safety Groups (Magias com Magias, Raças com Raças...)');
    console.log('='.repeat(80));

    const report: any[] = [];
    const deleteOps: { col: string, id: string }[] = [];

    // Itera por GRUPOS DE SEGURANÇA
    for (const group of SAFETY_GROUPS) {
        console.log(`\n🔒 PROCESSANDO GRUPO: ${group.name.toUpperCase()}`);
        console.log(`   Coleções: [${group.collections.join(', ')}]`);
        console.log('-'.repeat(40));

        // Limpa o Mapa Global a cada grupo para evitar "contaminação" cruzada
        // Ex: "Trovão" (Spell) não vai estar no mapa quando formos processar "Tritão" (Race)
        // Key: slug/name normalizado -> Value: { collection, id, data }
        const groupMap = new Map<string, { collection: string, id: string, data: any }>();
        let groupDuplicates = 0;

        for (const colName of group.collections) {
            try {
                console.log(`  📂 Lendo coleção: ${colName}...`);
                const colRef = collection(db, colName);
                const snapshot = await getDocs(colRef);
                console.log(`     > Encontrados ${snapshot.size} documentos.`);

                if (snapshot.size === 0) continue;

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const id = getIdentifier(data); // Returns Translated Lowercase Name

                    if (!id) continue;

                    let match = groupMap.get(id);
                    let isFuzzy = false;

                    // Fuzzy Match
                    if (!match && id.length >= 5) {
                        for (const [existingId, existing] of Array.from(groupMap.entries())) {
                            if (existingId[0] !== id[0]) continue;
                            if (Math.abs(existingId.length - id.length) > 3) continue;

                            const dist = levenshtein(id, existingId);
                            if (dist > 0 && dist <= 2) {
                                console.log(`        👀 Possível Typo detectado: "${id}" ≈ "${existingId}" (Dist: ${dist})`);
                                match = existing;
                                isFuzzy = true;
                                break;
                            }
                        }
                    }

                    if (match) {
                        // CONFLITO ENCONTRADO
                        groupDuplicates++;

                        const existing = match;
                        const keepExisting = chooseBetter(existing.data, data);

                        const toDelete = keepExisting ? { col: colName, id: docSnap.id } : { col: existing.collection, id: existing.id };
                        const toKeep = keepExisting ? existing : { collection: colName, id: docSnap.id, data };

                        const typeLabel = isFuzzy ? "DUPLICATA FUZZY" : "DUPLICATA EXATA";
                        const existingName = getIdentifier(existing.data);
                        const originalName = (data.slug ?? data.name ?? '');

                        console.log(`     🔸 ${typeLabel}: "${originalName}" -> "${id}" vs "${existingName}"`);
                        console.log(`        Manter: [${toKeep.collection}] ${toKeep.id}`);
                        console.log(`        Deletar: [${toDelete.col}] ${toDelete.id}`);

                        deleteOps.push(toDelete);
                        report.push({
                            group: group.name,
                            identifier: id,
                            originalName: originalName,
                            matchType: isFuzzy ? 'fuzzy' : 'exact_translated',
                            kept: { collection: toKeep.collection, id: toKeep.id },
                            deleted: { collection: toDelete.col, id: toDelete.id }
                        });

                        // Update Map
                        if (!keepExisting) {
                            if (isFuzzy) {
                                groupMap.delete(existingName);
                                groupMap.set(id, toKeep);
                            } else {
                                groupMap.set(id, toKeep);
                            }
                        }

                    } else {
                        groupMap.set(id, { collection: colName, id: docSnap.id, data });
                    }
                }

            } catch (err: any) {
                console.error(`ERROR em ${colName}:`, err.message);
            }
        }
        console.log(`   > Total duplicatas no grupo ${group.name}: ${groupDuplicates}`);
    }

    // Executar deleções
    if (deleteOps.length > 0) {
        console.log(`\n🗑️  Iniciando deleção de ${deleteOps.length} itens duplicados...`);
        let deletedCount = 0;
        for (const op of deleteOps) {
            try {
                await deleteDoc(doc(db, op.col, op.id));
                deletedCount++;
                process.stdout.write('.');
            } catch (e: any) {
                console.error(`X Falha ao deletar ${op.col}/${op.id}:`, e.message);
            }
        }
        console.log(`\n✅ Total deletado com sucesso: ${deletedCount}`);
    } else {
        console.log('\n✨ Nenhuma duplicata encontrada.');
    }

    fs.writeFileSync('scripts/duplicate_cleanup_report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Relatório salvo em scripts/duplicate_cleanup_report.json');
}

main().catch(console.error);
