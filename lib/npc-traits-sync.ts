import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { npcProfessions, npcAppearances, npcPersonalities, npcRaces } from './npcData';

export interface NpcTraits {
    professions: string[];
    appearances: string[];
    personalities: string[];
    races: string[];
}

/**
 * Sincroniza os traços de NPC (profissões, aparências, personalidades, raças) para o Firestore.
 * Usa os dados locais como seed se o banco estiver vazio.
 */
export async function fetchNpcTraitsFromFirestore(): Promise<NpcTraits> {
    try {
        const docRef = doc(db, 'game_rules', 'npc_traits');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as NpcTraits;
            return {
                professions: data.professions || [],
                appearances: data.appearances || [],
                personalities: data.personalities || [],
                races: data.races || []
            };
        }

        // Se não existir, criar com os dados locais
        console.log('Traits de NPC não encontrados no banco. Sincronizando dados iniciais...');
        const initialData: NpcTraits = {
            professions: npcProfessions,
            appearances: npcAppearances,
            personalities: npcPersonalities,
            races: npcRaces
        };

        await setDoc(docRef, initialData);
        return initialData;

    } catch (error) {
        console.error('Erro ao buscar traits de NPC:', error);
        // Fallback para dados locais
        return {
            professions: npcProfessions,
            appearances: npcAppearances,
            personalities: npcPersonalities,
            races: npcRaces
        };
    }
}


/**
 * Força uma sincronização dos dados locais `npcData` para o Firestore,
 * mantendo os dados existentes no banco e evitando duplicatas.
 */
export async function syncNpcTraitsToFirestore(): Promise<NpcTraits> {
    try {
        const docRef = doc(db, 'game_rules', 'npc_traits');
        const docSnap = await getDoc(docRef);

        const currentData = docSnap.exists()
            ? docSnap.data() as NpcTraits
            : { professions: [], appearances: [], personalities: [], races: [] };

        const { npcTemplates } = await import('./npc-combatants-data');
        // Filtra nomes que contêm raças explicícitas (ex: "Guerreiro Anão", "Batedor Elfo")
        // para manter a lista de profissões genérica
        const combatantProfessions = npcTemplates
            .map(t => t.name)
            .filter(name => !npcRaces.some(race => name.toLowerCase().includes(race.toLowerCase())));

        const mergedData: NpcTraits = {
            professions: Array.from(new Set([
                ...(currentData.professions || []),
                ...npcProfessions,
                ...combatantProfessions
            ]))
            .filter(name => !npcRaces.some(race => name.toLowerCase().includes(race.toLowerCase())))
            .sort(),
            appearances: Array.from(new Set([...(currentData.appearances || []), ...npcAppearances])).sort(),
            personalities: Array.from(new Set([...(currentData.personalities || []), ...npcPersonalities])).sort(),
            races: Array.from(new Set([...(currentData.races || []), ...npcRaces])).sort()
        };

        await setDoc(docRef, mergedData);
        console.log('Traits sincronizados com sucesso!');
        return mergedData;
    } catch (error) {
        console.error('Erro ao sincronizar traits:', error);
        throw error;
    }
}
