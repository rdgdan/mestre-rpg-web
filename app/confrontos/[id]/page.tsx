'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
    doc,
    onSnapshot,
    updateDoc,
    setDoc,
    collection,
    getDoc
} from 'firebase/firestore';
import Modal from '@/components/Modal';
import { translateMonster } from '@/lib/monster-translator';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { npcTemplates } from '@/lib/npc-combatants-data';
import { CLASS_EFFECTS as SHARED_CLASS_EFFECTS, COMMON_CONDITIONS as SHARED_CONDITIONS, getCategorizedGlobalConditions } from '@/lib/effects-conditions';

// --- Interfaces ---
interface StatusEffect {
    id: string;
    name: string;
    duration: number;
}

interface Combatant {
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
}

// --- Mapeamento de IDs para Nomes Exibidos ---
const EFFECT_NAMES_MAP: Record<string, string> = {
    'rage': 'Fúria',
    'reckless': 'Ataque Temerário',
    'inspiration': 'Inspiração Bárdica',
    'counter-charm': 'Contra-encanto',
    'bless': 'Bênção',
    'sanctuary': 'Santuário',
    'shield-faith': 'Escudo da Fé',
    'wild-shape': 'Forma Selvagem',
    'barkskin': 'Pele de Árvore',
    'action-surge': 'Surto de Ação',
    'second-wind': 'Retomada de Fôlego',
    'indomitable': 'Indomável',
    'evasion': 'Evasão',
    'uncanny-dodge': 'Esquiva Sobrenatural',
    'sneak-attack': 'Ataque Furtivo',
    'flurry': 'Rajada de Golpes',
    'patient-defense': 'Defesa Paciente',
    'stunning-strike': 'Ataque Atordoante',
    'paralyzed-ki': 'Ki Bloqueado',
    'lay-hands': 'Mãos Curadoras',
    'divine-smite': 'Destruição Divina',
    'aura-protection': 'Aura de Proteção',
    'wrathful-smite': 'Golpe de Ira Divina',
    'entangle': 'Enredar',
    'knocked-down': 'Derribado',
    'enfeiticado': 'Enfeitiçado',
};

const getEffectDisplayName = (id: string, fallback: string = id): string => {
    return EFFECT_NAMES_MAP[id] || fallback;
};

