import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import { ParsedMechanic } from './dnd-parser';

export class ArchiveStorage {
    /**
     * Salva uma mecânica no Firestore com verificação de duplicatas
     */
    static async saveMechanic(userId: string, mechanic: ParsedMechanic, source: string): Promise<boolean> {
        try {
            const normalizedName = mechanic.name.trim().toLowerCase();

            switch (mechanic.type) {
                case 'spell':
                    return await this.saveSpell(normalizedName, mechanic.content, source, mechanic.metadata);
                case 'item':
                    return await this.saveItem(normalizedName, mechanic.content, source, mechanic.metadata);
                case 'monster':
                    return await this.saveMonster(normalizedName, mechanic.content, source, mechanic.metadata);
                case 'rule':
                    return await this.saveRule(userId, normalizedName, mechanic.content, source);
            }
            return false;
        } catch (error) {
            console.error('Erro ao salvar mecânica:', error);
            return false;
        }
    }

    /**
     * Verifica se um item já existe na coleção
     */
    private static async checkDuplicate(collectionName: string, name: string): Promise<boolean> {
        try {
            const q = query(
                collection(db, collectionName),
                where('nameLower', '==', name.toLowerCase())
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Erro ao verificar duplicata:', error);
            return false;
        }
    }

    private static async saveSpell(name: string, content: string, source: string, metadata?: any) {
        // Verificar duplicata
        const exists = await this.checkDuplicate('magias', name);
        if (exists) {
            console.log(`Magia "${name}" já existe, pulando...`);
            return false;
        }

        const spellRef = doc(collection(db, 'magias'));
        await setDoc(spellRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
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

    private static async saveItem(name: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('itens', name);
        if (exists) {
            console.log(`Item "${name}" já existe, pulando...`);
            return false;
        }

        const itemRef = doc(collection(db, 'itens'));
        await setDoc(itemRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
            description: content,
            source,
            rarity: metadata?.rarity?.name || 'Common',
            type: metadata?.equipment_category?.name || 'Item',
            isImported: true,
            importedAt: new Date().toISOString()
        });
        return true;
    }

    private static async saveMonster(name: string, content: string, source: string, metadata?: any) {
        const exists = await this.checkDuplicate('monstros', name);
        if (exists) {
            console.log(`Monstro "${name}" já existe, pulando...`);
            return false;
        }

        const monsterRef = doc(collection(db, 'monstros'));
        await setDoc(monsterRef, {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            nameLower: name.toLowerCase(),
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

    private static async saveRule(userId: string, name: string, content: string, source: string) {
        const ruleDocRef = doc(db, 'custom_rules', userId);

        // Verificar se a regra já existe
        const docSnap = await getDoc(ruleDocRef);
        if (docSnap.exists()) {
            const existingRules = docSnap.data().rules || [];
            const duplicate = existingRules.find((r: any) =>
                r.title.toLowerCase() === name.toLowerCase()
            );
            if (duplicate) {
                console.log(`Regra "${name}" já existe, pulando...`);
                return false;
            }
        }

        const newRule = {
            id: `imported-${Date.now()}`,
            title: name.charAt(0).toUpperCase() + name.slice(1),
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
}
