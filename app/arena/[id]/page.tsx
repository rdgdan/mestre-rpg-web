'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';

// --- Tipos ---
type CombatantType = 'player' | 'monster' | 'npc';

interface StatusEffect {
    id: string;
    name: string;
    duration: number;
}

interface Combatant {
    id: string;
    externalId?: string;
    name: string;
    type: CombatantType;
    hp: number;
    maxHp: number;
    ac: number;
    cr: string;
    xp: number;
    initiative: number;
    statusEffects: StatusEffect[];
    class?: string;
    level?: number;
    ownerId?: string;
}

interface PlayerCharacter {
    id: string;
    name: string;
    hp: number;
    class: string;
    level: number;
}

interface ArenaSession {
    id: string;
    hostId: string;
    hostName: string;
    phase: 'preparation' | 'initiative' | 'combat';
    round: number;
    turnIndex: number;
    combatants: Combatant[];
}

export default function SharedArenaPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [session, setSession] = useState<ArenaSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Join Battle states
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [myCharacters, setMyCharacters] = useState<PlayerCharacter[]>([]);
    const [selectedCharId, setSelectedCharId] = useState('');
    const [joinInitiative, setJoinInitiative] = useState<number>(0);
    const [isJoining, setIsJoining] = useState(false);

    // Effect management for players
    const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
    const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});
    const [customEffName, setCustomEffName] = useState('');
    const [customEffDur, setCustomEffDur] = useState(10);

    // Helpers para renderização (definidos cedo para uso nas funções)
    const isHost = session && user && user.uid === session.hostId;
    const currentCombatant = session?.combatants[session.turnIndex];

    const getHpStatusLabel = (c: Combatant) => {
        if (c.hp <= 0) return '💀 MORTO/CAÍDO';
        const percent = (c.hp / c.maxHp) * 100;
        if (percent > 75) return '🟩 Saudável';
        if (percent > 25) return '🟨 Ferido';
        return '🟥 Nas Últimas';
    };

    useEffect(() => {
        if (!id) return;

        const sessionRef = doc(db, 'arenas_online', id as string);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists()) {
                setSession(docSnap.data() as ArenaSession);
                setError(null);
            } else {
                setError("Sessão não encontrada ou encerrada pelo mestre.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Erro ao seguir arena:", err);
            setError("Erro de conexão com o servidor de batalha.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    const handleJoinBattle = async () => {
        if (!user || !session || !selectedCharId) return;

        const char = myCharacters.find(c => c.id === selectedCharId);
        if (!char) return;

        setIsJoining(true);
        try {
            const sessionRef = doc(db, 'arenas_online', id as string);
            let updatedCombatants = [...session.combatants];

            // Verifica se o personagem já existe na arena (pode ter sido adicionado pelo mestre como placeholder)
            const existingIndex = updatedCombatants.findIndex(c => c.externalId === char.id);

            if (existingIndex > -1) {
                // Atualiza o existente (Lógica de "Assumir Slot")
                updatedCombatants[existingIndex] = {
                    ...updatedCombatants[existingIndex],
                    name: char.name,
                    hp: char.hp,
                    maxHp: char.hp,
                    class: char.class,
                    level: char.level,
                    cr: `Lvl ${char.level}`,
                    initiative: joinInitiative,
                    ownerId: user.uid
                };
            } else {
                // Adiciona novo caso não exista
                const newCombatant: Combatant = {
                    id: Math.random().toString(36).substr(2, 9),
                    externalId: char.id,
                    name: char.name,
                    type: 'player',
                    hp: char.hp,
                    maxHp: char.hp,
                    ac: 10,
                    cr: `Lvl ${char.level}`,
                    xp: 0,
                    initiative: joinInitiative,
                    statusEffects: [],
                    class: char.class,
                    level: char.level,
                    ownerId: user.uid
                };
                updatedCombatants.push(newCombatant);
            }

            // Reordenar a iniciativa no banco
            updatedCombatants.sort((a, b) => b.initiative - a.initiative);

            // Sanitiza combatentes e efeitos
            const sanitizedCombatants = updatedCombatants.map(c => {
                const clean = { ...c };
                // Remove campos undefined
                Object.keys(clean).forEach(key => {
                    if (clean[key] === undefined) delete clean[key];
                });
                // Garante statusEffects sempre array e limpo
                clean.statusEffects = Array.isArray(clean.statusEffects)
                    ? clean.statusEffects.filter(e => e && e.id && e.name && typeof e.duration === 'number')
                    : [];
                return clean;
            });
            // Debug: log combatants for undefined fields
            sanitizedCombatants.forEach((c, i) => {
                Object.entries(c).forEach(([k, v]) => {
                    if (v === undefined) {
                        console.error(`Combatant[${i}] undefined field:`, k, c);
                    }
                });
            });
            await updateDoc(sessionRef, {
                combatants: sanitizedCombatants
            });

            setIsJoinModalOpen(false);
            alert("Você entrou na batalha!");
        } catch (err) {
            console.error("Erro ao entrar no combate:", err);
            alert("Não foi possível entrar no combate.");
        } finally {
            setIsJoining(false);
        }
    };

    const openJoinModal = async () => {
        if (!user) {
            alert("Faça login para participar com seu personagem!");
            return;
        }
        setIsJoinModalOpen(true);
        try {
            const q = query(collection(db, 'personagens'), where('ownerId', '==', user.uid));
            const snap = await getDocs(q);
            const chars: PlayerCharacter[] = [];
            snap.forEach(doc => {
                const d = doc.data();
                chars.push({
                    id: doc.id,
                    name: d.name || 'Sem Nome',
                    hp: d.currentHp || (d.hp?.max || 10),
                    class: d.class || '',
                    level: d.level || 1
                });
            });
            setMyCharacters(chars);
        } catch (err) {
            console.error("Erro ao carregar personagens:", err);
        }
    };

    const handlePlayerAddEffect = async (effectName: string, duration: number) => {
        if (!user || !session) return;

        // Encontrar o combatente do jogador
        const myCombatantIndex = session.combatants.findIndex(c => c.ownerId === user.uid);
        if (myCombatantIndex === -1) return;

        // Verificar cooldown (prevenir cliques duplos/spam)
        if (cooldowns[effectName] && Date.now() < cooldowns[effectName]) return;

        setIsJoining(true); // Reusando estado de loading
        try {
            const sessionRef = doc(db, 'arenas_online', id as string);
            const updatedCombatants = [...session.combatants];
            const myCombatant = { ...updatedCombatants[myCombatantIndex] };

            const newEffect = {
                id: Math.random().toString(36).substr(2, 9),
                name: effectName,
                duration: duration
            };

            myCombatant.statusEffects = [...myCombatant.statusEffects, newEffect];
            updatedCombatants[myCombatantIndex] = myCombatant;

            const sanitizedCombatants = updatedCombatants.map(c => {
                const clean = { ...c };
                Object.keys(clean).forEach(key => {
                    if (clean[key] === undefined) delete clean[key];
                });
                clean.statusEffects = Array.isArray(clean.statusEffects)
                    ? clean.statusEffects.filter(e => e && e.id && e.name && typeof e.duration === 'number')
                    : [];
                return clean;
            });
            // Debug: log combatants for undefined fields
            sanitizedCombatants.forEach((c, i) => {
                Object.entries(c).forEach(([k, v]) => {
                    if (v === undefined) {
                        console.error(`Combatant[${i}] undefined field:`, k, c);
                    }
                });
            });
            await updateDoc(sessionRef, {
                combatants: sanitizedCombatants
            });

            setCooldowns(prev => ({ ...prev, [effectName]: Date.now() + 2000 }));
            setIsEffectModalOpen(false);
        } catch (err) {
            console.error("Erro ao adicionar efeito:", err);
        } finally {
            setIsJoining(false);
        }
    };

    const handleRemoveEffect = async (combatantId: string, effectId: string) => {
        if (!user || !session) return;

        // Verificar permissão: Host pode tudo, Player só no seu próprio
        const combatant = session.combatants.find(c => c.id === combatantId);
        if (!combatant) return;

        const isMyCharacter = user.uid === combatant.ownerId;
        if (!isHost && !isMyCharacter) return;

        try {
            const sessionRef = doc(db, 'arenas_online', id as string);
            const updatedCombatants = session.combatants.map(c => {
                if (c.id === combatantId) {
                    return {
                        ...c,
                        statusEffects: c.statusEffects.filter(e => e.id !== effectId)
                    };
                }
                return c;
            });

            const sanitizedCombatants = updatedCombatants.map(c => {
                const clean = { ...c };
                Object.keys(clean).forEach(key => {
                    if (clean[key] === undefined) delete clean[key];
                });
                clean.statusEffects = Array.isArray(clean.statusEffects)
                    ? clean.statusEffects.filter(e => e && e.id && e.name && typeof e.duration === 'number')
                    : [];
                return clean;
            });
            // Debug: log combatants for undefined fields
            sanitizedCombatants.forEach((c, i) => {
                Object.entries(c).forEach(([k, v]) => {
                    if (v === undefined) {
                        console.error(`Combatant[${i}] undefined field:`, k, c);
                    }
                });
            });
            await updateDoc(sessionRef, {
                combatants: sanitizedCombatants
            });
        } catch (err) {
            console.error("Erro ao remover efeito:", err);
        }
    };

    const handleHostAdvanceTurn = async (direction: 'next' | 'prev') => {
        // Extra guard: block any non-host from ever updating turn/round, even if they try to call this function
        if (!isHost) {
            alert('Apenas o mestre pode avançar o turno.');
            return;
        }
        if (!session || session.combatants.length === 0) return;

        const sessionRef = doc(db, 'arenas_online', id as string);
        let nextIndex = session.turnIndex;
        let nextRound = session.round;
        let attempts = 0;

        if (direction === 'next') {
            // Procurar próximo combatente vivo
            do {
                nextIndex = (nextIndex + 1) % session.combatants.length;
                if (nextIndex === 0) nextRound++;
                attempts++;
                if (attempts >= session.combatants.length) break;
            } while (session.combatants[nextIndex].hp <= 0);
        } else {
            nextIndex--;
            if (nextIndex < 0) {
                nextIndex = session.combatants.length - 1;
                nextRound = Math.max(1, nextRound - 1);
            }
        }

        // Lógica de Efeitos: Diminuir duração ao INICIAR o turno (apenas se avançou)
        const updatedCombatants = session.combatants.map((c, idx) => {
            if (direction === 'next' && idx === nextIndex) {
                return {
                    ...c,
                    statusEffects: c.statusEffects
                        .map(e => ({ ...e, duration: e.duration - 1 }))
                        .filter(e => e.duration > 0)
                };
            }
            return c;
        });

        const sanitizedCombatants = updatedCombatants.map(c => {
            const clean = { ...c };
            Object.keys(clean).forEach(key => {
                if (clean[key] === undefined) delete clean[key];
            });
            clean.statusEffects = Array.isArray(clean.statusEffects)
                ? clean.statusEffects.filter(e => e && e.id && e.name && typeof e.duration === 'number')
                : [];
            return clean;
        });
        // Debug: log combatants for undefined fields
        sanitizedCombatants.forEach((c, i) => {
            Object.entries(c).forEach(([k, v]) => {
                if (v === undefined) {
                    console.error(`Combatant[${i}] undefined field:`, k, c);
                }
            });
        });
        // Double-check: only host can update turn/round/phase
        if (user && user.uid === session.hostId) {
            await updateDoc(sessionRef, {
                turnIndex: nextIndex,
                round: nextRound,
                combatants: sanitizedCombatants,
                phase: 'combat'
            });
        } else {
            alert('Apenas o mestre pode avançar o turno.');
        }
    };

    const handleHostUpdateHp = async (combatantId: string, delta: number) => {
        if (!isHost || !session) return;

        const sessionRef = doc(db, 'arenas_online', id as string);
        const updatedCombatants = session.combatants.map(c => {
            if (c.id === combatantId) {
                return { ...c, hp: Math.min(c.maxHp, Math.max(0, c.hp + delta)) };
            }
            return c;
        });

        const sanitizedCombatants = updatedCombatants.map(c => {
            const clean = { ...c };
            Object.keys(clean).forEach(key => {
                if (clean[key] === undefined) delete clean[key];
            });
            clean.statusEffects = Array.isArray(clean.statusEffects)
                ? clean.statusEffects.filter(e => e && e.id && e.name && typeof e.duration === 'number')
                : [];
            return clean;
        });
        // Debug: log combatants for undefined fields
        sanitizedCombatants.forEach((c, i) => {
            Object.entries(c).forEach(([k, v]) => {
                if (v === undefined) {
                    console.error(`Combatant[${i}] undefined field:`, k, c);
                }
            });
        });
        await updateDoc(sessionRef, {
            combatants: sanitizedCombatants
        });
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center font-cinzel text-rpg-gold animate-pulse">
                Carregando visão da taverna...
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <h1 className="text-4xl font-bold font-cinzel text-red-500 mb-4 tracking-wider">Acesso Negado</h1>
                <p className="text-rpg-parchment font-medieval text-xl">{error || "Sessão inválida."}</p>
                <Link href="/" className="mt-8 bg-rpg-gold text-rpg-dark px-8 py-2 rounded font-bold font-cinzel hover:scale-105 transition-all">
                    Voltar para Início
                </Link>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col font-lato">

            {/* HEADER */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-30 backdrop-blur-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl">⚔️</Link>
                        <div>
                            <h1 className="text-2xl font-bold font-cinzel text-rpg-gold text-shadow-md">Campo de Batalha</h1>
                            <p className="text-[10px] text-rpg-grey uppercase tracking-widest leading-none">Mestre: {session.hostName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-black/40 border border-rpg-gold/20 px-3 py-1 rounded text-xs font-cinzel text-rpg-gold">
                            ID: {session.id}
                        </div>
                        <button
                            className="bg-rpg-gold/10 hover:bg-rpg-gold/20 border border-rpg-gold/40 text-rpg-gold text-[10px] px-3 py-1 rounded font-bold uppercase transition-all"
                            onClick={async () => {
                                if (isHost && session) {
                                    const sessionRef = doc(db, 'arenas_online', session.id);
                                    await updateDoc(sessionRef, { phase: 'preparation' });
                                    await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(sessionRef));
                                }
                                window.location.href = '/';
                            }}
                        >
                            Sair da Batalha
                        </button>
                    </div>
                </div>
            </header>

            {/* STATUS BAR */}
            <section className="bg-rpg-slate/40 border-b border-rpg-gold/10 p-4 sticky top-[68px] z-20 backdrop-blur-md">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Rodada</span>
                            <span className="text-xl font-bold text-rpg-gold font-medieval">{session.round}</span>
                        </div>
                        <div className="flex flex-col border-l border-white/10 pl-8">
                            <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Turno de</span>
                            <div className="flex items-center gap-3">
                                {/* Botões de turno só para host */}
                                {isHost ? (
                                    <>
                                        <button
                                            onClick={() => handleHostAdvanceTurn('prev')}
                                            className="text-rpg-gold hover:text-white transition-all scale-125"
                                            title="Turno Anterior"
                                        >
                                            ◀
                                        </button>
                                        <span className="text-xl font-bold text-rpg-parchment font-medieval">
                                            {currentCombatant?.name || "Aguardando"}
                                        </span>
                                        <button
                                            onClick={() => handleHostAdvanceTurn('next')}
                                            className="text-rpg-gold hover:text-white transition-all scale-125"
                                            title="Próximo Turno"
                                        >
                                            ▶
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-xl font-bold text-rpg-parchment font-medieval">
                                        {currentCombatant?.name || "Aguardando"}
                                    </span>
                                )}
                            </div>
                            {/* Feedback para jogadores não-host */}
                            {!isHost && (
                                <div className="mt-2 text-xs text-rpg-grey italic flex items-center gap-2">
                                    <span>⏳ Aguardando o mestre avançar o turno...</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        {session.phase !== 'combat' && (
                            <button
                                onClick={openJoinModal}
                                className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-4 py-1.5 rounded font-bold font-cinzel text-sm shadow-glow-gold/20 flex items-center gap-2 transition-all hover:scale-105"
                            >
                                <span>➕</span> Participar do Combate
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* COMBAT LIST */}
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                <div className="max-w-3xl mx-auto flex flex-col gap-3">
                    {session.combatants.map((c, index) => {
                        const isCurrent = index === session.turnIndex;
                        const isPlayer = c.type === 'player';
                        const isOwnHero = user && c.ownerId === user.uid;
                        const showFullHP = isHost || isOwnHero;

                        return (
                            <div
                                key={c.id}
                                className={`
                                    relative bg-rpg-panel border rounded-lg p-3 transition-all
                                    ${session.phase === 'combat' && isCurrent ? 'border-rpg-gold ring-1 ring-rpg-gold/30 shadow-glow-gold/10 scale-[1.02]' : 'border-white/5 opacity-80'}
                                    ${c.hp <= 0 ? 'grayscale opacity-40' : ''}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Iniciativa */}
                                    <div className="w-10 h-10 rounded bg-rpg-slate border border-rpg-gold/20 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[8px] text-rpg-grey font-cinzel leading-none uppercase">Ini</span>
                                        <span className="text-lg font-bold font-medieval text-rpg-gold">{c.initiative}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold font-medieval text-rpg-parchment truncate">
                                                {c.name}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-widest border
                                                ${c.type === 'monster' ? 'bg-red-900/30 text-red-100 border-red-500/30' :
                                                    c.type === 'npc' ? 'bg-blue-900/30 text-blue-100 border-blue-500/30' :
                                                        'bg-rpg-gold/20 text-rpg-gold border-rpg-gold/30'}`}>
                                                {c.type === 'monster' ? '?' : c.type === 'npc' ? 'NPC' : 'Herói'}
                                            </span>
                                            {c.externalId && (
                                                <Link
                                                    href={`/personagem/${c.externalId}`}
                                                    target="_blank"
                                                    className="text-[8px] text-rpg-gold hover:text-white uppercase font-bold border border-rpg-gold/20 px-2 py-0.5 rounded ml-2"
                                                >
                                                    👁️ Ficha
                                                </Link>
                                            )}
                                            {isOwnHero && (
                                                <button
                                                    onClick={() => setIsEffectModalOpen(true)}
                                                    className="text-[8px] bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 uppercase font-bold border border-purple-500/20 px-2 py-0.5 rounded ml-1"
                                                >
                                                    ✨ Ativar Efeito
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {c.statusEffects.map(eff => (
                                                <div key={eff.id} className="group relative">
                                                    <span className="text-[9px] bg-purple-900/30 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                                                        ✨ {eff.name} ({eff.duration})
                                                        {(isOwnHero || isHost) && (
                                                            <button
                                                                onClick={() => handleRemoveEffect(c.id, eff.id)}
                                                                className="ml-1 text-red-400 hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Encerrar Efeito"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* HP BAR (Player View) */}
                                    <div className="flex items-center gap-3">
                                        {/* HP só para host ou dono do personagem */}
                                        {showFullHP ? (
                                            <div className="w-32 md:w-48 shrink-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] uppercase font-cinzel text-rpg-grey">{getHpStatusLabel(c)}</span>
                                                    <span className="text-[10px] font-bold text-rpg-parchment">{c.hp}/{c.maxHp}</span>
                                                </div>
                                                <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${c.hp / c.maxHp > 0.5 ? 'bg-green-600' : c.hp / c.maxHp > 0.2 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                                        style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-32 md:w-48 flex items-center justify-end">
                                                <span className="text-[10px] font-cinzel text-rpg-grey italic tracking-widest bg-white/5 px-2 py-1 rounded">Status Desconhecido</span>
                                            </div>
                                        )}

                                        {isHost && (
                                            <div className="flex items-center bg-black/40 rounded border border-white/10 overflow-hidden">
                                                <button
                                                    onClick={() => handleHostUpdateHp(c.id, -1)}
                                                    className="px-2 py-1 text-red-500 hover:bg-red-500/10 transition-all font-bold"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => handleHostUpdateHp(c.id, 1)}
                                                    className="px-2 py-1 text-green-500 hover:bg-green-500/10 transition-all font-bold border-l border-white/10"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Button */}
                <div className="md:hidden fixed bottom-6 right-6 z-40">
                    {session.phase !== 'combat' && (
                        <button
                            onClick={openJoinModal}
                            className="bg-rpg-gold text-rpg-dark p-4 rounded-full shadow-2xl animate-bounce border-2 border-rpg-dark"
                            title="Participar do Combate"
                        >
                            ➕
                        </button>
                    )}
                </div>
            </main>

            {/* MODAL JOIN */}
            <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Convocação de Herói">
                <div className="space-y-6">
                    <div>
                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-2">Escolha seu Personagem</label>
                        <select
                            value={selectedCharId}
                            onChange={(e) => setSelectedCharId(e.target.value)}
                            className="w-full bg-rpg-slate border border-rpg-gold/20 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                        >
                            <option value="">-- Selecione seu herói --</option>
                            {myCharacters.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Lvl {c.level} {c.class})</option>
                            ))}
                        </select>
                        {myCharacters.length === 0 && (
                            <p className="text-[10px] text-red-400 mt-2 font-medieval">Você não possui personagens criados.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-2">Iniciativa da Rodada</label>
                        <input
                            type="number"
                            value={joinInitiative}
                            onChange={(e) => setJoinInitiative(Number(e.target.value))}
                            className="w-full bg-rpg-slate border border-rpg-gold/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none text-2xl text-center font-bold"
                            placeholder="Resultado do dado..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsJoinModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleJoinBattle}
                            disabled={!selectedCharId || isJoining}
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel shadow-glow-gold/20 transition-all disabled:opacity-50"
                        >
                            {isJoining ? 'Entrando...' : 'Entrar na Arena'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* MODAL EFEITOS (Para Jogadores) */}
            <Modal isOpen={isEffectModalOpen} onClose={() => setIsEffectModalOpen(false)} title="Ativar Magia / Habilidade">
                <div className="space-y-4">
                    <p className="text-xs text-rpg-grey italic mb-2">Escolha o efeito que você ativou na mesa real:</p>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { name: 'Bênção (Bless)', d: 10 },
                            { name: 'Fúria (Rage)', d: 10 },
                            { name: 'Invisível', d: 10 },
                            { name: 'Escudo Fé', d: 10 },
                            { name: 'Abençoado', d: 10 },
                            { name: 'Concentração', d: 10 },
                            { name: 'Velocidade', d: 10 },
                            { name: 'Voar', d: 10 },
                        ].map(eff => (
                            <button
                                key={eff.name}
                                onClick={() => handlePlayerAddEffect(eff.name, eff.d)}
                                className="bg-rpg-slate border border-white/5 p-2 rounded text-[10px] font-cinzel text-rpg-parchment hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-left flex items-center gap-2"
                            >
                                <span className="text-purple-400">✨</span> {eff.name}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-white/5 pt-4">
                        <label className="block text-[10px] uppercase font-cinzel text-rpg-grey mb-2">Efeito Personalizado</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customEffName}
                                    onChange={(e) => setCustomEffName(e.target.value)}
                                    className="flex-grow bg-rpg-slate border border-white/10 p-2 rounded text-xs text-rpg-parchment outline-none focus:border-purple-500"
                                    placeholder="Ex: Pele de Árvore"
                                />
                                <div className="w-20">
                                    <input
                                        type="number"
                                        value={customEffDur}
                                        onChange={(e) => setCustomEffDur(Number(e.target.value))}
                                        className="w-full bg-rpg-slate border border-white/10 p-2 rounded text-xs text-rpg-parchment outline-none focus:border-purple-500 text-center"
                                        placeholder="Rodadas"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (customEffName) {
                                        handlePlayerAddEffect(customEffName, customEffDur);
                                        setCustomEffName('');
                                    }
                                }}
                                disabled={!customEffName || (cooldowns[customEffName] && Date.now() < cooldowns[customEffName])}
                                className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                            >
                                Adicionar Efeito
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
