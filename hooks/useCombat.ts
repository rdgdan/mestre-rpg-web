import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
    doc,
    onSnapshot,
    updateDoc,
    setDoc,
    collection,
    getDoc,
    query,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { translateMonster } from '@/lib/monster-translator';
import { dndMonsters } from '@/lib/monsters-data';
import { npcTemplates } from '@/lib/npc-combatants-data';

// --- Interfaces ---
export interface StatusEffect {
    id: string;
    name: string;
    duration: number;
    category?: 'benefit' | 'debuff';
}

export interface CombatNotification {
    id: string;
    timestamp: number;
    characterName: string;
    characterId: string;
    type: 'spell-use' | 'rest-short' | 'rest-long' | 'ability-use' | 'effect-applied' | 'effect-removed' | 'hp-change';
    message: string;
    icon: string;
    severity: 'info' | 'warning' | 'success' | 'alert';
}

export interface Combatant {
    id: string;
    externalId?: string;
    ownerId?: string;
    ownerName?: string;
    name: string;
    type: 'player' | 'monster' | 'npc';
    hp: number;
    maxHp: number;
    initiative: number;
    status: 'active' | 'dead' | 'unconscious';
    ac?: number;
    cr?: string | number;
    xp?: number;
    statusEffects: StatusEffect[];
    deathSaves?: { successes: number; failures: number };
    class?: string;
    level?: number;
    spellSlotsCurrent?: Record<number, number>;
    spells?: any[];
    initiativeBonus?: number;
}

