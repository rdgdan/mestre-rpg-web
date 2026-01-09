/**
 * Script de diagnóstico - Verifica quais coleções existem e quantos dados têm
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

async function diagnosticar() {
    console.log('\n🔍 DIAGNÓSTICO DO BANCO DE DADOS FIREBASE\n');
    console.log('='.repeat(60));

    console.log('\n📌 Projeto:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('\n📚 Verificando coleções...\n');

    // Lista de coleções para verificar
    const colecoesParaVerificar = [
        'magias',
        'classes',
        'races',
        'monstros',
        'itens',
        'personagens',
        'custom_rules',
        'game_rules',
        'custom_spells',
        'custom_monsters',
        'custom_classes',
        'library_metadata'
    ];

    const resultados: any[] = [];

    for (const colecao of colecoesParaVerificar) {
        try {
            const ref = collection(db, colecao);
            const snapshot = await getDocs(ref);

            const resultado = {
                nome: colecao,
                documentos: snapshot.size,
                exemplos: snapshot.docs.slice(0, 3).map(doc => ({
                    id: doc.id,
                    dados: doc.data()
                }))
            };

            resultados.push(resultado);

            if (snapshot.size > 0) {
                console.log(`✅ ${colecao.padEnd(25)} → ${snapshot.size} documento(s)`);

                // Mostrar exemplo de estrutura de dados
                if (snapshot.docs.length > 0) {
                    const primeiroDoc = snapshot.docs[0].data();
                    const campos = Object.keys(primeiroDoc).join(', ');
                    console.log(`   Campos: ${campos}`);

                    // Mostrar alguns nomes de exemplo
                    if (primeiroDoc.name) {
                        const nomes = snapshot.docs
                            .slice(0, 5)
                            .map(d => d.data().name)
                            .filter(Boolean)
                            .join(', ');
                        console.log(`   Exemplos: ${nomes}`);
                    }
                }
            } else {
                console.log(`⚪ ${colecao.padEnd(25)} → vazio`);
            }
        } catch (error: any) {
            console.log(`❌ ${colecao.padEnd(25)} → erro: ${error.message}`);
        }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO:\n');

    const comDados = resultados.filter(r => r.documentos > 0);
    const vazias = resultados.filter(r => r.documentos === 0);

    console.log(`✅ Coleções com dados: ${comDados.length}`);
    comDados.forEach(r => {
        console.log(`   • ${r.nome}: ${r.documentos} itens`);
    });

    console.log(`\n⚪ Coleções vazias: ${vazias.length}`);
    if (vazias.length > 0 && vazias.length <= 5) {
        vazias.forEach(r => console.log(`   • ${r.nome}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 RECOMENDAÇÕES:\n');

    // Verificar onde estão as magias
    const magias = resultados.find(r => r.nome === 'magias');
    const customSpells = resultados.find(r => r.nome === 'custom_spells');

    if (magias && magias.documentos > 0) {
        console.log('✅ Magias encontradas na coleção "magias"');
        console.log(`   O script de limpeza pode traduzir ${magias.documentos} magias\n`);
    }

    if (customSpells && customSpells.documentos > 0) {
        console.log('📝 Magias customizadas encontradas em "custom_spells"');
        console.log(`   São ${customSpells.documentos} documento(s) de usuários\n`);
    }

    // Verificar raças
    const races = resultados.find(r => r.nome === 'races');
    if (races && races.documentos > 0) {
        console.log('✅ Raças encontradas na coleção "races"');
        console.log(`   O script pode limpar duplicados em ${races.documentos} raças\n`);
    } else {
        console.log('⚠️  Nenhuma raça encontrada na coleção "races"');
        console.log('   As raças podem estar em outra coleção ou serem hardcoded\n');
    }

    // Verificar classes
    const classes = resultados.find(r => r.nome === 'classes');
    if (classes && classes.documentos > 0) {
        console.log('✅ Classes encontradas na coleção "classes"');
        console.log(`   O script pode limpar duplicados em ${classes.documentos} classes\n`);
    } else {
        console.log('⚠️  Nenhuma classe encontrada na coleção "classes"');
        console.log('   As classes podem estar em outra coleção ou serem hardcoded\n');
    }

    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

diagnosticar().catch(error => {
    console.error('\n❌ Erro durante diagnóstico:', error);
    process.exit(1);
});
