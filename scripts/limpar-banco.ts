/**
 * Script de limpeza do banco de dados Firebase
 * 
 * Este script resolve dois problemas:
 * 1. Traduz magias em inglês para português
 * 2. Remove duplicados de raças/classes normalizando os nomes
 * 
 * IMPORTANTE: Execute este script com cuidado!
 * Recomenda-se fazer backup do banco antes.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { translateSpell } from '../lib/spell-translator';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.local
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
 * Normaliza um nome: Primeira letra maiúscula, resto minúsculo
 */
function normalizeName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * 1. TRADUZ MAGIAS EM INGLÊS PARA PORTUGUÊS
 */
async function traduzirMagias(dryRun: boolean = true) {
    console.log('\n🔮 TRADUZINDO MAGIAS DO BANCO DE DADOS\n');
    console.log('='.repeat(60));

    try {
        const magiasRef = collection(db, 'magias');
        const snapshot = await getDocs(magiasRef);

        console.log(`\n📊 Total de magias encontradas: ${snapshot.size}\n`);

        let traduzidas = 0;
        let naoTraduzidas = 0;
        const batch = writeBatch(db);
        let batchCount = 0;

        for (const docSnapshot of snapshot.docs) {
            const magia = docSnapshot.data();
            const magiaOriginal = { ...magia, id: docSnapshot.id };

            // Tentar traduzir
            const magiaTraduzida = translateSpell(magiaOriginal);

            // Verificar se foi traduzida (nome mudou OU descrição mudou)
            if (magiaTraduzida.name !== magia.name || (magiaTraduzida.description && magiaTraduzida.description !== magia.description)) {
                traduzidas++;
                if (magiaTraduzida.name !== magia.name) {
                    console.log(`✅ ${magia.name} → ${magiaTraduzida.name}`);
                } else {
                    console.log(`📝 Descrição atualizada: ${magiaTraduzida.name}`);
                }

                if (!dryRun) {
                    batch.update(doc(db, 'magias', docSnapshot.id), magiaTraduzida);
                    batchCount++;

                    // Firestore permite max 500 operações por batch
                    if (batchCount >= 500) {
                        await batch.commit();
                        console.log('\n💾 Salvando lote de 500 magias...\n');
                        batchCount = 0;
                    }
                }
            } else {
                naoTraduzidas++;
            }
        }

        // Commit final
        if (!dryRun && batchCount > 0) {
            await batch.commit();
            console.log('\n💾 Salvando lote final...\n');
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\n📊 RESUMO DA TRADUÇÃO:`);
        console.log(`   ✨ Magias traduzidas: ${traduzidas}`);
        console.log(`   ⚪ Já em português: ${naoTraduzidas}`);

        if (dryRun) {
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
            console.log(`   Execute com --execute para aplicar as mudanças.\n`);
        } else {
            console.log(`\n✅ Magias traduzidas com sucesso!\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao traduzir magias:', error);
        throw error;
    }
}

/**
 * 1B. TRADUZ MAGIAS CUSTOMIZADAS DE USUÁRIOS
 */
async function traduzirMagiasCustomizadas(dryRun: boolean = true) {
    console.log('\n✨ TRADUZINDO MAGIAS CUSTOMIZADAS DE USUÁRIOS\n');
    console.log('='.repeat(60));

    try {
        const customSpellsRef = collection(db, 'custom_spells');
        const snapshot = await getDocs(customSpellsRef);

        console.log(`\n📊 Total de documentos de usuários: ${snapshot.size}\n`);

        let totalTraduzidas = 0;
        let totalNaoTraduzidas = 0;
        let usuariosComMagias = 0;

        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            const spells = userData.spells || [];

            if (spells.length === 0) continue;

            usuariosComMagias++;
            console.log(`\n👤 Usuário: ${userDoc.id} (${spells.length} magias)`);

            let traduzidas = 0;
            const spellsTraduzidas = spells.map((spell: any) => {
                const traduzida = translateSpell(spell);

                if (traduzida.name !== spell.name || (traduzida.description && traduzida.description !== spell.description)) {
                    traduzidas++;
                    if (traduzida.name !== spell.name) {
                        console.log(`   ✅ ${spell.name} → ${traduzida.name}`);
                    } else {
                        console.log(`   📝 Descrição atualizada: ${traduzida.name}`);
                    }
                    return traduzida;
                }
                return spell;
            });

            totalTraduzidas += traduzidas;
            totalNaoTraduzidas += (spells.length - traduzidas);

            if (traduzidas > 0 && !dryRun) {
                await setDoc(doc(db, 'custom_spells', userDoc.id), { spells: spellsTraduzidas });
                console.log(`   💾 ${traduzidas} magias traduzidas salvas!`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\n📊 RESUMO DAS MAGIAS CUSTOMIZADAS:`);
        console.log(`   👥 Usuários com magias: ${usuariosComMagias}`);
        console.log(`   ✨ Magias traduzidas: ${totalTraduzidas}`);
        console.log(`   ⚪ Já em português: ${totalNaoTraduzidas}`);

        if (dryRun) {
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
            console.log(`   Execute com --execute para aplicar as mudanças.\n`);
        } else {
            console.log(`\n✅ Magias customizadas traduzidas com sucesso!\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao traduzir magias customizadas:', error);
        throw error;
    }
}

/**
 * 2. REMOVE DUPLICADOS DE RAÇAS NORMALIZANDO NOMES
 */
async function limparDuplicadosRacas(dryRun: boolean = true) {
    console.log('\n🧝 LIMPANDO DUPLICADOS DE RAÇAS\n');
    console.log('='.repeat(60));

    try {
        const racesRef = collection(db, 'races');
        const snapshot = await getDocs(racesRef);

        console.log(`\n📊 Total de raças encontradas: ${snapshot.size}\n`);

        const racasUnicas = new Map<string, any>();
        const duplicados: string[] = [];

        // Agrupar por nome normalizado
        for (const docSnapshot of snapshot.docs) {
            const raca = docSnapshot.data();
            const nomeNormalizado = normalizeName(raca.name || '');

            if (!nomeNormalizado) continue;

            if (racasUnicas.has(nomeNormalizado)) {
                // É duplicado
                duplicados.push(docSnapshot.id);
                console.log(`🗑️  Duplicado: "${raca.name}" (será removido)`);
            } else {
                // Primeira ocorrência - manter
                racasUnicas.set(nomeNormalizado, {
                    id: docSnapshot.id,
                    data: { ...raca, name: nomeNormalizado }
                });
                console.log(`✅ Mantendo: "${raca.name}" → "${nomeNormalizado}"`);
            }
        }

        // Remover duplicados e normalizar nomes
        if (!dryRun) {
            const batch = writeBatch(db);
            let batchCount = 0;

            // Deletar duplicados
            for (const id of duplicados) {
                batch.delete(doc(db, 'races', id));
                batchCount++;

                if (batchCount >= 500) {
                    await batch.commit();
                    console.log('\n💾 Salvando lote...\n');
                    batchCount = 0;
                }
            }

            // Normalizar nomes das raças mantidas
            for (const [nome, info] of Array.from(racasUnicas.entries())) {
                batch.update(doc(db, 'races', info.id), { name: nome });
                batchCount++;

                if (batchCount >= 500) {
                    await batch.commit();
                    console.log('\n💾 Salvando lote...\n');
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\n📊 RESUMO DA LIMPEZA DE RAÇAS:`);
        console.log(`   ✅ Raças únicas: ${racasUnicas.size}`);
        console.log(`   🗑️  Duplicados removidos: ${duplicados.length}`);

        if (dryRun) {
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
        } else {
            console.log(`\n✅ Raças limpas com sucesso!\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao limpar raças:', error);
        throw error;
    }
}

/**
 * 3. REMOVE DUPLICADOS DE CLASSES NORMALIZANDO NOMES
 */
async function limparDuplicadosClasses(dryRun: boolean = true) {
    console.log('\n⚔️  LIMPANDO DUPLICADOS DE CLASSES\n');
    console.log('='.repeat(60));

    try {
        const classesRef = collection(db, 'classes');
        const snapshot = await getDocs(classesRef);

        console.log(`\n📊 Total de classes encontradas: ${snapshot.size}\n`);

        const classesUnicas = new Map<string, any>();
        const duplicados: string[] = [];

        // Agrupar por nome normalizado
        for (const docSnapshot of snapshot.docs) {
            const classe = docSnapshot.data();
            const nomeNormalizado = normalizeName(classe.name || '');

            if (!nomeNormalizado) continue;

            if (classesUnicas.has(nomeNormalizado)) {
                // É duplicado
                duplicados.push(docSnapshot.id);
                console.log(`🗑️  Duplicado: "${classe.name}" (será removido)`);
            } else {
                // Primeira ocorrência - manter
                classesUnicas.set(nomeNormalizado, {
                    id: docSnapshot.id,
                    data: { ...classe, name: nomeNormalizado }
                });
                console.log(`✅ Mantendo: "${classe.name}" → "${nomeNormalizado}"`);
            }
        }

        // Remover duplicados e normalizar nomes
        if (!dryRun) {
            const batch = writeBatch(db);
            let batchCount = 0;

            // Deletar duplicados
            for (const id of duplicados) {
                batch.delete(doc(db, 'classes', id));
                batchCount++;

                if (batchCount >= 500) {
                    await batch.commit();
                    console.log('\n💾 Salvando lote...\n');
                    batchCount = 0;
                }
            }

            // Normalizar nomes das classes mantidas
            for (const [nome, info] of Array.from(classesUnicas.entries())) {
                batch.update(doc(db, 'classes', info.id), { name: nome });
                batchCount++;

                if (batchCount >= 500) {
                    await batch.commit();
                    console.log('\n💾 Salvando lote...\n');
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`\n📊 RESUMO DA LIMPEZA DE CLASSES:`);
        console.log(`   ✅ Classes únicas: ${classesUnicas.size}`);
        console.log(`   🗑️  Duplicados removidos: ${duplicados.length}`);

        if (dryRun) {
            console.log(`\n⚠️  MODO DE TESTE - Nenhuma alteração foi salva!`);
        } else {
            console.log(`\n✅ Classes limpas com sucesso!\n`);
        }

    } catch (error) {
        console.error('❌ Erro ao limpar classes:', error);
        throw error;
    }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    const opcao = args[0];

    console.log('\n🧹 SCRIPT DE LIMPEZA DO BANCO DE DADOS');
    console.log('='.repeat(60));

    if (dryRun) {
        console.log('\n⚠️  EXECUTANDO EM MODO DE TESTE (dry-run)');
        console.log('   Nenhuma alteração será feita no banco!');
        console.log('   Use --execute para aplicar as mudanças.\n');
    } else {
        console.log('\n🔴 EXECUTANDO EM MODO REAL');
        console.log('   As alterações SERÃO aplicadas ao banco!\n');

        // Delay de segurança
        console.log('   Aguardando 3 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        switch (opcao) {
            case 'magias':
            case '1':
                await traduzirMagias(dryRun);
                await traduzirMagiasCustomizadas(dryRun);
                break;

            case 'racas':
            case '2':
                await limparDuplicadosRacas(dryRun);
                break;

            case 'classes':
            case '3':
                await limparDuplicadosClasses(dryRun);
                break;

            case 'tudo':
            case 'all':
            default:
                await traduzirMagias(dryRun);
                await traduzirMagiasCustomizadas(dryRun);
                await limparDuplicadosRacas(dryRun);
                await limparDuplicadosClasses(dryRun);
                break;
        }

        console.log('\n✅ Script concluído com sucesso!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro durante a execução:', error);
        process.exit(1);
    }
}

// Executar
main();
