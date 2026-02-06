import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    doc,
    onSnapshot,
    updateDoc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    Character,
    calculateComputedStats,
    hydrateCharacter
} from '@/lib/character-data';
import {
    getMaxSpellSlotsForCharacter,
    canUseSpell,
    consumeSpellSlot,
    restShortSpells,
    restLongSpells,
    calculateArcaneRecoveryLimit
} from '@/lib/spell-usage';
import { isMaster } from '@/lib/master-utils';
import { firestoreCache } from '@/lib/cache-service';
import { dndClasses, dndRaces } from '@/lib/dnd-data';
import { dndWeapons, dndEquipments } from '@/lib/items-data';
import { CombatNotification } from '@/components/CombatNotifications';
import { useRouter } from 'next/navigation';

// Lodash debounce implementation
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

export function useCharacterSheet(id: string) {
    const [user] = useAuthState(auth);
    const router = useRouter();

    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbDataLoading, setIsDbDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Game Data State
    const [classes, setClasses] = useState<string[]>([]);
    const [races, setRaces] = useState<string[]>([]);
    const [weapons, setWeapons] = useState<any[]>([]);
    const [allEquipment, setAllEquipment] = useState<any[]>([]);

    const characterLoaded = useRef(false);
    const dataFetchInitiated = useRef(false);

    // --- Persistence ---
    const debouncedSave = useMemo(() => debounce(async (charToSave: Character) => {
        if (!user || !charToSave.id || charToSave.id === 'novo') return;
        try {
            const docRef = doc(db, 'personagens', charToSave.id);
            await setDoc(docRef, JSON.parse(JSON.stringify(charToSave)), { merge: true });
        } catch (err) {
            console.error("Erro ao salvar personagem:", err);
        }
    }, 1500), [user]);

    const updateCharacter = useCallback((updater: (char: Character) => Character) => {
        if (isReadOnly) return;
        setCharacter(prevChar => {
            if (!prevChar) return null;
            const updatedChar = updater(prevChar);
            const finalChar = calculateComputedStats(updatedChar);
            debouncedSave(finalChar);
            return finalChar;
        });
    }, [isReadOnly, debouncedSave]);

    // --- Notificar Ações para o Confronto ---
    const notifyEncounter = useCallback(async (action: {
        type: CombatNotification['type'],
        message: string,
        icon: string,
        severity?: CombatNotification['severity']
    }) => {
        if (!character?.activeEncounterId || !character?.id || isReadOnly) return;

        try {
            const logsRef = collection(db, 'encounters', character.activeEncounterId, 'logs');
            await addDoc(logsRef, {
                characterId: character.id,
                characterName: character.name,
                timestamp: Date.now(),
                type: action.type,
                message: action.message,
                icon: action.icon,
                severity: action.severity || 'info'
            });
        } catch (err) {
            console.error("Erro ao enviar notificação para o encontro:", err);
        }
    }, [character?.activeEncounterId, character?.id, character?.name, isReadOnly]);

    const handleFieldChange = useCallback(async (field: keyof Omit<Character, 'attributes' | 'skills' | 'inventory'>, value: any) => {
        const oldValue = character ? character[field] : null;
        updateCharacter(char => ({ ...char, [field]: value }));

        // Sincronização de HP com o Combate
        if (field === 'currentHp' && character?.activeEncounterId && !isReadOnly && typeof value === 'number') {
            const diff = value - (oldValue as number || 0);
            const absDiff = Math.abs(diff);

            if (diff !== 0) {
                await notifyEncounter({
                    type: 'hp-change' as any,
                    message: diff > 0 ? `Recuperou ${absDiff} PV` : `Perdeu ${absDiff} PV`,
                    icon: diff > 0 ? '💚' : '🩸',
                    severity: diff > 0 ? 'success' : 'warning'
                });

                if (value <= 0 && (oldValue as number || 0) > 0) {
                    await notifyEncounter({
                        type: 'effect-applied',
                        message: 'Caiu em combate! (0 PV)',
                        icon: '🚨',
                        severity: 'alert'
                    });
                }

                try {
                    const combatRef = doc(db, 'encounters', character.activeEncounterId);
                    const combatSnap = await getDoc(combatRef);
                    if (combatSnap.exists()) {
                        const combatants = combatSnap.data().combatants || [];
                        const updated = combatants.map((c: any) =>
                            c.externalId === character.id ? { ...c, hp: value, status: value <= 0 ? 'unconscious' : 'active' } : c
                        );
                        await updateDoc(combatRef, { combatants: updated });
                        if (combatSnap.data().isOnline) {
                            await updateDoc(doc(db, 'arenas_online', character.activeEncounterId), { combatants: updated });
                        }
                    }
                } catch (e) {
                    console.error("Erro ao sincronizar HP:", e);
                }
            }
        }
    }, [character, isReadOnly, updateCharacter, notifyEncounter]);

    const handleLevelChange = useCallback((newLevel: number) => {
        if (newLevel < 1 || newLevel > 20) return;
        updateCharacter(char => ({ ...char, level: newLevel }));
    }, [updateCharacter]);

    const handleXPChange = useCallback((amount: number) => {
        updateCharacter(char => ({ ...char, experience: (char.experience || 0) + amount }));
    }, [updateCharacter]);

    const handleNestedChange = useCallback((path: string, value: any) => {
        updateCharacter(char => {
            const newChar = { ...char } as any;
            const parts = path.split('.');
            let current = newChar;
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return newChar;
        });
    }, [updateCharacter]);

    const handleRest = useCallback(async (restType: 'short' | 'long') => {
        if (!character) return;

        const characterClassStr = character.classes?.length
            ? character.classes.map(c => `${c.name} ${c.level}`).join(' / ')
            : character.class;

        let newSlots = character.spellcasting?.slots || {};
        if (restType === 'short') {
            newSlots = restShortSpells(characterClassStr as string, character.level || 1, newSlots, character.classes);
        } else {
            const rawMax = restLongSpells(characterClassStr as string, character.level || 1, character.classes);
            // Converter Record<string, number> para Record<string, {current, max}>
            newSlots = {};
            Object.entries(rawMax).forEach(([lvl, count]) => {
                newSlots[lvl] = { current: count, max: count };
            });
        }

        updateCharacter(char => ({
            ...char,
            spellcasting: {
                ability: char.spellcasting?.ability || '',
                saveDc: char.spellcasting?.saveDc || 0,
                attackBonus: char.spellcasting?.attackBonus || 0,
                ...(char.spellcasting || {}),
                slots: newSlots
            },
            arcaneRecoveryUsed: restType === 'long' ? false : char.arcaneRecoveryUsed
        }));

        await notifyEncounter({
            type: restType === 'short' ? 'rest-short' : 'rest-long',
            message: `Realizou um ${restType === 'short' ? 'Descanso Curto' : 'Descanso Longo'}`,
            icon: restType === 'short' ? '☕' : '⛺',
            severity: 'success'
        });

        if (restType === 'short') {
            const wizard = character.classes?.find(c => c.name.toLowerCase().includes('mago'));
            if (wizard && !character.arcaneRecoveryUsed) {
                return { needsArcaneRecovery: true, limit: calculateArcaneRecoveryLimit(wizard.level) };
            }
        }
        return { needsArcaneRecovery: false };
    }, [character, updateCharacter, notifyEncounter]);

    const handleSpellUsed = useCallback(async (spell: any) => {
        if (!character || !character.spellcasting) return false;

        const pactLevel = character.spellcasting.pactLevel || 0;
        const canUseIt = canUseSpell(character.spellcasting.slots || {}, spell, pactLevel);
        if (!canUseIt) return false;

        const newSlots = consumeSpellSlot(character.spellcasting.slots || {}, spell, 1, pactLevel);
        updateCharacter(char => ({
            ...char,
            spellcasting: {
                ...char.spellcasting,
                slots: newSlots
            }
        }));

        await notifyEncounter({
            type: 'spell-use',
            message: `Lançou ${spell.name} (Nível ${spell.level === 0 ? 'Truque' : spell.level})`,
            icon: '🪄',
            severity: 'info'
        });

        return true;
    }, [character, updateCharacter, notifyEncounter]);

    // --- Data Fetching ---
    useEffect(() => {
        if (dataFetchInitiated.current) return;
        dataFetchInitiated.current = true;

        const fetchGameData = async () => {
            setIsDbDataLoading(true);
            try {
                const populateCollection = async (collectionName: string, defaultData: any[]) => {
                    const cached = firestoreCache.get(collectionName);
                    if (cached) return cached;

                    const collectionRef = collection(db, collectionName);
                    const snapshot = await getDocs(collectionRef);

                    const finalData = snapshot.docs.length > 0
                        ? snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }))
                        : defaultData;

                    firestoreCache.set(collectionName, finalData);
                    return finalData;
                };

                const [loadedClasses, raceData, allItemsData] = await Promise.all([
                    (async () => {
                        const gameRulesRef = doc(db, 'game_rules', 'class_features');
                        const snap = await getDoc(gameRulesRef);
                        return snap.exists() ? dndClasses : dndClasses;
                    })(),
                    populateCollection('races', dndRaces.map(name => ({ name }))),
                    populateCollection('itens', [
                        ...dndWeapons.map(w => ({ ...w, itemType: 'WEAPON' })),
                        ...dndEquipments.map(e => ({ ...e, itemType: 'EQUIPMENT' }))
                    ])
                ]);

                setClasses(loadedClasses);
                setRaces(raceData.map((r: any) => r.name));
                setWeapons(allItemsData.filter((i: any) => i.itemType === 'WEAPON' || i.damage || i.diceType));
                setAllEquipment(allItemsData.filter((i: any) => i.itemType !== 'WEAPON' && !i.damage && !i.diceType));
            } catch (err) {
                console.error("Falha ao carregar dados do jogo:", err);
            } finally {
                setIsDbDataLoading(false);
            }
        };
        fetchGameData();
    }, []);

    // --- Character Loader & Listener ---
    useEffect(() => {
        if (!user || id === 'novo') {
            if (id === 'novo') {
                setCharacter(calculateComputedStats(hydrateCharacter({}, 'novo')));
            }
            setIsLoading(false);
            return;
        }

        const docRef = doc(db, 'personagens', id);
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (!docSnap.exists()) {
                setError("Ficha não encontrada.");
                setIsLoading(false);
                return;
            }

            const charData = docSnap.data();

            if (characterLoaded.current) {
                setCharacter(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        currentHp: charData.currentHp,
                        experience: charData.experience,
                        spellcasting: charData.spellcasting || prev.spellcasting,
                        activeEncounterId: charData.activeEncounterId,
                        activeEffects: charData.activeEffects || [],
                        conditions: charData.conditions || [],
                        authorizedMasterIds: charData.authorizedMasterIds || prev.authorizedMasterIds,
                        attributes: charData.attributes || prev.attributes,
                        inventory: charData.inventory || prev.inventory,
                        spells: charData.spells || prev.spells,
                    };
                });
                return;
            }

            try {
                setIsLoading(true);
                const isOwner = charData.ownerId === user.uid;
                setIsReadOnly(!isOwner);

                const hydratedChar = hydrateCharacter(charData as Partial<Character>, docSnap.id);

                // --- Enrichment ---
                const { fetchGlobalSpells } = await import('@/lib/spells-data');
                const { fetchGlobalItems, parseDamageString: parseDmg } = await import('@/lib/items-data');

                const [globalSpells, globalItems] = await Promise.all([
                    fetchGlobalSpells(),
                    fetchGlobalItems()
                ]);

                // Enrich Spells
                if (hydratedChar.spells) {
                    hydratedChar.spells = hydratedChar.spells.map(s => {
                        if (!s || !s.name) return s;
                        if (s.description && s.description !== 'Sem descrição.' && s.castingTime) return s;
                        const match = globalSpells.find(gs => gs.name.toLowerCase() === s.name.toLowerCase());
                        return match ? { ...s, ...match, id: s.id } : s;
                    });
                }

                // Enrich Items
                const allWeapons = globalItems.filter(i => i.itemType === 'WEAPON' || i.damage || i.diceType);
                const allEquipmentItems = globalItems.filter(i => i.itemType !== 'WEAPON' && !i.damage && !i.diceType);
                const normalizeStr = (str: string) => str ? str.normalize('NFC').trim().toLowerCase() : '';

                if (hydratedChar.inventory.weapons) {
                    hydratedChar.inventory.weapons = hydratedChar.inventory.weapons.map(w => {
                        if (!w || !w.name || w.isCustomDamage) return w;
                        const wNameNormalized = normalizeStr(w.name);
                        const match = allWeapons.find(gi => normalizeStr(gi.name) === wNameNormalized);
                        if (match) {
                            const p = parseDmg(match.damage || '1d8');
                            return { ...w, ...match, id: w.id, quantity: w.quantity, diceQty: p.diceQty, diceType: p.diceType, diceBonus: p.diceBonus };
                        }
                        return w;
                    });
                }

                if (hydratedChar.inventory.otherEquipment) {
                    hydratedChar.inventory.otherEquipment = hydratedChar.inventory.otherEquipment.map(e => {
                        if (!e || !e.name) return e;
                        const match = allEquipmentItems.find(gi => normalizeStr(gi.name) === normalizeStr(e.name));
                        return match ? { ...e, ...match, id: e.id, quantity: e.quantity } : e;
                    });
                }

                const finalChar = calculateComputedStats(hydratedChar);
                setCharacter(finalChar);
                characterLoaded.current = true;
            } catch (err) {
                console.error("Erro ao carregar personagem:", err);
                setError("Falha ao processar dados do personagem.");
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [id, user]);

    return {
        character,
        setCharacter,
        isLoading,
        isDbDataLoading,
        error,
        isReadOnly,
        classes,
        races,
        weapons,
        allEquipment,
        updateCharacter,
        handleFieldChange,
        handleLevelChange,
        handleXPChange,
        handleNestedChange,
        handleRest,
        handleSpellUsed,
        notifyEncounter
    };
}