export function useCombat(encounterId: string, user: any, mode: 'master' | 'player' = 'master') {
    const router = useRouter();
    const isRemoteUpdate = useRef(false);

    // --- State ---
    const [phase, setPhase] = useState<'preparation' | 'initiative' | 'combat'>('preparation');
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [round, setRound] = useState(1);
    const [turnIndex, setTurnIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [encounterTitle, setEncounterTitle] = useState('Encontro');
    const [combatNotifications, setCombatNotifications] = useState<CombatNotification[]>([]);
    const [isOnline, setIsOnline] = useState(mode === 'player');
    const [hostInfo, setHostInfo] = useState({ id: '', name: '' });

    // UI states
    const [hpAdjustmentValues, sethpAdjustmentValues] = useState<Record<string, string>>({});
    const [healAdjustmentValues, setHealAdjustmentValues] = useState<Record<string, string>>({});
    const [notificationsMap, setNotificationsMap] = useState<Record<string, CombatNotification>>({});
    const [characterInfo, setCharacterInfo] = useState<Record<string, { class: string; level: number }>>({});
    const [dbMonsters, setDbMonsters] = useState<any[]>([]);
    const [dbStandardNpcs, setDbStandardNpcs] = useState<any[]>([]);
    const [customNpcs, setCustomNpcs] = useState<any[]>([]);
    const [myCharacters, setMyCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [isClassFxOpen, setIsClassFxOpen] = useState(false);
    const [classFxTarget, setClassFxTarget] = useState<Combatant | null>(null);

    // Modais de confirmação
    const [confirmCureModal, setConfirmCureModal] = useState<{ open: boolean; combatant: Combatant | null }>({ open: false, combatant: null });
    const [confirmRemoveModal, setConfirmRemoveModal] = useState<{ open: boolean; combatantId: string | null; combatantName: string | null }>({ open: false, combatantId: null, combatantName: null });
    const [confirmResetModal, setConfirmResetModal] = useState(false);
    const [monsterSheet, setMonsterSheet] = useState<{ open: boolean; monster: any | null }>({ open: false, monster: null });

    // --- Helpers ---
    const dedupeCombatants = useCallback((arr: Combatant[]) => {
        const map = new Map<string, Combatant>();
        for (const c of arr || []) {
            map.set(String(c.id), c);
        }
        return Array.from(map.values());
    }, []);

    const syncState = useCallback(async (updates: any) => {
        if (!encounterId) return;
        try {
            const deepSanitize = (obj: any): any => {
                if (obj === null || obj === undefined) return null;
                if (Array.isArray(obj)) return obj.map(item => deepSanitize(item));
                if (typeof obj === 'object') {
                    const sanitized: any = {};
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        if (value !== undefined) sanitized[key] = deepSanitize(value);
                    });
                    return sanitized;
                }
                return obj;
            };

            const sanitized = deepSanitize(updates);

            // Se for Jogador, a única coisa que ele pode atualizar é o PRÓPRIO combate no array
            if (mode === 'player') {
                const sessionRef = doc(db, 'arenas_online', encounterId);
                const sessionSnap = await getDoc(sessionRef);
                if (sessionSnap.exists()) {
                    const sessionData = sessionSnap.data();
                    const updatedCombatants = (sessionData.combatants || []).map((c: any) => {
                        if (c.ownerId === user?.uid && c.type === 'player') {
                            // Merge updates relevant to combatants
                            if (updates.combatants) {
                                const myUpd = updates.combatants.find((u: any) => u.id === c.id || u.externalId === c.externalId);
                                if (myUpd) return { ...c, ...myUpd };
                            }
                        }
                        return c;
                    });
                    await updateDoc(sessionRef, { combatants: updatedCombatants });
                }
                return;
            }

            // Master logic
            if (sanitized.combatants) {
                sanitized.combatants = dedupeCombatants(sanitized.combatants).map((c: any) => deepSanitize(c));
            }

            await updateDoc(doc(db, 'encounters', encounterId), sanitized);
            if (isOnline || updates.isOnline) {
                const sessionRef = doc(db, 'arenas_online', encounterId);
                let mergedCombatants = updates.combatants || combatants;

                try {
                    const arenaSnap = await getDoc(sessionRef);
                    if (arenaSnap.exists()) {
                        const arenaCombatants = arenaSnap.data().combatants || [];
                        arenaCombatants.forEach((arenaComb: any) => {
                            const exists = mergedCombatants.findIndex((c: any) =>
                                c.id === arenaComb.id || c.externalId === arenaComb.externalId
                            );
                            if (exists === -1) mergedCombatants.push(arenaComb);
                        });
                    }
                } catch (e) { console.warn("Arena sync merge failed", e); }

                const finalCombatants = dedupeCombatants(mergedCombatants).map((c: any) => {
                    const clean = deepSanitize(c);
                    if (!clean.statusEffects) clean.statusEffects = [];
                    return clean;
                });
                finalCombatants.sort((a, b) => b.initiative - a.initiative);

                if (user?.uid) {
                    await setDoc(sessionRef, {
                        id: encounterId,
                        hostId: user.uid,
                        hostName: user.displayName || 'Mestre',
                        phase: updates.phase || phase,
                        round: updates.round || round,
                        turnIndex: updates.turnIndex !== undefined ? updates.turnIndex : turnIndex,
                        combatants: finalCombatants,
                        lastUpdate: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.error("Erro ao sincronizar estado:", e);
        }
    }, [encounterId, isOnline, user?.uid, user?.displayName, phase, round, turnIndex, combatants, dedupeCombatants, mode]);

    const addNotification = useCallback((notif: Omit<CombatNotification, 'id' | 'timestamp'>) => {
        const newNotif: CombatNotification = {
            ...notif,
            id: `notif_${Date.now()}_${Math.random()}`,
            timestamp: Date.now()
        };
        setCombatNotifications(prev => [...prev.slice(-19), newNotif]);
        setTimeout(() => {
            setCombatNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 10000);
    }, []);

    // --- Listeners ---
    useEffect(() => {
        if (!user || !encounterId) return;

        if (mode === 'master') {
            const docRef = doc(db, 'encounters', encounterId);
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    isRemoteUpdate.current = true;
                    setEncounterTitle(data.title || 'Encontro');
                    setPhase(data.phase || 'preparation');
                    setRound(data.round || 1);
                    setTurnIndex(data.turnIndex || 0);
                    setIsOnline(data.isOnline || false);
                    setCombatants(dedupeCombatants(data.combatants || []));
                } else {
                    router.push('/confrontos');
                }
                setLoading(false);
            });

            // Logs listener
            const logsRef = collection(db, 'encounters', encounterId, 'logs');
            const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(20));
            const unsubLogs = onSnapshot(qLogs, (snapshot) => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CombatNotification[];
                setCombatNotifications(logs);
                const latestByChar: Record<string, CombatNotification> = {};
                logs.forEach(log => {
                    if (!latestByChar[log.characterId] && (Date.now() - log.timestamp) < 45000) {
                        latestByChar[log.characterId] = log;
                    }
                });
                setNotificationsMap(latestByChar);
            });

            // Global Monsters/NPCs
            const unsubMonsters = onSnapshot(collection(db, 'monsters'), (s) => setDbMonsters(s.docs.map(d => ({ id: d.id, ...d.data() }))));
            const unsubNpcs = onSnapshot(collection(db, 'npcs'), (s) => setDbStandardNpcs(s.docs.map(d => ({ id: d.id, ...d.data() }))));

            return () => {
                unsubscribe();
                unsubLogs();
                unsubMonsters();
                unsubNpcs();
            };
        } else {
            // PLAYER MODE: Listen to Arena
            const sessionRef = doc(db, 'arenas_online', encounterId);
            const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    isRemoteUpdate.current = true;
                    setEncounterTitle(data.title || 'Arena Online');
                    setPhase(data.phase || 'preparation');
                    setRound(data.round || 1);
                    setTurnIndex(data.turnIndex || 0);
                    setCombatants(dedupeCombatants(data.combatants || []));
                    setHostInfo({ id: data.hostId, name: data.hostName });
                    setIsOnline(true);
                } else {
                    // Sessão encerrada ou não encontrada
                    setEncounterTitle('Sessão Encerrada');
                }
                setLoading(false);
            }, (err) => {
                console.error("Erro ao seguir arena:", err);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [encounterId, user, router, dedupeCombatants, mode]);

    // Character Fetcher
    useEffect(() => {
        if (!user) return;
        const fetchChars = async () => {
            setCharactersLoading(true);
            try {
                const { query, where, getDocs } = await import('firebase/firestore');
                const q = query(collection(db, 'personagens'), where('ownerId', '==', user.uid));
                const snap = await getDocs(q);
                setMyCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) { console.error("Error fetching characters", e); }
            finally { setCharactersLoading(false); }
        };
        fetchChars();
    }, [user]);

    // --- Background Sync: Arena <-> Ficha ---
    useEffect(() => {
        if (!user || !encounterId || mode !== 'player' || combatants.length === 0) return;

        const myCombatant = combatants.find(c => c.ownerId === user.uid && c.type === 'player' && c.externalId);
        if (!myCombatant || !myCombatant.externalId) return;

        const charRef = doc(db, 'personagens', myCombatant.externalId);

        // SYNC: FICHA -> ARENA (Listener na ficha)
        const unsubscribeChar = onSnapshot(charRef, async (docSnap) => {
            if (docSnap.exists()) {
                const charData = docSnap.data();
                let needsUpdate = false;
                const updates: any = {};

                // 1. HP Sync (Ficha -> Arena se mudou na ficha por ação do jogador)
                if (charData.currentHp !== myCombatant.hp) {
                    updates.hp = charData.currentHp;
                    needsUpdate = true;
                }

                // 2. Effects/Conditions Sync (Simplificado)
                const fichaEffects = [
                    ...(charData.activeEffects || []),
                    ...(charData.conditions || [])
                ];

                const currentArenaIds = myCombatant.statusEffects.map(e => e.id);
                const hasMismatch = fichaEffects.some(id => !currentArenaIds.includes(id)) ||
                    currentArenaIds.some(id => ['rage', 'poisoned', 'grappled'].includes(id) && !fichaEffects.includes(id));

                if (hasMismatch) {
                    // Logic to rebuild statusEffects
                    const newStatusEffects = [...myCombatant.statusEffects];
                    fichaEffects.forEach(id => {
                        if (!currentArenaIds.includes(id)) {
                            newStatusEffects.push({ id, name: id, duration: 10 });
                        }
                    });
                    // Filter out removed ones (controlled by sheet)
                    updates.statusEffects = newStatusEffects.filter(e =>
                        !(['rage', 'poisoned', 'grappled'].includes(e.id)) || fichaEffects.includes(e.id)
                    );
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await syncState({ combatants: [{ ...myCombatant, ...updates }] });
                }
            }
        });

        return () => unsubscribeChar();
    }, [encounterId, user?.uid, mode, combatants, syncState]);

    // Custom NPCs
    useEffect(() => {
        if (!user) return;
        const fetchCustomNpcs = async () => {
            const snap = await getDoc(doc(db, 'custom_npcs', user.uid));
            if (snap.exists()) setCustomNpcs(snap.data().npcs || []);
        };
        fetchCustomNpcs();
    }, [user]);

    // --- Actions ---
    const updateHP = useCallback(async (cid: string, amount: number) => {
        setCombatants(prev => {
            const combatant = prev.find(c => c.id === cid);
            if (!combatant) return prev;

            const newHP = Math.max(0, Math.min(combatant.maxHp, combatant.hp + amount));
            const updated = prev.map(c =>
                c.id === cid ? { 
                    ...c, 
                    hp: newHP, 
                    status: newHP === 0 ? (c.type === 'player' ? 'unconscious' : 'dead') : 'active' 
                } as Combatant : c
            );

            // Trigger sync with the newly calculated array
            syncState({ combatants: updated });

            // Player sheet sync
            if (combatant.type === 'player' && combatant.externalId) {
                updateDoc(doc(db, 'personagens', combatant.externalId), { currentHp: newHP })
                    .catch(e => console.error(`HP sync failed`, e));
            }

            return updated;
        });
    }, [syncState]);

    const nextTurn = useCallback(() => {
        let nIdx = turnIndex + 1;
        let nRound = round;
        if (nIdx >= combatants.length) {
            nIdx = 0;
            nRound++;
        }
        setTurnIndex(nIdx);
        setRound(nRound);
        syncState({ turnIndex: nIdx, round: nRound });
    }, [turnIndex, round, combatants.length, syncState]);

    const startCombat = useCallback(() => {
        const updated = combatants.map(c => {
            if (c.type !== 'player' && (c.initiative === 0 || c.initiative === -1)) {
                const roll = Math.floor(Math.random() * 20) + 1;
                const bonus = (c as any).initiativeBonus || 0;
                return { ...c, initiative: roll + bonus };
            }
            return c;
        }).sort((a, b) => b.initiative - a.initiative);

        setCombatants(updated);
        setPhase('combat');
        setRound(1);
        setTurnIndex(0);
        syncState({ combatants: updated, phase: 'combat', round: 1, turnIndex: 0 });
    }, [combatants, syncState]);

    const toggleOnlineCombat = useCallback(async () => {
        if (!user || !encounterId) return;
        const ns = !isOnline;
        setIsOnline(ns);
        await updateDoc(doc(db, 'encounters', encounterId), { isOnline: ns });
        if (ns) await syncState({ isOnline: true }); // trigger arena creation
    }, [user, encounterId, isOnline, syncState]);

    const removeCombatant = useCallback(async (cid: string) => {
        setCombatants(prev => {
            const updated = prev.filter(c => c.id !== cid);
            syncState({ combatants: updated });
            return updated;
        });
    }, [syncState]);

    const addCombatant = useCallback(async (entry: Omit<Combatant, 'id' | 'status' | 'statusEffects'>) => {
        setCombatants(prev => {
            const newEntry: Combatant = {
                ...entry,
                id: Math.random().toString(36).substr(2, 9),
                status: 'active',
                statusEffects: []
            };
            const updated = [...prev, newEntry];
            syncState({ combatants: updated });
            return updated;
        });
    }, [syncState]);

    const applyClassEffectToCombatant = useCallback(async (combatantId: string, effect: any) => {
        setCombatants(prev => {
            const updated = prev.map(c => {
                if (c.id !== combatantId) return c;
                const has = (c.statusEffects || []).some(se => se.id === effect.id);
                if (has) return c;
                return {
                    ...c,
                    statusEffects: [...(c.statusEffects || []), { id: effect.id, name: effect.name || effect.id, duration: effect.duration || 1 }]
                } as Combatant;
            });
            syncState({ combatants: updated });

            const combatant = updated.find(c => c.id === combatantId);
            if (combatant?.externalId) {
                (async () => {
                    try {
                        const charRef = doc(db, 'personagens', combatant.externalId);
                        const charSnap = await getDoc(charRef);
                        if (charSnap.exists()) {
                            const activeEffects = charSnap.data().activeEffects || [];
                            if (!activeEffects.includes(effect.id)) {
                                await updateDoc(charRef, { activeEffects: [...activeEffects, effect.id] });
                            }
                        }
                    } catch (e) { console.error("Effect sync to char failed", e); }
                })();
            }
            return updated;
        });
    }, [syncState]);

    const removeClassEffectFromCombatant = useCallback(async (combatantId: string, effectId: string) => {
        setCombatants(prev => {
            const updated = prev.map(c => {
                if (c.id !== combatantId) return c;
                return { ...c, statusEffects: (c.statusEffects || []).filter(se => se.id !== effectId) } as Combatant;
            });
            syncState({ combatants: updated });

            const combatant = updated.find(c => c.id === combatantId);
            if (combatant?.externalId) {
                (async () => {
                    try {
                        const charRef = doc(db, 'personagens', combatant.externalId);
                        const charSnap = await getDoc(charRef);
                        if (charSnap.exists()) {
                            const activeEffects = (charSnap.data().activeEffects || []).filter((e: string) => e !== effectId);
                            await updateDoc(charRef, { activeEffects });
                        }
                    } catch (e) { console.error("Effect remove from char failed", e); }
                })();
            }
            return updated;
        });
    }, [syncState]);

    const handleJoinBattle = useCallback(async (character: Partial<Combatant>) => {
        if (!encounterId) return;
        try {
            const sessionRef = doc(db, 'arenas_online', encounterId);
            const arenaSnap = await getDoc(sessionRef);
            if (!arenaSnap.exists()) throw new Error("Arena não encontrada");

            const currentCombatants = arenaSnap.data().combatants || [];
            const newComb: Combatant = {
                id: character.id || `char_${Date.now()}`,
                externalId: character.externalId || '',
                ownerId: user?.uid,
                ownerName: user?.displayName || 'Jogador',
                name: character.name || 'Herói',
                type: 'player',
                hp: character.hp || 10,
                maxHp: character.maxHp || 10,
                initiative: character.initiative || 0,
                status: 'active',
                ac: character.ac || 10,
                class: character.class || '',
                level: character.level || 1,
                statusEffects: [],
            };

            const exists = currentCombatants.findIndex((c: any) =>
                (c.externalId && c.externalId === newComb.externalId) ||
                (c.ownerId === user?.uid && c.name === newComb.name)
            );

            let finalCombatants;
            if (exists !== -1) {
                finalCombatants = [...currentCombatants];
                finalCombatants[exists] = { ...finalCombatants[exists], ...newComb };
            } else {
                finalCombatants = [...currentCombatants, newComb];
            }

            finalCombatants.sort((a: any, b: any) => b.initiative - a.initiative);
            await updateDoc(sessionRef, { combatants: finalCombatants });

            // Registrar encontro ativo na ficha do personagem para logs/balõezinhos
            if (character.externalId) {
                const charRef = doc(db, 'personagens', character.externalId);
                await updateDoc(charRef, { activeEncounterId: encounterId });
            }

            setCombatants(finalCombatants);
        } catch (e) {
            console.error("Join battle failed", e);
            throw e;
        }
    }, [encounterId, user, setCombatants]);

    return {
        // State
        phase, setPhase,
        combatants, setCombatants,
        round, setRound,
        turnIndex, setTurnIndex,
        loading, encounterTitle,
        combatNotifications, setCombatNotifications,
        isOnline, hostInfo,
        hpAdjustmentValues, sethpAdjustmentValues,
        healAdjustmentValues, setHealAdjustmentValues,
        notificationsMap,
        characterInfo, setCharacterInfo,
        dbMonsters, dbStandardNpcs, customNpcs, myCharacters,
        charactersLoading,

        // Modals
        isAddModalOpen, setIsAddModalOpen,
        isXPModalOpen, setIsXPModalOpen,
        isClassFxOpen, setIsClassFxOpen,
        classFxTarget, setClassFxTarget,
        confirmCureModal, setConfirmCureModal,
        confirmRemoveModal, setConfirmRemoveModal,
        confirmResetModal, setConfirmResetModal,
        monsterSheet, setMonsterSheet,

        // Actions
        updateHP,
        nextTurn,
        syncState,
        startCombat,
        toggleOnlineCombat,
        removeCombatant,
        addCombatant,
        applyClassEffectToCombatant,
        removeClassEffectFromCombatant,
        handleJoinBattle
    };
}
