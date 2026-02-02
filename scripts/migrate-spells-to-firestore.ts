/**
 * Script de Migração: Magias do Código → Firestore
 * 
 * Execução: npm run migrate-spells
 */

import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { spellsDatabase } from '../lib/spells-data';

async function migrateSpellsToFirestore() {
    console.log('🚀 Iniciando migração de magias...\n');

    try {
        // 1. Buscar todas as magias do Firestore
        console.log('📥 Buscando magias do Firestore...');
        const spellsRef = collection(db, 'magias');
        const q = query(spellsRef);
        const snapshot = await getDocs(q);

        const firestoreSpells = new Map();
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Usar nome como chave (normalizado)
            const key = data.name?.toLowerCase().trim();
            if (key) {
                firestoreSpells.set(key, { id: docSnap.id, ...data });
            }
        });

        console.log(`✅ ${firestoreSpells.size} magias encontradas no Firestore\n`);

        // 2. Processar magias do código
        console.log('🔄 Processando magias do código...\n');

        let updated = 0;
        let skipped = 0;
        let notFound = 0;
        let errors = 0;

        for (const spell of spellsDatabase) {
            const spellKey = spell.name.toLowerCase().trim();

            try {
                // Verificar se magia existe no Firestore
                const existingSpell = firestoreSpells.get(spellKey);

                if (!existingSpell) {
                    console.log(`⚠️  Não encontrado: ${spell.name}`);
                    notFound++;
                    continue;
                }

                // Verificar se já tem classes válido
                const hasValidClasses = existingSpell.classes &&
                    Array.isArray(existingSpell.classes) &&
                    existingSpell.classes.length > 0;

                if (hasValidClasses) {
                    console.log(`⏭️  Pulado: ${spell.name} (já tem: ${existingSpell.classes.join(', ')})`);
                    skipped++;
                    continue;
                }

                // ATUALIZAR magia
                await updateDoc(doc(db, 'magias', existingSpell.id), {
                    classes: spell.classes
                });

                console.log(`✅ Atualizado: ${spell.name} → [${spell.classes.join(', ')}]`);
                updated++;

            } catch (err) {
                console.error(`❌ Erro ao processar ${spell.name}:`, err);
                errors++;
            }
        }

        // 3. Resumo
        console.log('\n📊 RESUMO DA MIGRAÇÃO:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Magias atualizadas: ${updated}`);
        console.log(`⏭️  Magias puladas: ${skipped}`);
        console.log(`⚠️  Não encontradas: ${notFound}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📚 Total no código: ${spellsDatabase.length}`);
        console.log(`📥 Total no Firestore: ${firestoreSpells.size}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (errors === 0 && updated > 0) {
            console.log('🎉 Migração concluída com sucesso!');
            console.log('\n💡 Próximo passo: Recarregue a página do app (F5) e teste o modal de magias!');
        } else if (updated === 0 && skipped > 0) {
            console.log('ℹ️  Todas as magias já tinham o campo classes!');
        } else if (errors > 0) {
            console.log('⚠️  Migração concluída com alguns erros. Verifique os logs acima.');
        }

    } catch (error) {
        console.error('💥 Erro fatal durante a migração:', error);
        throw error;
    }
}

// Executar migração
migrateSpellsToFirestore()
    .then(() => {
        console.log('\n✅ Script finalizado.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script falhou:', error);
        process.exit(1);
    });