export default function ConfrontoDetalhesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    // Garantir unicidade por `externalId` (preferência) ou `id`
    const dedupeCombatants = (arr: Combatant[]) => {
        const map = new Map<string, Combatant>();
        for (const c of arr || []) {
            const key = String(c.externalId || c.id);
            // o último vence (dados mais recentes)
            map.set(key, c);
        }
        return Array.from(map.values());
    };

    // --- Estados Principais ---
    const [phase, setPhase] = useState<'preparation' | 'initiative' | 'combat'>('preparation');
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [round, setRound] = useState(1);
    const [turnIndex, setTurnIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [encounterTitle, setEncounterTitle] = useState('Encontro');

    // --- Modais ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [isClassFxOpen, setIsClassFxOpen] = useState(false);
    const [classFxTarget, setClassFxTarget] = useState<Combatant | null>(null);
    const [characterInfo, setCharacterInfo] = useState<Record<string, { class: string; level: number }>>({});
    const [hpAdjustmentValues, sethpAdjustmentValues] = useState<Record<string, string>>({});
    const [healAdjustmentValues, setHealAdjustmentValues] = useState<Record<string, string>>({});

    // --- Novo Combatente Form ---
    const [newCombatant, setNewCombatant] = useState({
        name: '',
        hp: '' as any,
        initiative: '' as any,
        type: 'monster' as 'monster' | 'npc' | 'player',
        ac: '' as any,
        cr: '0',
        xp: '' as any,
        quantity: 1,
        externalId: '',
        ownerId: '',
        ownerName: ''
    });

    const [isOnline, setIsOnline] = useState(false);
    const [myCharacters, setMyCharacters] = useState<any[]>([]);
    const [customNpcs, setCustomNpcs] = useState<any[]>([]);

    // --- NEW: Carregar monstros do Firestore ---
    const [dbMonsters, setDbMonsters] = useState<any[]>([]);
    const [dbStandardNpcs, setDbStandardNpcs] = useState<any[]>([]);

    // Busca de monstros/NPCs
    const [monsterSearch, setMonsterSearch] = useState('');
    const [showMonsterResults, setShowMonsterResults] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const searchRef = useRef<HTMLDivElement | null>(null);

    // Carregamento de personagens do jogador
    const [charactersLoading, setCharactersLoading] = useState(false);

    // Novo efeito customizado
    const [newEffect, setNewEffect] = useState({ name: '', duration: '', category: 'benefit' as 'benefit' | 'debuff' });
    // Aba ativa do modal de efeitos
    const [effectTab, setEffectTab] = useState<'all' | 'benefits' | 'debuffs'>('all');
    // Busca de efeitos
    const [effectSearchQuery, setEffectSearchQuery] = useState('');

    // Usar efeitos compartilhados do arquivo centralizado
    const CLASS_EFFECTS = SHARED_CLASS_EFFECTS;

    useEffect(() => {
        // 1. Monstros
        const qMonsters = collection(db, 'monsters');
        const unsubMonsteers = onSnapshot(qMonsters, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbMonsters(loaded);
        });

        // 2. NPCs Padrão (Guarda, Cultista, etc.)
        const qNpcs = collection(db, 'npcs');
        const unsubNpcs = onSnapshot(qNpcs, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbStandardNpcs(loaded);
        });

        return () => {
            unsubMonsteers();
            unsubNpcs();
        };
    }, []);

    const normalizeText = (s?: unknown) => String(s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const filteredMonsters = useMemo(() => {
        const search = normalizeText(monsterSearch);
        if (!search) return [];

        if (newCombatant.type === 'npc') {
            const locals = (npcTemplates && Array.isArray(npcTemplates)) ? npcTemplates : [];
            const customs = (customNpcs && Array.isArray(customNpcs)) ? customNpcs : [];

            // --- MERGE LOGIC FOR NPCs: DB Standard + Custom + Local (fallback) ---
            const dbMap = new Map(dbStandardNpcs.map(n => [n.name.toLowerCase().trim(), n]));
            const localOnly = locals.filter(n => !dbMap.has(n.name.toLowerCase().trim()));

            const combined = [...dbStandardNpcs, ...localOnly, ...customs];

            return combined.filter(n => {
                if (!n || !n.name) return false;
                const nName = String(n.name).toLowerCase();
                const nDesc = String(n.description || '').toLowerCase();
                const nRace = String(n.race || '').toLowerCase();
                const nRole = String(n.role || '').toLowerCase();

                return nName.includes(search) ||
                    nDesc.includes(search) ||
                    nRace.includes(search) ||
                    nRole.includes(search);
            }).slice(0, 5);
        }

        // --- MERGE LOGIC: Database wins over Local ---
        // 1. Create a map of normalized names from DB
        const dbMap = new Map(dbMonsters.map(m => [m.name.toLowerCase().trim(), m]));

        // 2. Start with local monsters, excluding those present in DB
        const localOnly = dndMonsters.filter(m => !dbMap.has(m.name.toLowerCase().trim()));

        // 3. Combine: DB Monsters + Local Monsters (not in DB)
        const combinedMonsters = [...dbMonsters, ...localOnly];

        return combinedMonsters.filter(m => {
            if (!m || !m.name) return false;

            const translated = translateMonster({
                name: m.name,
                type: typeof m.type === 'string' ? m.type : (m.type?.type || m.type),
            });

            const namePT = translated?.name || m.name;
            const typeRaw = (m && typeof m.type === 'object' && m.type !== null)
                ? (m.type.type || Object.values(m.type).join(', '))
                : m.type;
            const typePT = translated?.type || typeRaw;

            const nameHit = normalizeText(m.name).includes(search) || normalizeText(namePT).includes(search);
            const typeHit = normalizeText(typeRaw).includes(search) || normalizeText(typePT).includes(search);

            return nameHit || typeHit;
        }).slice(0, 5);
    }, [monsterSearch, newCombatant.type, customNpcs, dbMonsters]);

    const handleSelectMonster = (monster: any) => {
        const translated = translateMonster({
            name: monster.name,
            type: typeof monster.type === 'string' ? monster.type : (monster.type?.type || monster.type),
        });

        const displayName = translated?.name || monster.name;

        setNewCombatant({
            ...newCombatant,
            name: displayName,
            hp: monster.hp,
            ac: monster.ac,
            cr: monster.challenge || monster.cr,
            xp: monster.xp ?? '',
            // Mantém o tipo atual (monster ou npc)
            type: newCombatant.type,
            externalId: monster.id || '',
        });
        setMonsterSearch(displayName);
        setShowMonsterResults(false);
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowMonsterResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Carregar Dados do Firestore ---
    useEffect(() => {
        if (authLoading) return;
        if (!user || !id) {
            if (!user && !authLoading) router.push('/login');
            return;
        }

        const docRef = doc(db, 'encounters', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setEncounterTitle(data.title || 'Encontro');
                setCombatants(dedupeCombatants(data.combatants || []));
                setPhase(data.phase || 'preparation');
                setRound(data.round || 1);
                setTurnIndex(data.turnIndex || 0);
                setIsOnline(data.isOnline || false);
            } else {
                console.error("Confronto não encontrado");
                router.push('/confrontos');
            }
            setLoading(false);
        }, (err) => {
            console.error("Erro ao carregar confronto:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, id, router, authLoading]);

    // --- Sincronizar Jogadores que Entraram via Arena ---
    useEffect(() => {
        if (!id || !isOnline) return;

        const arenaRef = doc(db, 'arenas_online', id);
        const unsubscribe = onSnapshot(arenaRef, (arenaSnap) => {
            if (arenaSnap.exists()) {
                const arenaCombatants = arenaSnap.data().combatants || [];
                
                // Mescla combatentes: mantém os da encounters, mas atualiza/adiciona os de arenas_online
                setCombatants((currentCombatants) => {
                    const merged = [...currentCombatants];
                    
                    arenaCombatants.forEach((arenaComb: Combatant) => {
                        const existingIndex = merged.findIndex(c => 
                            c.id === arenaComb.id || c.externalId === arenaComb.externalId
                        );
                        
                        if (existingIndex > -1) {
                            // Atualiza existente com dados da arena (ex: HP, status)
                            merged[existingIndex] = { ...merged[existingIndex], ...arenaComb };
                        } else {
                            // Adiciona novo (jogador que entrou via arena)
                            merged.push(arenaComb);
                        }
                    });
                    
                    return dedupeCombatants(merged);
                });
            }
        }, (err) => {
            console.warn("Erro ao sincronizar arenas_online:", err);
        });

        return () => unsubscribe();
    }, [id, isOnline]);

    // --- Sincronização Proativa (Observador de Estado) ---
    useEffect(() => {
        if (!isOnline || !id || loading) return;

        // Timer para evitar excesso de escritas (debounce simples)
        const timer = setTimeout(() => {
            syncState({
                phase,
                round,
                turnIndex,
                combatants,
                isOnline
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [phase, round, turnIndex, combatants, isOnline]);

    // --- Carregar Personagens para aba de Jogador ---
    useEffect(() => {
        if (!user || newCombatant.type !== 'player' || myCharacters.length > 0) return;

        const fetchChars = async () => {
            setCharactersLoading(true);
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const q = query(collection(db, 'personagens'), where('ownerId', '==', user.uid));
                const snap = await getDocs(q);
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setMyCharacters(list);
            } catch (err) {
                console.error("Erro ao carregar personagens:", err);
            } finally {
                setCharactersLoading(false);
            }
        };

        fetchChars();
    }, [user, newCombatant.type, myCharacters.length]);

    // --- Carregar NPCs Customizados para aba de NPC ---
    useEffect(() => {
        if (!user || newCombatant.type !== 'npc' || customNpcs.length > 0) return;

        const fetchNpcs = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const docRef = doc(db, 'custom_npcs', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCustomNpcs(docSnap.data().npcs || []);
                }
            } catch (err) {
                console.error("Erro ao carregar NPCs customizados:", err);
            }
        };

        fetchNpcs();
    }, [user, newCombatant.type, customNpcs.length]);

    // --- Carregar informações de classe dos personagens jogadores ---
    useEffect(() => {
        if (loading) return;

        const playerCombatants = combatants.filter(c => c.type === 'player' && c.externalId);
        const missingIds = playerCombatants
            .map(c => c.externalId!)
            .filter(id => !characterInfo[id]);

        if (missingIds.length === 0) return;

        const fetchCharacterData = async () => {
            const newInfo: Record<string, { class: string; level: number }> = {};
            
            for (const charId of missingIds) {
                try {
                    const docRef = doc(db, 'personagens', charId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        newInfo[charId] = {
                            class: data.class || 'Guerreiro',
                            level: data.level || 1
                        };
                    }
                } catch (err) {
                    console.error(`Erro ao buscar personagem ${charId}:`, err);
                }
            }

            if (Object.keys(newInfo).length > 0) {
                setCharacterInfo(prev => ({ ...prev, ...newInfo }));
            }
        };

        fetchCharacterData();
    }, [combatants, loading, characterInfo]);

    // --- Listener para Sincronizar Efeitos de Personagens ---
    useEffect(() => {
        if (loading || combatants.length === 0) return;

        const unsubscribers: Array<() => void> = [];

        // Para cada personagem jogador no combate
        combatants.filter(c => c.type === 'player' && c.externalId).forEach(combatant => {
            try {
                const charRef = doc(db, 'personagens', combatant.externalId!);
                const unsubscribe = onSnapshot(charRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const charData = snapshot.data();
                        const activeEffects = charData.activeEffects || [];

                        // Sincronizar efeitos da ficha para o combate
                        setCombatants(prev => {
                            return prev.map(c => {
                                if (c.externalId === combatant.externalId) {
                                    // Converter activeEffects (IDs) em StatusEffects
                                    const statusEffects: StatusEffect[] = activeEffects.map((effectId: string) => ({
                                        id: effectId,
                                        name: effectId,
                                        duration: 10
                                    }));
                                    return { ...c, statusEffects };
                                }
                                return c;
                            });
                        });
                    }
                });
                unsubscribers.push(unsubscribe);
            } catch (err) {
                console.error('[SYNC] Erro ao ouvir mudanças da ficha:', err);
            }
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [combatants.filter(c => c.type === 'player' && c.externalId).map(c => c.externalId).join(','), loading]);

    // --- Sincronização Automática ---
    const syncState = useCallback(async (updates: any) => {
        if (!id) return;
        try {
            // Função recursiva para sanitizar objetos profundos
            const deepSanitize = (obj: any): any => {
                if (obj === null || obj === undefined) return null;
                
                if (Array.isArray(obj)) {
                    return obj.map(item => deepSanitize(item));
                }
                
                if (typeof obj === 'object') {
                    const sanitized: any = {};
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        if (value !== undefined) {
                            sanitized[key] = deepSanitize(value);
                        }
                    });
                    return sanitized;
                }
                
                return obj;
            };

            // Sanitiza o objeto updates completamente
            const sanitizedUpdates = deepSanitize(updates);

            // Dedupe antes de salvar
            if (sanitizedUpdates.combatants) {
                sanitizedUpdates.combatants = dedupeCombatants(sanitizedUpdates.combatants).map(c => deepSanitize(c));
            }

            await updateDoc(doc(db, 'encounters', id), sanitizedUpdates);

            // Se a arena estiver online, sincroniza com a coleção de sessões compartilhadas
            if (isOnline || updates.isOnline) {
                const sessionRef = doc(db, 'arenas_online', id);

                // Obtém combatentes atuais do arenas_online para manter jogadores que entraram via arena
                let mergedCombatants = updates.combatants || combatants || [];
                try {
                    const arenaSnap = await getDoc(sessionRef);
                    if (arenaSnap.exists()) {
                        const arenaCombatants = arenaSnap.data().combatants || [];
                        // Adiciona combatentes que só existem em arenas_online (jogadores que entraram via arena)
                        arenaCombatants.forEach((arenaComb: any) => {
                            const exists = mergedCombatants.findIndex((c: any) => 
                                c.id === arenaComb.id || c.externalId === arenaComb.externalId
                            );
                            if (exists === -1) {
                                mergedCombatants.push(arenaComb);
                            }
                        });
                    }
                } catch (err) {
                    console.warn("Não foi possível ler arenas_online para merge", err);
                }

                // Sanitiza combatentes para o Firestore
                const sanitizedCombatants = dedupeCombatants(mergedCombatants).map((c: any) => {
                    const clean = { ...c };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });

                    // Garante que statusEffects exista para a Arena Online
                    if (!clean.statusEffects) clean.statusEffects = [];

                    return clean;
                });

                // Reordena por iniciativa
                sanitizedCombatants.sort((a: any, b: any) => b.initiative - a.initiative);

                if (user?.uid) {
                    await setDoc(sessionRef, {
                        id,
                        hostId: user.uid,
                        hostName: user.displayName || 'Mestre',
                        phase: updates.phase || phase,
                        round: updates.round || round,
                        turnIndex: updates.turnIndex !== undefined ? updates.turnIndex : turnIndex,
                        combatants: sanitizedCombatants,
                        lastUpdate: new Date().toISOString()
                    });
                }
            }
        } catch (err) {
            console.error("Erro ao sincronizar:", err);
        }
    }, [id, isOnline, user?.uid, phase, round, turnIndex]);

    // --- Ações de Combate ---
    const handleAddCombatant = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Math.min(Math.max(Number(newCombatant.quantity) || 1, 1), 20);
        const baseName = translateMonster(newCombatant.name) || 'Combatente';
        const entries: Combatant[] = [];

        for (let i = 0; i < qty; i++) {
            const suffix = qty > 1 ? ` ${i + 1}` : '';
            const entry: Combatant = {
                id: Math.random().toString(36).substr(2, 9),
                name: `${baseName}${suffix}`.trim(),
                type: newCombatant.type,
                hp: Number(newCombatant.hp) || 1,
                maxHp: Number(newCombatant.hp) || 1,
                initiative: Number(newCombatant.initiative) || 0,
                ac: Number(newCombatant.ac) || 10,
                cr: newCombatant.cr || '0',
                xp: newCombatant.xp === '' ? undefined : Number(newCombatant.xp) || newCombatant.xp,
                status: 'active',
                statusEffects: []
            };

            if (newCombatant.externalId) entry.externalId = `${newCombatant.externalId}${qty > 1 ? `-${i + 1}` : ''}`;
            if (newCombatant.ownerId) entry.ownerId = newCombatant.ownerId;
            if (newCombatant.ownerName) entry.ownerName = newCombatant.ownerName;

            entries.push(entry);
        }

        const updated = [...combatants, ...entries];
        setCombatants(updated);
        await syncState({ combatants: updated });
        setIsAddModalOpen(false);
        setNewCombatant({
            name: '',
            hp: '' as any,
            initiative: '' as any,
            type: 'monster',
            ac: '' as any,
            cr: '0',
            xp: '' as any,
            quantity: 1,
            externalId: '',
            ownerId: '',
            ownerName: ''
        });
        setMonsterSearch('');
    };

    const removeCombatant = async (cid: string) => {
        if (!confirm("Remover este combatente?")) return;
        const updated = combatants.filter(c => c.id !== cid);
        setCombatants(updated);
        await syncState({ combatants: updated });
    };

    const updateHP = async (cid: string, amount: number) => {
        const updated = combatants.map(c => {
            if (c.id === cid) {
                const newHP = Math.max(0, Math.min(c.maxHp, c.hp + amount));
                return { ...c, hp: newHP, status: (newHP === 0 && c.type !== 'player') ? 'dead' : 'active' } as Combatant;
            }
            return c;
        });
        setCombatants(updated);
        await syncState({ combatants: updated });
    };

    const startCombat = async () => {
        // Rolar iniciativas dos monstros e NPCs
        const updatedCombatants = combatants.map(c => {
            if (c.type === 'monster' || c.type === 'npc') {
                // Rolar d20 + modificador de DEX (assumindo DEX)
                const roll = Math.floor(Math.random() * 20) + 1; // d20
                const dexMod = -1; // Modificador genérico (pode ser melhorado)
                return {
                    ...c,
                    initiative: roll + dexMod
                };
            }
            // Jogadores mantêm iniciativa manual
            return c;
        });

        const sorted = [...updatedCombatants].sort((a, b) => b.initiative - a.initiative);
        setCombatants(sorted);
        setPhase('combat');
        setRound(1);
        setTurnIndex(0);
        await syncState({
            combatants: sorted,
            phase: 'combat',
            round: 1,
            turnIndex: 0
        });
    };

    const nextTurn = async () => {
        let newIdx = turnIndex + 1;
        let newRound = round;
        if (newIdx >= combatants.length) {
            newIdx = 0;
            newRound++;
        }
        setTurnIndex(newIdx);
        setRound(newRound);
        await syncState({ turnIndex: newIdx, round: newRound });
    };

    const resetCombat = async () => {
        if (!confirm("Resetar o combate? Isso voltará para fase de preparação.")) return;
        setPhase('preparation');
        setRound(1);
        setTurnIndex(0);
        await syncState({ phase: 'preparation', round: 1, turnIndex: 0 });
    };

    const finishCombat = () => {
        setIsXPModalOpen(true);
    };

    // --- Efeitos de Classe (Individual) ---
    const applyClassEffectToCombatant = useCallback(async (combatantId: string, effect: any) => {
        // Garantir que temos um objeto com id, name e duration
        const effectToApply: StatusEffect = {
            id: effect.id,
            name: effect.name || effect.id,
            duration: effect.duration || 1
        };
        
        const updated = combatants.map(c => {
            if (c.id !== combatantId) return c;
            const has = Array.isArray(c.statusEffects) && c.statusEffects.some(se => se.id === effectToApply.id);
            if (has) return c; // evita duplicata
            return { ...c, statusEffects: [...(c.statusEffects || []), effectToApply] } as Combatant;
        });
        setCombatants(updated);
        await syncState({ combatants: updated });
        
        // Sincronizar com a ficha do personagem se for vinculado
        const combatant = updated.find(c => c.id === combatantId);
        if (combatant?.externalId) {
            try {
                const charRef = doc(db, 'personagens', combatant.externalId);
                const charSnap = await getDoc(charRef);
                if (charSnap.exists()) {
                    const charData = charSnap.data();
                    const activeEffects = charData.activeEffects || [];
                    if (!activeEffects.includes(effectToApply.id)) {
                        await updateDoc(charRef, { activeEffects: [...activeEffects, effectToApply.id] });
                    }
                }
            } catch (err) {
                console.error('[SYNC] Erro ao aplicar efeito na ficha:', err);
            }
        }
    }, [combatants, syncState]);

    const removeClassEffectFromCombatant = useCallback(async (combatantId: string, effectId: string) => {
        const updated = combatants.map(c => {
            if (c.id !== combatantId) return c;
            return {
                ...c,
                statusEffects: (c.statusEffects || []).filter(se => se.id !== effectId)
            } as Combatant;
        });
        setCombatants(updated);
        await syncState({ combatants: updated });
        
        // Sincronizar com a ficha do personagem se for vinculado
        const combatant = combatants.find(c => c.id === combatantId);
        if (combatant?.externalId) {
            try {
                const charRef = doc(db, 'personagens', combatant.externalId);
                const charSnap = await getDoc(charRef);
                if (charSnap.exists()) {
                    const charData = charSnap.data();
                    const activeEffects = (charData.activeEffects || []).filter((e: string) => e !== effectId);
                    await updateDoc(charRef, { activeEffects });
                }
            } catch (err) {
                console.error('[SYNC] Erro ao remover efeito da ficha:', err);
            }
        }
    }, [combatants, syncState]);

    const toggleOnlineCombat = async () => {
        if (!user || !id) return;
        const newStatus = !isOnline;

        try {
            // 1. Atualizar o encontro local
            await updateDoc(doc(db, 'encounters', id), { isOnline: newStatus });
            setIsOnline(newStatus);

            if (newStatus) {
                // 2. Criar/Sincronizar com a arena online
                const sessionRef = doc(db, 'arenas_online', id);
                const sanitizedCombatants = combatants.map(c => {
                    const clean = { ...c };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                });

                await setDoc(sessionRef, {
                    id,
                    hostId: user.uid,
                    hostName: user.displayName || 'Mestre',
                    phase,
                    round,
                    turnIndex,
                    combatants: sanitizedCombatants,
                    lastUpdate: new Date().toISOString()
                });
                alert("Arena Online ATIVADA! 🌐 Os jogadores já podem entrar.");
            } else {
                alert("Arena Online desativada.");
            }
        } catch (err) {
            console.error("Erro ao alternar modo online:", err);
            alert("Erro ao configurar Arena Online.");
        }
    };

    const handleCopyArenaLink = () => {
        const url = `${window.location.origin}/arena/${id}`;
        navigator.clipboard.writeText(url);
        alert("Link da Arena copiado! 🔗");
    };

    const handleExitArena = () => {
        router.push('/confrontos');
    };

    // --- Cálculos de XP ---
    const totalXP = useMemo(() => {
        return combatants.reduce((acc, c) => {
            if (c.type === 'monster' || c.type === 'npc') {
                const crMap: Record<string, number> = {
                    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
                    '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900
                };
                return acc + (crMap[c.cr.toString()] || 0);
            }
            return acc;
        }, 0);
    }, [combatants]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 mb-4 text-4xl flex items-center justify-center animate-spin">🛡️</div>
                <p className="text-rpg-gold font-cinzel text-sm tracking-widest animate-pulse">PREPARANDO ARENA...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col font-lato">
            <header className="bg-rpg-panel p-3 sm:p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-40 backdrop-blur-md">
                <div className="container mx-auto flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={handleExitArena}
                            className="bg-rpg-dark/50 border border-rpg-gold/30 text-rpg-gold p-2 rounded-lg hover:bg-rpg-gold/10 transition-all shrink-0 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-sm sm:text-xl font-cinzel text-rpg-gold truncate font-bold">
                            {encounterTitle}
                        </h1>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                        {phase === 'preparation' ? (
                            <button
                                onClick={startCombat}
                                disabled={combatants.length < 2}
                                className="bg-rpg-gold text-rpg-dark px-3 sm:px-4 py-2 rounded font-bold font-cinzel text-xs sm:text-sm hover:bg-rpg-gold-light transition-all disabled:opacity-50 active:scale-95 shadow-md"
                            >
                                INICIAR <span className="hidden sm:inline">COMBATE</span> ⚔️
                            </button>
                        ) : (
                            <div className="flex gap-1.5 sm:gap-2">
                                <button onClick={resetCombat} className="bg-red-900/50 text-rpg-parchment px-2 sm:px-3 py-2 rounded text-xs hover:bg-red-900 transition-all font-cinzel border border-red-500/30 active:scale-95">
                                    RESET
                                </button>
                                <button onClick={finishCombat} className="bg-green-700 text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-bold font-cinzel hover:bg-green-600 transition-all active:scale-95 shadow-md">
                                    FINALIZAR 🏁
                                </button>
                            </div>
                        )}
                        <button
                            onClick={toggleOnlineCombat}
                            className={`px-3 py-2 rounded font-bold font-cinzel text-xs sm:text-sm transition-all active:scale-95 shadow-md border ${isOnline ? 'bg-purple-600 text-white border-purple-400 shadow-glow-purple/20' : 'bg-rpg-panel text-rpg-gold border-rpg-gold/30 opacity-60 hover:opacity-100'}`}
                            title={isOnline ? "Arena Online Ativa" : "Ativar Arena Online"}
                        >
                            {isOnline ? 'ONLINE 🌐' : 'OFFLINE 📡'}
                        </button>
                        {isOnline && (
                            <button
                                onClick={handleCopyArenaLink}
                                className="bg-rpg-panel border border-rpg-gold/30 text-rpg-gold p-2 rounded-lg hover:bg-rpg-gold/10 transition-all shrink-0 active:scale-95"
                                title="Copiar Link da Arena"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                            </button>
                        )}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-rpg-panel border border-rpg-gold/30 text-rpg-gold px-2.5 sm:px-3 py-2 rounded text-sm font-bold hover:bg-rpg-gold/10 transition-all active:scale-95 shrink-0"
                            title="Adicionar Combatente"
                        >
                            +
                        </button>
                    </div>
                </div>
            </header>

            {phase === 'combat' && (
                <div className="bg-rpg-gold/10 border-b border-rpg-gold/20 p-2 sm:p-3 flex justify-between items-center px-4 sm:px-6 sticky top-[61px] sm:top-[74px] z-30 backdrop-blur-sm">
                    <div className="font-cinzel text-[10px] sm:text-xs text-rpg-gold flex gap-3 sm:gap-6 items-baseline overflow-hidden">
                        <div className="shrink-0">RODADA: <span className="text-white text-base sm:text-xl font-bold">{round}</span></div>
                        <div className="truncate">TURNO: <span className="text-white text-base sm:text-xl font-bold uppercase">{combatants[turnIndex]?.name || '-'}</span></div>
                    </div>
                    <button
                        onClick={nextTurn}
                        className="bg-rpg-gold text-rpg-dark px-4 sm:px-6 py-2 rounded-full font-bold font-cinzel text-xs hover:bg-rpg-gold-light transition-all transform active:scale-95 shadow-lg shrink-0 whitespace-nowrap"
                    >
                        PRÓX. TURNO ›
                    </button>
                </div>
            )}

            <main className="container mx-auto p-3 sm:p-6 flex-grow pb-24">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 max-w-4xl mx-auto">
                    {combatants.map((c, index) => {
                        const hasEffects = c.statusEffects && c.statusEffects.length > 0;
                        const effectAnimationClass = hasEffects ? c.statusEffects.map(fx => {
                            if (fx.id === 'rage') return 'animate-rage';
                            if (fx.id === 'bless') return 'animate-bless';
                            if (fx.id === 'inspiration') return 'animate-inspiration';
                            return 'animate-effect-glow';
                        }).join(' ') : '';
                        
                        // Detectar se tem ambos benefícios e malefícios
                        const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
                        const commonConditionIds = ['caido', 'envenenado', 'atordoado', 'amedrontado', 'agarrado', 'incapacitado', 'invisivel', 'paralisado', 'petrificado', 'preso', 'inconsciente', 'cego', 'surdo', 'aterrorizado', 'exaurido', 'cansado', 'queimado', 'enfraquecido', 'fome', 'sangrando', 'ebrio', 'amaldicoado'];
                        const hasBenefits = hasEffects && c.statusEffects.some(se => benefitIds.includes(se.id) || (se as any).category === 'benefit');
                        const hasDebuffs = hasEffects && c.statusEffects.some(se => !benefitIds.includes(se.id) && (se as any).category !== 'benefit');
                        const hasBothEffects = hasBenefits && hasDebuffs;
                        const hasOnlyBenefits = hasBenefits && !hasDebuffs;
                        const hasOnlyDebuffs = hasDebuffs && !hasBenefits;
                        // Detectar se tem efeitos únicos (de classe) vs condições globais
                        const hasUniqueEffects = hasEffects && c.statusEffects.some(se => !commonConditionIds.includes(se.id));
                        const hasOnlyGlobalConditions = hasEffects && c.statusEffects.every(se => commonConditionIds.includes(se.id));
                        // Detectar se combatente está caído
                        const isFallen = c.statusEffects.some(se => se.id === 'caido');
                        
                        return (
                        <div
                            key={String(c.externalId || c.id)}
                            className={`
                                relative p-3 sm:p-5 rounded-xl transition-all duration-300
                                ${hasBothEffects ? 'border-l-[6px] border-l-green-500 border-r-[6px] border-r-red-500 border-t-2 border-b-2 border-t-purple-500/50 border-b-purple-500/50' : 'border-2'}
                                ${hasUniqueEffects && !hasOnlyGlobalConditions ? 'effect-unique' : ''}
                                ${isFallen ? 'fallen-animation' : ''}
                                ${phase === 'combat' && turnIndex === index ? 'bg-rpg-gold/15 border-rpg-gold shadow-glow-gold/20 scale-[1.01] z-10' : 
                                  hasBothEffects ? 'bg-gradient-to-r from-green-950/20 via-rpg-dark/50 to-red-950/20 shadow-lg' :
                                  hasOnlyBenefits ? 'bg-green-950/20 border-green-500/50 shadow-lg shadow-green-900/20' :
                                  hasOnlyDebuffs ? 'bg-orange-950/20 border-orange-500/50 shadow-lg shadow-orange-900/20' :
                                  c.type === 'player' ? 'bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-900/10' :
                                  c.type === 'npc' ? 'bg-yellow-950/20 border-yellow-600/30 shadow-lg shadow-yellow-900/10' :
                                  'bg-red-950/20 border-red-600/30 shadow-lg shadow-red-900/10'}
                                ${c.status === 'dead' ? 'opacity-40 grayscale blur-[0.5px]' : ''}
                            `}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3 sm:gap-5 flex-1 w-full">
                                    <div className="bg-rpg-dark border border-rpg-gold/30 w-10 h-10 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-cinzel text-rpg-gold font-bold shrink-0 shadow-inner">
                                        {c.initiative}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="text-base sm:text-xl font-cinzel text-rpg-parchment leading-tight truncate group-hover:text-rpg-gold transition-colors">{c.name}</h3>
                                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs uppercase font-bold tracking-widest mt-1">
                                            <span className={`px-1.5 py-0.5 rounded border ${
                                                c.type === 'player' ? 'border-blue-500/50 text-blue-400 bg-blue-950/30' : 
                                                c.type === 'npc' ? 'border-yellow-600/50 text-yellow-400 bg-yellow-950/30' :
                                                'border-red-600/50 text-red-400 bg-red-950/30'
                                            }`}>
                                                {c.type === 'monster' ? '👹 MONSTRO' : c.type === 'player' ? '🛡️ JOGADOR' : '⚔️ NPC'}
                                            </span>
                                            {c.ac && <span className="bg-rpg-dark/50 px-1.5 py-0.5 rounded border border-white/5 text-rpg-grey">CA {c.ac}</span>}
                                            {c.cr && <span className="bg-rpg-dark/50 px-1.5 py-0.5 rounded border border-white/5 text-rpg-grey">CR {c.cr}</span>}
                                            {hasEffects && (
                                                <span className="px-1.5 py-0.5 rounded border border-purple-500/50 text-purple-300 bg-purple-950/30 animate-pulse">
                                                    ✨ {c.statusEffects.length} EFEITO{c.statusEffects.length > 1 ? 'S' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full pt-3 border-t border-white/5">
                                    {/* Barra de Vida */}
                                    <div className="w-full">
                                        <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1.5 font-medieval tracking-widest">
                                            <span className="text-rpg-grey">VIDA: <span className="text-rpg-parchment">{c.hp} / {c.maxHp}</span></span>
                                            <span className={c.hp / c.maxHp < 0.3 ? 'text-red-500 animate-pulse' : 'text-rpg-grey'}>{Math.round((c.hp / c.maxHp) * 100)}%</span>
                                        </div>
                                        <div className="h-2 sm:h-3 w-full bg-rpg-dark/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <div
                                                className={`h-full transition-all duration-700 rounded-full ${c.hp / c.maxHp > 0.5 ? 'bg-gradient-to-r from-green-600 to-green-400' : c.hp / c.maxHp > 0.2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                                                style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Exibição de Efeitos Ativos */}
                                    {hasEffects && (
                                        (() => {
                                            const benefits = c.statusEffects.filter(se => {
                                                const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
                                                return benefitIds.includes(se.id) || (se as any).category === 'benefit';
                                            });
                                            const debuffs = c.statusEffects.filter(se => !benefits.includes(se));
                                            
                                            // Se houver ambos, exibir card split com metade verde e metade vermelha
                                            if (benefits.length > 0 && debuffs.length > 0) {
                                                return (
                                                    <div className="w-full rounded-lg overflow-hidden border-2 border-purple-500/50">
                                                        <div className="flex h-12">
                                                            {/* Lado Esquerdo - Benefícios (Verde) */}
                                                            <div className="flex-1 bg-gradient-to-br from-green-900/50 to-green-900/20 border-r border-green-600/50 px-2 py-1 overflow-y-auto flex flex-col justify-center">
                                                                <div className="text-[9px] text-green-400 font-bold uppercase mb-0.5">✦ Ben.</div>
                                                                <div className="space-y-0">
                                                                    {benefits.map(se => (
                                                                        <div key={se.id} className="text-[14px] text-green-300 font-bold truncate leading-tight">
                                                                            {getEffectDisplayName(se.id, se.name)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Lado Direito - Malefícios (Vermelho) */}
                                                            <div className="flex-1 bg-gradient-to-br from-red-900/50 to-red-900/20 px-2 py-1 overflow-y-auto flex flex-col justify-center">
                                                                <div className="text-[9px] text-red-400 font-bold uppercase mb-0.5">⚠ Mal.</div>
                                                                <div className="space-y-0">
                                                                    {debuffs.map(se => (
                                                                        <div key={se.id} className="text-[14px] text-red-300 font-bold truncate leading-tight">
                                                                            {getEffectDisplayName(se.id, se.name)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            // Se apenas benefícios
                                            if (benefits.length > 0) {
                                                return (
                                                    <div className="w-full">
                                                        <div className="text-[9px] text-rpg-gold font-cinzel tracking-wider uppercase mb-1.5 opacity-70">Efeitos Ativos</div>
                                                        <div className="space-y-1">
                                                            {benefits.map(se => (
                                                                <div key={se.id} className="p-2 rounded bg-gradient-to-r from-green-900/40 to-green-900/20 border border-green-600/50 text-green-300 text-[12px] font-bold truncate flex items-center gap-1.5">
                                                                    <span>✦</span>
                                                                    <span className="truncate">{getEffectDisplayName(se.id, se.name)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            // Se apenas malefícios
                                            return (
                                                <div className="w-full">
                                                    <div className="text-[9px] text-rpg-gold font-cinzel tracking-wider uppercase mb-1.5 opacity-70">Efeitos Ativos</div>
                                                    <div className="space-y-1">
                                                        {debuffs.map(se => (
                                                            <div key={se.id} className="p-2 rounded bg-gradient-to-r from-red-900/40 to-red-900/20 border border-red-600/50 text-red-300 text-[12px] font-bold truncate flex items-center gap-1.5">
                                                                <span>⚠</span>
                                                                <span className="truncate">{getEffectDisplayName(se.id, se.name)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}

                                    {/* Botões de Limpar Efeitos */}
                                    {hasEffects && (
                                        <div className="flex gap-2 items-center justify-start flex-wrap">
                                            {hasBenefits && (
                                                <button
                                                    onClick={async () => {
                                                        const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
                                                        const updated = combatants.map(comb => {
                                                            if (comb.id !== c.id) return comb;
                                                            return {
                                                                ...comb,
                                                                statusEffects: (comb.statusEffects || []).filter(se => !benefitIds.includes(se.id) && (se as any).category !== 'benefit')
                                                            };
                                                        });
                                                        setCombatants(updated);
                                                        await syncState({ combatants: updated });
                                                    }}
                                                    className="px-4 py-2.5 rounded-lg text-[11px] font-bold bg-green-900/20 border border-green-600/40 text-green-400 hover:bg-green-900/40 transition-all active:scale-95 shadow-sm"
                                                    title="Limpar Benefícios"
                                                >
                                                    🗑️ Benef.
                                                </button>
                                            )}
                                            {hasDebuffs && (
                                                <button
                                                    onClick={async () => {
                                                        const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
                                                        const updated = combatants.map(comb => {
                                                            if (comb.id !== c.id) return comb;
                                                            return {
                                                                ...comb,
                                                                statusEffects: (comb.statusEffects || []).filter(se => benefitIds.includes(se.id) || (se as any).category === 'benefit')
                                                            };
                                                        });
                                                        setCombatants(updated);
                                                        await syncState({ combatants: updated });
                                                    }}
                                                    className="px-4 py-2.5 rounded-lg text-[11px] font-bold bg-red-900/20 border border-red-600/40 text-red-400 hover:bg-red-900/40 transition-all active:scale-95 shadow-sm"
                                                    title="Limpar Malefícios"
                                                >
                                                    🗑️ Malef.
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    const updated = combatants.map(comb => {
                                                        if (comb.id !== c.id) return comb;
                                                        return { ...comb, statusEffects: [] };
                                                    });
                                                    setCombatants(updated);
                                                    await syncState({ combatants: updated });
                                                }}
                                                className="px-4 py-2.5 rounded-lg text-[11px] font-bold bg-purple-900/20 border border-purple-600/40 text-purple-400 hover:bg-purple-900/40 transition-all active:scale-95 shadow-sm"
                                                title="Limpar Todos os Efeitos"
                                            >
                                                🗑️ Todos
                                            </button>
                                            
                                            {/* Botão de Curar Jogador Caído */}
                                            {isFallen && c.type === 'player' && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Deseja curar ${c.name} com 1 HP para ele retornar ao combate?`)) {
                                                            const updated = combatants.map(comb => {
                                                                if (comb.id !== c.id) return comb;
                                                                return {
                                                                    ...comb,
                                                                    hp: Math.max(1, comb.hp),
                                                                    statusEffects: (comb.statusEffects || []).filter(se => se.id !== 'caido')
                                                                };
                                                            });
                                                            setCombatants(updated);
                                                            await syncState({ combatants: updated });
                                                        }
                                                    }}
                                                    className="px-4 py-2.5 rounded-lg text-[11px] font-bold bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition-all active:scale-95 shadow-sm animate-pulse"
                                                    title="Curar 1 HP para retornar ao combate"
                                                >
                                                    ❤️ Curar 1 HP
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Botões de Controle - Embaixo */}
                                    <div className="flex flex-col gap-2">
                                        {/* Primeira linha: Efeitos de Classe, +/-, Remover */}
                                        <div className="flex gap-2 items-center justify-start">
                                            {c.type === 'player' && (
                                                <button
                                                    onClick={() => {
                                                        setClassFxTarget(c);
                                                        setIsClassFxOpen(true);
                                                    }}
                                                    className="w-14 h-12 sm:w-16 sm:h-12 rounded-lg bg-indigo-900/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40 transition-all text-sm active:scale-95 shadow-sm flex items-center justify-center"
                                                    title="Efeitos de Classe"
                                                >
                                                    ✨
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => updateHP(c.id, -1)}
                                                className="flex-1 h-12 rounded-lg bg-red-900/20 border border-red-500/40 text-red-400 hover:bg-red-900/40 transition-all font-bold text-lg active:scale-95 shadow-sm"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => updateHP(c.id, 1)}
                                                className="flex-1 h-12 rounded-lg bg-green-900/20 border border-green-500/40 text-green-400 hover:bg-green-900/40 transition-all font-bold text-lg active:scale-95 shadow-sm"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeCombatant(c.id)}
                                                className="w-14 h-12 sm:w-16 sm:h-12 rounded-lg bg-rpg-dark/50 border border-white/10 text-white/20 hover:text-red-500 hover:border-red-500/50 transition-all active:scale-95 flex items-center justify-center"
                                                title="Remover"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                            </button>
                                        </div>

                                        {/* Segunda linha: Inputs de Dano e Cura lado a lado */}
                                        <div className="flex gap-2 items-center">
                                            {/* Input Dano Rápido */}
                                            <div className="flex-1 flex gap-1 items-center bg-rpg-dark/30 rounded-lg border border-red-500/20 px-2 py-1.5">
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="Dano"
                                                    value={hpAdjustmentValues[c.id] || ''}
                                                    onChange={(e) => sethpAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                            if (value) {
                                                                updateHP(c.id, -value);
                                                                sethpAdjustmentValues(prev => ({ ...prev, [c.id]: '' }));
                                                            }
                                                        }
                                                    }}
                                                    className="w-full h-10 bg-rpg-dark/50 border border-white/10 rounded px-2 text-sm text-center focus:border-rpg-gold outline-none font-medieval text-white font-bold"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                        if (value) {
                                                            updateHP(c.id, -value);
                                                            sethpAdjustmentValues(prev => ({ ...prev, [c.id]: '' }));
                                                        }
                                                    }}
                                                    className="h-10 px-3 flex items-center justify-center text-red-400 hover:bg-red-900/40 transition-all font-bold text-sm rounded active:scale-95"
                                                    title="Aplicar Dano"
                                                >
                                                    ✓
                                                </button>
                                            </div>

                                            {/* Input Cura Rápido */}
                                            <div className="flex-1 flex gap-1 items-center bg-rpg-dark/30 rounded-lg border border-green-500/20 px-2 py-1.5">
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="Cura"
                                                    value={healAdjustmentValues[c.id] || ''}
                                                    onChange={(e) => setHealAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const value = parseInt(healAdjustmentValues[c.id] || '0');
                                                            if (value) {
                                                                updateHP(c.id, value);
                                                                setHealAdjustmentValues(prev => ({ ...prev, [c.id]: '' }));
                                                            }
                                                        }
                                                    }}
                                                    className="w-full h-10 bg-rpg-dark/50 border border-white/10 rounded px-2 text-sm text-center focus:border-rpg-gold outline-none font-medieval text-white font-bold"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const value = parseInt(healAdjustmentValues[c.id] || '0');
                                                        if (value) {
                                                            updateHP(c.id, value);
                                                            setHealAdjustmentValues(prev => ({ ...prev, [c.id]: '' }));
                                                        }
                                                    }}
                                                    className="h-10 px-3 flex items-center justify-center text-green-400 hover:bg-green-900/40 transition-all font-bold text-sm rounded active:scale-95"
                                                    title="Aplicar Cura"
                                                >
                                                    ✓
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {combatants.length === 0 && (
                    <div className="text-center py-16 sm:py-24 bg-rpg-panel border border-rpg-gold/20 rounded-2xl max-w-2xl mx-auto shadow-2xl backdrop-blur-sm mt-10 px-6">
                        <div className="text-7xl mb-6 opacity-20 filter grayscale">🏹</div>
                        <h2 className="text-2xl font-cinzel text-rpg-gold mb-3">Arena Deserta</h2>
                        <p className="text-rpg-grey mb-10 max-w-sm mx-auto leading-relaxed">Prepare sua aventura adicionando monstros, servos ou os heróis da sua campanha.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-rpg-gold text-rpg-dark px-10 py-4 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-glow-gold/20 active:scale-95"
                        >
                            ADICIONAR COMBATENTE
                        </button>
                    </div>
                )}
            </main>

            {/* Modal Add Combatente - Responsivo */}
            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setMonsterSearch(''); }} title="Novo Combatente">
                <div className="space-y-6">
                    {/* Abas Superiores */}
                    <div className="flex bg-rpg-dark/50 p-1 rounded-xl border border-rpg-gold/20">
                        {(['monster', 'npc', 'player'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setNewCombatant({ ...newCombatant, type: t, name: '' });
                                    setMonsterSearch('');
                                    setShowMonsterResults(false);
                                }}
                                className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-cinzel font-bold tracking-widest transition-all ${newCombatant.type === t ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey hover:text-rpg-gold'}`}
                            >
                                {t === 'monster' ? 'MONSTROS' : t === 'npc' ? 'NPC' : 'JOGADOR'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleAddCombatant} className="space-y-5">
                        {/* Conteúdo Contextual por Aba */}
                        {newCombatant.type === 'monster' || newCombatant.type === 'npc' ? (
                            <div className="relative" ref={searchRef}>
                                <label className="block text-rpg-gold text-[9px] font-bold mb-1 font-cinzel tracking-wider uppercase opacity-70">BUSCAR NA BIBLIOTECA</label>
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={monsterSearch}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setMonsterSearch(val);
                                            setShowMonsterResults(true);
                                            // Se o usuário apagar tudo, reseta o nome do combatente
                                            if (!val) setNewCombatant({ ...newCombatant, name: '' });
                                        }}
                                        onFocus={() => setShowMonsterResults(true)}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold shadow-inner text-sm"
                                        placeholder="Ex: Dragão, Orc, Guarda..."
                                        autoComplete="off"
                                    />
                                    {monsterSearch && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rpg-gold/30 pointer-events-none">🔍</div>}
                                </div>

                                {/* Resultados da Busca */}
                                {showMonsterResults && monsterSearch.trim().length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-rpg-panel border border-rpg-gold/30 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-80 overflow-y-auto custom-scrollbar">
                                        {filteredMonsters.length > 0 ? (
                                            filteredMonsters.map((m, i) => {
                                                const translated = translateMonster({
                                                    name: m.name,
                                                    type: typeof m.type === 'string' ? m.type : (m.type?.type || m.type),
                                                });
                                                const typeLabel = (m && typeof m.type === 'object' && m.type !== null)
                                                    ? (m.type.type || Object.values(m.type).join(', '))
                                                    : m.type;
                                                const displayName = translated?.name || m.name;
                                                const displayType = translated?.type || typeLabel;
                                                const challengeLabel = m.challenge || m.cr || '—';
                                                const hpLabel = m.hp ?? '—';
                                                const acLabel = m.ac ?? '—';
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleSelectMonster(m)}
                                                        className="w-full text-left p-4 hover:bg-rpg-gold/10 flex justify-between items-center group transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <div>
                                                            <div className="text-rpg-parchment font-medieval text-base group-hover:text-rpg-gold">{displayName}</div>
                                                            <div className="text-[10px] text-rpg-grey uppercase tracking-wider">{displayType || m.race || m.role}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-rpg-gold font-cinzel text-xs">CR {challengeLabel}</div>
                                                            <div className="text-[10px] text-rpg-grey">{hpLabel} HP | {acLabel} CA</div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="p-4 text-center text-rpg-grey italic border border-white/5">
                                                Nenhum {newCombatant.type === 'monster' ? 'monstro' : 'NPC'} encontrado...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {newCombatant.name && (
                                    <div className="mt-3 animate-fade-in">
                                        <label className="block text-rpg-gold text-[9px] font-bold mb-1 font-cinzel tracking-wider uppercase opacity-70">NOME (CUSTOMIZÁVEL)</label>
                                        <input
                                            type="text"
                                            value={newCombatant.name}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                            className="w-full bg-rpg-dark/30 border border-rpg-gold/20 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                <label className="block text-rpg-gold text-[10px] font-bold mb-1.5 font-cinzel tracking-widest uppercase opacity-70">
                                    SELECIONE UM HERÓI DA CAMPANHA
                                </label>

                                {charactersLoading ? (
                                    <div className="p-10 text-center animate-pulse text-rpg-gold">Invocando almas...</div>
                                ) : myCharacters.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {myCharacters.map((char) => (
                                            <button
                                                key={char.id}
                                                type="button"
                                                onClick={() => setNewCombatant({
                                                    ...newCombatant,
                                                    name: char.name,
                                                    hp: char.maxHp || 10,
                                                    ac: char.armorClass || 10,
                                                    cr: char.level || '1',
                                                    externalId: char.id,
                                                    ownerId: char.ownerId,
                                                    ownerName: char.name
                                                })}
                                                className={`p-3 rounded-xl border text-left transition-all ${newCombatant.externalId === char.id ? 'bg-rpg-gold border-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'bg-rpg-dark/50 border-white/5 hover:border-rpg-gold/30 text-rpg-parchment'}`}
                                            >
                                                <div className="font-bold truncate">{char.name}</div>
                                                <div className="text-[10px] opacity-70 italic">{char.class} • Lvl {char.level}</div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center border-2 border-dashed border-white/10 rounded-xl text-rpg-grey text-sm italic">
                                        Nenhum personagem encontrado na sua conta.
                                    </div>
                                )}

                                <div className="relative pt-2">
                                    <label className="block text-rpg-gold text-[9px] font-bold mb-1 font-cinzel tracking-wider uppercase opacity-70">OU CRIE UM HERÓI</label>
                                    <input
                                        type="text"
                                        value={newCombatant.name}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value, externalId: '', ownerId: '' })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold shadow-inner text-sm"
                                        placeholder="Nome do Herói..."
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Atributos Comuns */}
                        <div className="space-y-2.5 pt-2">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">INIC</label>
                                    <input
                                        type="number"
                                        value={newCombatant.initiative}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">HP</label>
                                    <input
                                        type="number"
                                        value={newCombatant.hp}
                                        placeholder="10"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, hp: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">CA</label>
                                    <input
                                        type="number"
                                        value={newCombatant.ac}
                                        placeholder="10"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, ac: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">CR</label>
                                    <input
                                        type="text"
                                        value={newCombatant.cr}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, cr: e.target.value })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">XP</label>
                                    <input
                                        type="number"
                                        value={newCombatant.xp}
                                        placeholder="450"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, xp: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-rpg-gold text-[9px] font-bold font-cinzel tracking-wider uppercase opacity-70">QTD</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={newCombatant.quantity}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, quantity: e.target.value === '' ? 1 : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-base"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => { setIsAddModalOpen(false); setMonsterSearch(''); }}
                                className="px-4 py-3 sm:py-2 text-rpg-grey hover:text-rpg-parchment font-cinzel order-2 sm:order-1 tracking-widest text-[10px]"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                className="bg-rpg-gold text-rpg-dark px-8 py-3 sm:py-2 rounded-lg font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-lg active:scale-95 order-1 sm:order-2 tracking-widest text-[10px] shadow-glow-gold/20"
                            >
                                CONVOCAR
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Modal XP Recompensas - Impactante */}
            <Modal isOpen={isXPModalOpen} onClose={() => setIsXPModalOpen(false)} title="GLÓRIA E RECOMPENSA">
                <div className="text-center py-6 sm:py-8">
                    <div className="text-7xl mb-6 flex justify-center drop-shadow-glow-gold">🏆</div>
                    <h3 className="text-2xl sm:text-3xl font-cinzel text-rpg-gold mb-3 uppercase tracking-widest">Vitória Alcançada!</h3>
                    <p className="text-rpg-grey mb-8 font-medieval tracking-widest text-sm px-4">Os ecos da batalha diminuem enquanto as riquezas e a experiência são calculadas...</p>
                    <div className="relative inline-block mb-10 group">
                        <div className="absolute inset-0 bg-rpg-gold blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative text-5xl sm:text-7xl font-cinzel text-white text-shadow-glow-gold px-12 py-6 bg-rpg-dark/40 border border-rpg-gold/30 rounded-2xl">
                            {totalXP} <span className="text-2xl sm:text-3xl text-rpg-gold">XP</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 px-4 sm:px-10">
                        <button
                            onClick={handleExitArena}
                            className="w-full bg-rpg-gold text-rpg-dark px-8 py-5 rounded-2xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all transform active:scale-95 shadow-glow-gold/20 tracking-widest text-sm"
                        >
                            COLHER LOOT & VOLTAR AO LOBBY
                        </button>
                        <button
                            onClick={() => setIsXPModalOpen(false)}
                            className="w-full bg-rpg-panel border border-white/10 text-rpg-parchment px-8 py-4 rounded-2xl font-cinzel hover:bg-white/5 transition-all active:scale-95 tracking-widest text-xs"
                        >
                            PERMANECER NA ARENA
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Efeitos de Classe (Individual) */}
            <Modal 
                isOpen={isClassFxOpen} 
                onClose={() => {
                    setIsClassFxOpen(false);
                    setClassFxTarget(null);
                    setEffectTab('all');
                    setEffectSearchQuery('');
                }} 
                title={`Efeitos • ${classFxTarget?.name || ''}`}
            >
                <div className="space-y-3">
                    {(() => {
                        const charClass = classFxTarget?.externalId ? characterInfo[classFxTarget.externalId]?.class : undefined;
                        const availableEffects = charClass ? (CLASS_EFFECTS[charClass] || []) : [];
                        const charLevel = classFxTarget?.externalId ? characterInfo[classFxTarget.externalId]?.level : undefined;

                        // Obter condições globais
                        const globalConditions = getCategorizedGlobalConditions();
                        
                        // Combinar efeitos de classe com condições globais
                        const classEffectsWithType = availableEffects.map(fx => ({ ...fx, type: 'class' as const }));
                        const globalBenefitsWithType = globalConditions.benefits.map(c => ({ id: c.id, name: c.name, duration: 1, category: 'benefit' as const, type: 'global' as const }));
                        const globalDebuffsWithType = globalConditions.debuffs.map(c => ({ id: c.id, name: c.name, duration: 1, category: 'debuff' as const, type: 'global' as const }));

                        // Categorizar todos os efeitos (classe + globais)
                        const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'hunters-mark', 'favored-foe', 'metamagic', 'tides-chaos', 'invocation', 'arcane-recovery', 'spell-mastery', 'sneak-attack', 'armor-agathys', 'multiattack', 'mirror-image'];
                        const debuffIds = ['stunning-strike', 'hex', 'curse', 'entangle', 'knocked-down', 'paralyzed-ki', 'wrathful-smite', 'wild-surge', 'hypnotic-pattern'];
                        
                        const allEffects = [...classEffectsWithType, ...globalBenefitsWithType, ...globalDebuffsWithType];
                        const benefits = allEffects.filter(fx => (benefitIds.includes(fx.id)) || (fx.type === 'global' && fx.category === 'benefit'));
                        const debuffs = allEffects.filter(fx => (debuffIds.includes(fx.id)) || (fx.type === 'global' && fx.category === 'debuff'));
                        
                        // Aplicar filtro de busca
                        const normalizeSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const searchTerm = normalizeSearch(effectSearchQuery);
                        
                        const filterEffects = (effects: any[]) => {
                            if (!searchTerm) return effects;
                            return effects.filter(fx => 
                                normalizeSearch(fx.name).includes(searchTerm) ||
                                normalizeSearch(fx.id).includes(searchTerm)
                            );
                        };
                        
                        const filteredBenefits = filterEffects(benefits);
                        const filteredDebuffs = filterEffects(debuffs);
                        const displayedEffects = effectTab === 'benefits' ? filteredBenefits : effectTab === 'debuffs' ? filteredDebuffs : filterEffects(allEffects);

                        return (
                            <>
                                <div className="text-center pb-2 border-b border-white/10 mb-3">
                                    <div className="text-rpg-gold font-cinzel text-xs tracking-widest uppercase">{charClass}</div>
                                    {charLevel && <div className="text-rpg-grey text-[9px] mt-0.5">Nível {charLevel}</div>}
                                </div>

                                {/* Barra de Busca */}
                                <div className="mb-3">
                                    <input
                                        type="text"
                                        placeholder="🔍 Buscar efeito..."
                                        value={effectSearchQuery}
                                        onChange={(e) => setEffectSearchQuery(e.target.value)}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold/30 transition-all text-sm"
                                    />
                                </div>

                                {/* Sistema de Abas */}
                                <div className="flex gap-1 mb-3 border-b border-white/10">
                                    <button
                                        onClick={() => setEffectTab('all')}
                                        className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider uppercase transition-all border-b-2 ${
                                            effectTab === 'all'
                                                ? 'border-rpg-gold text-rpg-gold'
                                                : 'border-transparent text-rpg-grey hover:text-rpg-parchment'
                                        }`}
                                    >
                                        🎭 Todos ({filterEffects(allEffects).length})
                                    </button>
                                    <button
                                        onClick={() => setEffectTab('benefits')}
                                        className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider uppercase transition-all border-b-2 ${
                                            effectTab === 'benefits'
                                                ? 'border-green-500 text-green-400'
                                                : 'border-transparent text-rpg-grey hover:text-rpg-parchment'
                                        }`}
                                    >
                                        ✦ Benef. ({filteredBenefits.length})
                                    </button>
                                    <button
                                        onClick={() => setEffectTab('debuffs')}
                                        className={`flex-1 px-3 py-2 text-[10px] font-cinzel tracking-wider uppercase transition-all border-b-2 ${
                                            effectTab === 'debuffs'
                                                ? 'border-red-500 text-red-400'
                                                : 'border-transparent text-rpg-grey hover:text-rpg-parchment'
                                        }`}
                                    >
                                        ⚠ Malef. ({filteredDebuffs.length})
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {displayedEffects.length === 0 ? (
                                        <div className="col-span-full text-center py-6">
                                            <div className="text-2xl mb-2 opacity-30">🎭</div>
                                            <p className="text-rpg-grey text-xs italic">
                                                Nenhum efeito nesta categoria
                                            </p>
                                        </div>
                                    ) : displayedEffects.map((fx: any) => {
                                        const hasEffect = classFxTarget?.statusEffects?.some(se => se.id === fx.id);
                                        const isGlobal = fx.type === 'global';
                                        const isBenefit = fx.category === 'benefit';
                                        const isDebuff = fx.category === 'debuff';
                                        
                                        // Estilos baseados na categoria
                                        const cardClasses = isBenefit 
                                            ? 'bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-600/50 hover:border-green-500 shadow-lg shadow-green-900/20' 
                                            : 'bg-gradient-to-br from-red-900/30 to-red-900/10 border-red-600/50 hover:border-red-500 shadow-lg shadow-red-900/20';
                                        
                                        const icon = isBenefit ? '✦' : '⚠';
                                        const iconColor = isBenefit ? 'text-green-400' : 'text-red-400';
                                        
                                        return (
                                            <div key={fx.id} className={`p-3 rounded-lg border transition-all ${cardClasses}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-start gap-2 flex-1">
                                                        <span className={`${iconColor} text-lg leading-none`}>{icon}</span>
                                                        <div className="flex-1">
                                                            <div className="text-rpg-parchment font-cinzel text-xs font-bold leading-tight">{fx.name}</div>
                                                            {isGlobal && <span className="text-[8px] text-rpg-gold opacity-70 font-bold uppercase mt-0.5 block">Global</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            applyClassEffectToCombatant(classFxTarget!.id, fx);
                                                            setIsClassFxOpen(false);
                                                            setClassFxTarget(null);
                                                            setEffectTab('all');
                                                            setEffectSearchQuery('');
                                                        }}
                                                        disabled={hasEffect}
                                                        className={`flex-1 px-2 py-1.5 rounded text-[10px] font-bold transition-all active:scale-95 ${
                                                            hasEffect 
                                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                                                                : isBenefit
                                                                ? 'bg-green-700 text-white hover:bg-green-600 shadow-glow-green/30'
                                                                : 'bg-red-700 text-white hover:bg-red-600 shadow-glow-red/30'
                                                        }`}
                                                    >
                                                        {hasEffect ? 'Ativo' : 'Aplicar'}
                                                    </button>
                                                    {hasEffect && (
                                                        <button
                                                            onClick={() => {
                                                                removeClassEffectFromCombatant(classFxTarget!.id, fx.id);
                                                                setIsClassFxOpen(false);
                                                                setClassFxTarget(null);
                                                                setEffectTab('all');
                                                                setEffectSearchQuery('');
                                                            }}
                                                            className="flex-1 bg-red-800 text-white px-2 py-1.5 rounded text-[10px] hover:bg-red-700 transition-all active:scale-95 font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Criar Efeito Customizado */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="text-rpg-gold font-cinzel text-[10px] tracking-wider uppercase mb-2 opacity-70">Criar Efeito Customizado</div>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Nome do Efeito"
                                            value={newEffect.name}
                                            onChange={(e) => setNewEffect({ ...newEffect, name: e.target.value })}
                                            className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                                        />
                                        <select
                                            value={newEffect.category}
                                            onChange={(e) => setNewEffect({ ...newEffect, category: e.target.value as 'benefit' | 'debuff' })}
                                            className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                                        >
                                            <option value="benefit" className="bg-rpg-dark">✦ Benefício</option>
                                            <option value="debuff" className="bg-rpg-dark">⚠ Malefício</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Duração (turnos) *"
                                            min="1"
                                            value={newEffect.duration}
                                            onChange={(e) => setNewEffect({ ...newEffect, duration: e.target.value })}
                                            className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2 text-rpg-parchment outline-none focus:border-rpg-gold text-sm text-center"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!newEffect.name.trim() || !newEffect.duration || Number(newEffect.duration) < 1) {
                                                    alert('Preencha o nome, o tipo e a duração do efeito!');
                                                    return;
                                                }
                                                const customEffect: StatusEffect & { category?: 'benefit' | 'debuff' } = {
                                                    id: `custom-${Date.now()}`,
                                                    name: newEffect.name.trim(),
                                                    duration: Number(newEffect.duration),
                                                    category: newEffect.category
                                                };
                                                applyClassEffectToCombatant(classFxTarget!.id, customEffect as any);
                                                setNewEffect({ name: '', duration: '', category: 'benefit' });
                                                setIsClassFxOpen(false);
                                                setClassFxTarget(null);
                                                setEffectTab('all');
                                                setEffectSearchQuery('');
                                            }}
                                            className="w-full bg-purple-700 text-white px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-purple-600 transition-all active:scale-95"
                                        >
                                            CRIAR E APLICAR
                                        </button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </Modal>
        </div>
    );
}

