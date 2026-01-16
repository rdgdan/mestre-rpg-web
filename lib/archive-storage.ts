import { db } from './firebase';
import { logger } from '@/lib/logger';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import { ParsedMechanic } from './dnd-parser';

export class ArchiveStorage {
    /**
     * Salva uma mecânica no Firestore com verificação de duplicatas
     */
    static async saveMechanic(userId: string, mechanic: ParsedMechanic, source: string): Promise<boolean> {
        try {
            if (mechanic.type === 'spell') return this.saveSpell(mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source, mechanic.metadata);
            if (mechanic.type === 'monster') return this.saveMonster(mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source, mechanic.metadata);
            if (mechanic.type === 'item') return this.saveItem(mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source, mechanic.metadata);
            if (mechanic.type === 'class') return this.saveClass(mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source, mechanic.metadata);
            if (mechanic.type === 'race') return this.saveRace(mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source, mechanic.metadata);
            return this.saveRule(userId, mechanic.name, mechanic.originalName || mechanic.name, mechanic.content, source);
        } catch (error) {
            console.error('Erro ao salvar mecânica:', error);
            return false;
        }
    }

    /**
     * Verifica se um item já existe na coleção buscando por nome atual ou nome original
     */
    private static async checkDuplicate(collectionName: string, name: string, originalName: string): Promise<boolean> {
        try {
            // Verifica duplicata pelo nome traduzido
            const q1 = query(
                collection(db, collectionName),
                where('nameLower', '==', name.toLowerCase())
            );
            const snap1 = await getDocs(q1);
            if (!snap1.empty) return true;

            // Verifica duplicata pelo nome original em inglês
            const q2 = query(
                collection(db, collectionName),
                where('originalNameLower', '==', originalName.toLowerCase())
            );
            const snap2 = await getDocs(q2);
            return !snap2.empty;
        } catch (error) {
            console.error('Erro ao verificar duplicata:', error);
            return false;
        }
    }

