'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
    doc,
    onSnapshot,
    updateDoc,
    setDoc
} from 'firebase/firestore';
import Modal from '@/components/Modal';
import { translateMonster } from '@/lib/monster-translator';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';

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
}

export default function ConfrontoDetalhesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

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

    // --- Novo Combatente Form ---
    const [newCombatant, setNewCombatant] = useState({
        name: '',
        hp: '' as any,
        initiative: '' as any,
        type: 'monster' as 'monster' | 'npc' | 'player',
        ac: '' as any,
        cr: '0',
        externalId: '',
        ownerId: '',
        ownerName: ''
    });

    const [isOnline, setIsOnline] = useState(false);
    const [myCharacters, setMyCharacters] = useState<any[]>([]);
    const [charactersLoading, setCharactersLoading] = useState(false);

    // --- Estados de Busca de Monstro ---
    const [monsterSearch, setMonsterSearch] = useState('');
    const [showMonsterResults, setShowMonsterResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAddModalOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isAddModalOpen]);

    const filteredMonsters = useMemo(() => {
        if (!monsterSearch) return [];
        return dndMonsters.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(monsterSearch.toLowerCase()) ||
                m.type.toLowerCase().includes(monsterSearch.toLowerCase());

            if (newCombatant.type === 'npc') {
                return matchesSearch && m.category === 'npc';
            } else if (newCombatant.type === 'monster') {
                return matchesSearch && m.category !== 'npc';
            }
            return matchesSearch;
        }).slice(0, 5);
    }, [monsterSearch, newCombatant.type]);

    const handleSelectMonster = (monster: MonsterData) => {
        setNewCombatant({
            ...newCombatant,
            name: monster.name,
            hp: monster.hp,
            ac: monster.ac,
            cr: monster.challenge,
            // Mantém o tipo atual (monster ou npc)
            type: newCombatant.type
        });
        setMonsterSearch(monster.name);
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
                setCombatants(data.combatants || []);
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

    // --- Sincronização Automática ---
    const syncState = async (updates: any) => {
        if (!id) return;
        try {
            await updateDoc(doc(db, 'encounters', id), updates);

            // Se a arena estiver online, sincroniza com a coleção de sessões compartilhadas
            if (isOnline || updates.isOnline) {
                const sessionRef = doc(db, 'arenas_online', id);

                // Sanitiza combatentes para o Firestore
                const currentCombatants = updates.combatants || combatants;
                const sanitizedCombatants = currentCombatants.map((c: any) => {
                    const clean = { ...c };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });

                    // Garante que statusEffects exista para a Arena Online
                    if (!clean.statusEffects) clean.statusEffects = [];

                    return clean;
                });

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
    };

    // --- Ações de Combate ---
    const handleAddCombatant = async (e: React.FormEvent) => {
        e.preventDefault();
        const newEntry: Combatant = {
            id: Math.random().toString(36).substr(2, 9),
            name: translateMonster(newCombatant.name),
            type: newCombatant.type,
            hp: Number(newCombatant.hp) || 1,
            maxHp: Number(newCombatant.hp) || 1,
            initiative: Number(newCombatant.initiative) || 0,
            ac: Number(newCombatant.ac) || 10,
            cr: newCombatant.cr || '0',
            status: 'active',
            statusEffects: [],
            externalId: newCombatant.externalId || undefined,
            ownerId: newCombatant.ownerId || undefined,
            ownerName: newCombatant.ownerName || undefined
        };

        const updated = [...combatants, newEntry];
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
        const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
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
                    {combatants.map((c, index) => (
                        <div
                            key={c.id}
                            className={`
                                relative p-3 sm:p-5 rounded-xl border-2 transition-all duration-300
                                ${phase === 'combat' && turnIndex === index ? 'bg-rpg-gold/15 border-rpg-gold shadow-glow-gold/20 scale-[1.01] z-10' : 'bg-rpg-panel/80 border-rpg-gold/10 shadow-lg'}
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
                                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-rpg-grey uppercase font-bold tracking-widest mt-1">
                                            <span className={`px-1.5 py-0.5 rounded border ${c.type === 'player' ? 'border-blue-500/30 text-blue-400' : 'border-red-500/30 text-red-400'}`}>
                                                {c.type === 'monster' ? 'MONSTRO' : c.type === 'player' ? 'JOGADOR' : 'NPC'}
                                            </span>
                                            {c.ac && <span className="bg-rpg-dark/50 px-1.5 py-0.5 rounded border border-white/5">CA {c.ac}</span>}
                                            {c.cr && <span className="bg-rpg-dark/50 px-1.5 py-0.5 rounded border border-white/5">CR {c.cr}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-0">
                                    <div className="flex-1 sm:w-56">
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

                                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                        <button
                                            onClick={() => updateHP(c.id, -5)}
                                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-red-900/20 border border-red-500/40 text-red-400 hover:bg-red-900/40 transition-all font-bold text-lg active:scale-95 shadow-sm"
                                        >
                                            -
                                        </button>
                                        <button
                                            onClick={() => updateHP(c.id, 5)}
                                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-green-900/20 border border-green-500/40 text-green-400 hover:bg-green-900/40 transition-all font-bold text-lg active:scale-95 shadow-sm"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => removeCombatant(c.id)}
                                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-rpg-dark/50 border border-white/10 text-white/20 hover:text-red-500 hover:border-red-500/50 transition-all active:scale-95 flex items-center justify-center"
                                            title="Remover"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                <label className="block text-rpg-gold text-[10px] font-bold mb-1.5 font-cinzel tracking-widest uppercase opacity-70">BUSCAR NA BIBLIOTECA</label>
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
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-4 text-rpg-parchment outline-none focus:border-rpg-gold shadow-inner text-sm"
                                        placeholder="Ex: Dragão, Orc, Guarda, Plebeu..."
                                        autoComplete="off"
                                    />
                                    {monsterSearch && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rpg-gold/30 pointer-events-none">🔍</div>}
                                </div>

                                {/* Resultados da Busca */}
                                {showMonsterResults && filteredMonsters.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-rpg-panel border border-rpg-gold/30 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                                        {filteredMonsters.map((m, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectMonster(m)}
                                                className="w-full text-left p-4 hover:bg-rpg-gold/10 flex justify-between items-center group transition-colors border-b border-white/5 last:border-0"
                                            >
                                                <div>
                                                    <div className="text-rpg-parchment font-medieval text-base group-hover:text-rpg-gold">{m.name}</div>
                                                    <div className="text-[10px] text-rpg-grey uppercase tracking-wider">{m.type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-rpg-gold font-cinzel text-xs">CR {m.challenge}</div>
                                                    <div className="text-[10px] text-rpg-grey">{m.hp} HP | {m.ac} CA</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {newCombatant.name && (
                                    <div className="mt-4 animate-fade-in">
                                        <label className="block text-rpg-gold text-[10px] font-bold mb-1.5 font-cinzel tracking-widest uppercase opacity-70">NOME DO {newCombatant.type === 'monster' ? 'MONSTRO' : 'NPC'} (CUSTOMIZÁVEL)</label>
                                        <input
                                            type="text"
                                            value={newCombatant.name}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                            className="w-full bg-rpg-dark/30 border border-rpg-gold/20 rounded-xl p-4 text-rpg-parchment outline-none focus:border-rpg-gold"
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
                                    <label className="block text-rpg-gold text-[10px] font-bold mb-1.5 font-cinzel tracking-widest uppercase opacity-70">OU CRIE UM HERÓI TEMPORÁRIO</label>
                                    <input
                                        type="text"
                                        value={newCombatant.name}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value, externalId: '', ownerId: '' })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-4 text-rpg-parchment outline-none focus:border-rpg-gold shadow-inner text-sm"
                                        placeholder="Nome do Herói..."
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Atributos Comuns */}
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-rpg-gold text-[10px] font-bold font-cinzel tracking-widest uppercase opacity-70">INICIATIVA</label>
                                    <input
                                        type="number"
                                        value={newCombatant.initiative}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-3 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-rpg-gold text-[10px] font-bold font-cinzel tracking-widest uppercase opacity-70">VIDA MÁXIMA</label>
                                    <input
                                        type="number"
                                        value={newCombatant.hp}
                                        placeholder="10"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, hp: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-3 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-lg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-rpg-gold text-[10px] font-bold font-cinzel tracking-widest uppercase opacity-70">CA (DEFESA)</label>
                                    <input
                                        type="number"
                                        value={newCombatant.ac}
                                        placeholder="10"
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, ac: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-3 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-rpg-gold text-[10px] font-bold font-cinzel tracking-widest uppercase opacity-70">NÍVEL / ND (CR)</label>
                                    <input
                                        type="text"
                                        value={newCombatant.cr}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setNewCombatant({ ...newCombatant, cr: e.target.value })}
                                        className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-3 text-rpg-parchment outline-none shadow-inner text-center font-medieval text-lg"
                                        placeholder="0, 1/4, 5, etc"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => { setIsAddModalOpen(false); setMonsterSearch(''); }}
                                className="px-6 py-4 sm:py-2 text-rpg-grey hover:text-rpg-parchment font-cinzel order-2 sm:order-1 tracking-widest text-[10px]"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                className="bg-rpg-gold text-rpg-dark px-10 py-4 sm:py-2 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-lg active:scale-95 order-1 sm:order-2 tracking-widest text-[10px] shadow-glow-gold/20"
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
        </div>
    );
}