    private static async saveSpell(name: string, originalName: string, content: string, source: string, metadata?: any) {
        // Verificar duplicata
        const exists = await this.checkDuplicate('magias', name, originalName);
        if (exists) {
            console.log(`Magia "${name}" (${originalName}) já existe, pulando...`);
            return false;
        }

        const spellRef = doc(collection(db, 'magias'));
        await setDoc(spellRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            originalName: originalName,
            originalNameLower: originalName.toLowerCase(),
            description: content,
            source,
            level: metadata?.level || 0,
            school: metadata?.school?.name || 'Custom',
            castingTime: metadata?.casting_time || 'N/A',
            range: metadata?.range || 'N/A',
            duration: metadata?.duration || 'N/A',
            components: metadata?.components || [],
            classes: metadata?.classes?.map((c: any) => c.name) || [],
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    private static async saveItem(name: string, originalName: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('itens', name, originalName);
        if (exists) {
            console.log(`Item "${name}" (${originalName}) já existe, pulando...`);
            return false;
        }

        const itemRef = doc(collection(db, 'itens'));
        await setDoc(itemRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            originalName: originalName,
            originalNameLower: originalName.toLowerCase(),
            description: content,
            source,
            rarity: metadata?.rarity?.name || 'Common',
            type: metadata?.equipment_category?.name || 'Item',
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    private static async saveMonster(name: string, originalName: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('monsters', name, originalName);
        if (exists) {
            console.log(`Monstro "${name}" (${originalName}) já existe, pulando...`);
            return false;
        }

        const monsterRef = doc(collection(db, 'monsters'));
        await setDoc(monsterRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            originalName: originalName,
            originalNameLower: originalName.toLowerCase(),
            description: content,
            source,
            size: metadata?.size || 'Medium',
            type: metadata?.type || 'Unknown',
            alignment: metadata?.alignment || 'Unaligned',
            armorClass: metadata?.armor_class?.[0]?.value || 10,
            hitPoints: metadata?.hit_points || 10,
            challengeRating: metadata?.challenge_rating || 0,
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    private static async saveRule(userId: string, name: string, originalName: string, content: string, source: string) {
        const ruleDocRef = doc(db, 'custom_rules', userId);

        // Verificar se a regra já existe
        const docSnap = await getDoc(ruleDocRef);
        if (docSnap.exists()) {
            const existingRules = docSnap.data().rules || [];
            const duplicate = existingRules.find((r: any) =>
                r.title.toLowerCase() === name.toLowerCase() ||
                (r.originalName && r.originalName.toLowerCase() === originalName.toLowerCase())
            );
            if (duplicate) {
                console.log(`Regra "${name}" (${originalName}) já existe, pulando...`);
                return false;
            }
        }

        const newRule = {
            id: `imported-${Date.now()}`,
            title: name.charAt(0).toUpperCase() + name.slice(1),
            originalName: originalName,
            content: `<blockquote>Fonte: ${source}</blockquote>\n${content}`,
            source,
            importedAt: new Date().toISOString()
        };

        if (docSnap.exists()) {
            await updateDoc(ruleDocRef, {
                rules: arrayUnion(newRule)
            });
        } else {
            await setDoc(ruleDocRef, { rules: [newRule] });
        }
        return true;
    }

    private static async saveClass(name: string, originalName: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('classes', name, originalName);
        if (exists) return false;

        const ref = doc(collection(db, 'classes'));
        await setDoc(ref, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            originalName,
            originalNameLower: originalName.toLowerCase(),
            description: content,
            source,
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    private static async saveRace(name: string, originalName: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('races', name, originalName);
        if (exists) return false;

        const ref = doc(collection(db, 'races'));
        await setDoc(ref, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            originalName,
            originalNameLower: originalName.toLowerCase(),
            description: content,
            source,
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    /**
     * Remove duplicatas, migra coleções em inglês para português e normaliza dados
     */
    static async cleanupDuplicates(userId: string, onProgress?: (msg: string) => void): Promise<{ processed: number, deleted: number }> {
        // Mapeamento de coleções (Origem -> Destino)
        const colMapping: Record<string, string> = {
            'spells': 'magias',
            'magias': 'magias',
            'items': 'itens',
            'itens': 'itens',
            'monsters': 'monsters',
            'monstros': 'monsters',
            'classes': 'classes',
            'races': 'races'
        };

        const sourceCollections = Object.keys(colMapping);
        let totalProcessed = 0;
        let totalDeleted = 0;

        // Mapa global para rastrear o que já vimos por tipo de destino
        // Map<TargetCol, Set<OriginalNameLower>>
        const seenInTarget = new Map<string, Set<string>>();

        for (const sourceCol of sourceCollections) {
            const targetCol = colMapping[sourceCol];
            if (onProgress) onProgress(`Processando: ${sourceCol} ➔ ${targetCol}...`);

            if (!seenInTarget.has(targetCol)) {
                seenInTarget.set(targetCol, new Set());
            }
            const seenSet = seenInTarget.get(targetCol)!;

            try {
                const q = query(collection(db, sourceCol));
                const snapshot = await getDocs(q);

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const docId = docSnap.id;
                    totalProcessed++;

                    // 1. Normalizar Nome e Nome Original
                    let name = data.name || "";
                    let originalName = (data.originalName || name).trim();
                    let originalNameLower = originalName.toLowerCase();

                    if (!originalNameLower) {
                        await deleteDoc(docSnap.ref);
                        totalDeleted++;
                        continue;
                    }

                    // 2. Normalizar Dados (Alignment, ArmorClass, etc)
                    const normalizedData: any = { ...data };

                    // Corrigir Alignment (comum vir como objeto {0: 'C', 1: 'G'})
                    if (normalizedData.alignment && typeof normalizedData.alignment === 'object') {
                        const vals = Object.values(normalizedData.alignment);
                        normalizedData.alignment = vals.join('') || "Unaligned";
                    }

                    // Garantir campos de busca
                    normalizedData.nameLower = (normalizedData.name || "").toLowerCase();
                    normalizedData.originalName = originalName;
                    normalizedData.originalNameLower = originalNameLower;

                    // 3. Verificar Duplicata
                    if (seenSet.has(originalNameLower)) {
                        // Já vimos esse item em algum lugar que mapeia para este destino
                        await deleteDoc(docSnap.ref);
                        totalDeleted++;
                        console.log(`[Cleanup] Removendo duplicata: ${originalName} em ${sourceCol}`);
                    } else {
                        seenSet.add(originalNameLower);

                        // 4. Migração entre coleções se necessário
                        if (sourceCol !== targetCol) {
                            console.log(`[Cleanup] Migrando ${originalName} de ${sourceCol} para ${targetCol}`);
                            const newRef = doc(collection(db, targetCol));
                            await setDoc(newRef, normalizedData);
                            await deleteDoc(docSnap.ref);
                        } else {
                            // Apenas atualizar metadados se necessário
                            if (!data.originalNameLower || typeof data.alignment === 'object') {
                                await updateDoc(docSnap.ref, normalizedData);
                            }
                        }
                    }
                }
            } catch (err) {
                logger.warn(`[Cleanup] Coleção ${sourceCol} possivelmente não existe ou erro:`, err);
            }
        }

        // Limpar regras específicas do usuário
        if (onProgress) onProgress(`Limpando regras personalizadas...`);
        const ruleDocRef = doc(db, 'custom_rules', userId);
        try {
            const ruleSnap = await getDoc(ruleDocRef);
            if (ruleSnap.exists()) {
                const rules = ruleSnap.data().rules || [];
                const seenRules = new Set<string>();
                const uniqueRules = rules.filter((r: any) => {
                    const key = (r.originalName || r.title || '').trim().toLowerCase();
                    if (!key || seenRules.has(key)) {
                        totalDeleted++;
                        return false;
                    }
                    seenRules.add(key);
                    if (!r.originalName) r.originalName = r.title;
                    return true;
                });

                if (uniqueRules.length !== rules.length) {
                    await updateDoc(ruleDocRef, { rules: uniqueRules });
                }
                totalProcessed += rules.length;
            }
        } catch (e) {
            console.error("Erro ao limpar regras:", e);
        }
        return { processed: totalProcessed, deleted: totalDeleted };
    }

    /**
     * Tradução em massa usando dicionários da comunidade (Zero Tokens)
     */
    static async bulkTranslateWithDictionary(onProgress?: (current: number, total: number, msg: string) => void): Promise<{ translated: number, failed: number }> {
        const mapping = [
            { col: 'magias', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.spells.json' },
            { col: 'itens', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.items.json' },
            { col: 'monsters', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.monsters.json' },
            { col: 'classes', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.classes.json' },
            { col: 'races', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.races.json' },
            { col: 'regras', url: 'https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/dnd5e.rules.json' }
        ];

        let translatedCount = 0;
        let failedCount = 0;

        for (const { col, url } of mapping) {
            try {
                if (onProgress) onProgress(0, 0, `Baixando dicionário para ${col}...`);
                const response = await fetch(url);
                if (!response.ok) continue;
                const dictData = await response.json();
                const entries = dictData.entries || {};

                if (onProgress) onProgress(0, 0, `Processando coleção ${col}...`);

                const q = query(collection(db, col));
                const snapshot = await getDocs(q);

                let i = 0;
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();

                    // Converter para formato que applyTranslation entende
                    const mechanic = {
                        name: data.name,
                        originalName: data.originalName || data.name,
                        content: data.description || ""
                    };

                    const fixed = this.applyTranslation(mechanic, entries);

                    // Só atualizar se mudar algo (tradução ou limpeza de HTML)
                    if (fixed.name !== data.name || fixed.content !== data.description) {
                        try {
                            await updateDoc(docSnap.ref, {
                                name: fixed.name,
                                nameLower: fixed.name.toLowerCase(),
                                description: fixed.content,
                                isTranslated: true,
                                translatedAt: new Date().toISOString()
                            });
                            translatedCount++;
                        } catch (e) {
                            console.error(`Erro ao atualizar ${mechanic.originalName}:`, e);
                            failedCount++;
                        }
                    }

                    i++;
                    if (i % 10 === 0 && onProgress) {
                        onProgress(i, snapshot.size, `Processando ${col}: ${i}/${snapshot.size}`);
                    }
                }
            } catch (error) {
                console.error(`Erro na tradução da coleção ${col}:`, error);
                failedCount++;
            }
        }

        return { translated: translatedCount, failed: failedCount };
    }

    /**
     * Busca um dicionário de tradução do repositório dnd5e-pt-br
     */
    static async getTranslationDictionary(type: string): Promise<Record<string, any>> {
        const typeMapping: Record<string, string> = {
            'spells': 'dnd5e.spells.json',
            'monsters': 'dnd5e.monsters.json',
            'equipment': 'dnd5e.items.json',
            'items': 'dnd5e.items.json',
            'classes': 'dnd5e.classes.json',
            'races': 'dnd5e.races.json',
            'rules': 'dnd5e.rules.json',
            'backgrounds': 'dnd5e.backgrounds.json'
        };

        const filename = typeMapping[type];
        if (!filename) return {};

        try {
            const url = `https://raw.githubusercontent.com/decito/dnd5e-pt-br/main/compendium/${filename}`;
            const response = await fetch(url);
            if (!response.ok) return {};
            const data = await response.json();
            return data.entries || {};
        } catch (error) {
            console.error(`Erro ao baixar dicionário ${type}:`, error);
            return {};
        }
    }

    /**
     * Aplica tradução de um dicionário a um objeto de mecânica
     */
    static applyTranslation(mechanic: any, dictionary: Record<string, any>): any {
        const stripHtml = (html: string) => {
            if (!html) return '';
            return html.replace(/<[^>]*>?/gm, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/@Compendium\[[^\]]*\]{([^}]*)}}/g, '$1'); // Limpa links do Foundry
        };

        // Tenta busca exata, case-insensitive ou base name
        let translation = dictionary[mechanic.originalName || mechanic.name];

        if (!translation) {
            const original = (mechanic.originalName || mechanic.name).toLowerCase();
            // Regex para remover (Source) no fim
            const baseName = original.replace(/\s*\([^)]+\)$/, '').trim();

            const key = Object.keys(dictionary).find(k => {
                const kLower = k.toLowerCase();
                return kLower === original || kLower === baseName;
            });
            if (key) translation = dictionary[key];
        }

        if (translation) {
            const rawContent = translation.description || mechanic.content;
            return {
                ...mechanic,
                name: translation.name || mechanic.name,
                content: stripHtml(rawContent),
                isTranslated: true
            };
        }

        // Se não achou tradução mas é um objeto 5etools, tentar limpar o name se tiver (Source)
        if (mechanic.name.includes('(')) {
            return {
                ...mechanic,
                name: mechanic.name.replace(/\s*\([^)]+\)$/, '').trim()
            };
        }

        return mechanic;
    }

    /**
     * Atualiza um registro específico com dados traduzidos
     */
    static async updateTranslatedRecord(collectionName: string, docId: string, translatedData: { name: string, description: string }): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, {
                name: translatedData.name,
                nameLower: translatedData.name.toLowerCase(),
                description: translatedData.description,
                isTranslated: true
            });
            return true;
        } catch (error) {
            console.error('Erro ao atualizar registro traduzido:', error);
            return false;
        }
    }
}
