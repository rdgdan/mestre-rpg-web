'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import JSZip from 'jszip';
import { mapImportedDataToCharacter } from '@/lib/character-mapper';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { GameEffectTemplate } from '@/lib/effects-data';
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
    const router = useRouter();
    const pathname = usePathname();
    // @ts-ignore
    const { user, loading: authLoading } = useAuth();
    const [session, setSession] = useState<ArenaSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Join Battle states
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [myCharacters, setMyCharacters] = useState<PlayerCharacter[]>([]);
    const [selectedCharId, setSelectedCharId] = useState('');
    const [joinInitiative, setJoinInitiative] = useState<number>(0);
    const [isJoining, setIsJoining] = useState(false);
    const [isManualJoin, setIsManualJoin] = useState(false);
    const [manualChar, setManualChar] = useState({ name: '', class: 'Guerreiro', level: 1, hp: 10, ac: 10 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Host-only adjustments
    const [hpAdjustmentValues, sethpAdjustmentValues] = useState<Record<string, string>>({});

    // Removido: ações de jogador. Agora somente mestre controla efeitos globais.

    // Removido: carregamento de efeitos globais para jogadores

    // Helpers para renderização (definidos cedo para uso nas funções)
    const isHost = Boolean(session?.hostId && user?.uid && String(session.hostId) === String(user.uid));
    const currentCombatant = session?.combatants[session.turnIndex];

    const getHpStatusLabel = (c: Combatant) => {
        if (c.hp <= 0) return '💀 MORTO/CAÍDO';
        const percent = (c.hp / c.maxHp) * 100;
        if (percent > 75) return '🟩 Saudável';
        if (percent > 25) return '🟨 Ferido';
        return '🟥 Nas Últimas';
    };

    // Proteção de Rota: Redirecionar para login se não estiver autenticado
    useEffect(() => {
        if (authLoading === false && !user) {
            const returnUrl = encodeURIComponent(pathname || `/arena/${id}`);
            router.push(`/login?redirect=${returnUrl}`);
        }
    }, [user, authLoading, router, pathname, id]);

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
        if (!user || !session) return;
        if (!isManualJoin && !selectedCharId) return;

        // Validação básica manual
        if (isManualJoin && !manualChar.name) {
            alert("Preencha o nome do herói.");
            return;
        }

        setIsJoining(true);
        try {
            const sessionRef = doc(db, 'arenas_online', id as string);
            const updatedCombatants = [...session.combatants];

            if (isManualJoin) {
                // Criação de personagem temporário
                const newCombatant: Combatant = {
                    id: Math.random().toString(36).substr(2, 9),
                    externalId: 'manual_' + Math.random().toString(36).substr(2, 5),
                    name: manualChar.name,
                    type: 'player',
                    hp: manualChar.hp,
                    maxHp: manualChar.hp,
                    ac: manualChar.ac,
                    cr: `Lvl ${manualChar.level}`,
                    xp: 0,
                    initiative: joinInitiative,
                    statusEffects: [],
                    class: manualChar.class,
                    level: manualChar.level,
                    ownerId: user.uid
                };
                updatedCombatants.push(newCombatant);
            } else {
                const char = myCharacters.find(c => c.id === selectedCharId);
                if (!char) return;

                // Verifica se já existe para atualizar
                const existingIndex = updatedCombatants.findIndex(c => c.externalId === char.id);

                if (existingIndex > -1) {
                    updatedCombatants[existingIndex] = {
                        ...updatedCombatants[existingIndex],
                        name: char.name,
                        hp: char.hp,
                        maxHp: char.hp,
                        class: char.class,
                        level: char.level,
                        ownerId: user.uid,
                        initiative: joinInitiative
                    };
                } else {
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
            await updateDoc(sessionRef, {
                combatants: sanitizedCombatants
            });

            // Sincroniza com 'encounters' para o mestre ver o jogador entrar
            try {
                const encounterRef = doc(db, 'encounters', id as string);
                const encounterSnap = await getDoc(encounterRef);
                if (encounterSnap.exists()) {
                    const encounterData = encounterSnap.data();
                    const encounterCombatants = Array.isArray(encounterData.combatants) ? encounterData.combatants : [];

                    // Combatente recém-adicionado na arena
                    const newJoinedCombatant = sanitizedCombatants[sanitizedCombatants.length - 1];

                    // Verifica por id/externalId
                    const existingIndex = encounterCombatants.findIndex((c: Combatant) =>
                        (c.externalId && newJoinedCombatant.externalId && c.externalId === newJoinedCombatant.externalId) ||
                        c.id === newJoinedCombatant.id
                    );

                    let updatedEncounterCombatants;
                    if (existingIndex > -1) {
                        updatedEncounterCombatants = [...encounterCombatants];
                        updatedEncounterCombatants[existingIndex] = newJoinedCombatant;
                    } else {
                        updatedEncounterCombatants = [...encounterCombatants, newJoinedCombatant];
                    }

                    // Dedupe por externalId/id
                    const map = new Map<string, Combatant>();
                    for (const c of updatedEncounterCombatants) {
                        const key = String(c.externalId || c.id);
                        map.set(key, c);
                    }
                    const deduped = Array.from(map.values()).sort((a, b) => b.initiative - a.initiative);

                    await updateDoc(encounterRef, {
                        combatants: deduped
                    });
                }
            } catch (syncErr) {
                console.warn("Não foi possível sincronizar com encounters (sessão pode não estar iniciada)", syncErr);
                // Não falha se encounters não existir - mestre pode ter criado apenas arena
            }

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

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            const zip = await JSZip.loadAsync(file);
            const jsonFiles = zip.file(/\.json$/i);

            if (jsonFiles.length === 0) {
                alert("Arquivo inválido (.rpg sem json)");
                return;
            }

            const jsonData = JSON.parse(await jsonFiles[0].async("string"));
            const char = mapImportedDataToCharacter(jsonData, user.uid, '');

            // Preenche o formulário manual com dados do arquivo
            setManualChar({
                name: char.name,
                class: char.class || 'Aventureiro',
                level: char.level || 1,
                hp: char.maxHp || 10,
                ac: char.armorClass || 10
            });

            setIsManualJoin(true); // Força a aba manual
            alert(`Dados de "${char.name}" carregados! Clique em "Entrar na Arena" para confirmar.`);

        } catch (err) {
            console.error("Erro import:", err);
            alert("Erro ao ler arquivo. Verifique se é um arquivo .rpg válido.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Removidos: adicionar/remover efeitos por jogadores

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
                const inputValue = hpAdjustmentValues[combatantId];
                const adjustAmount = (inputValue && !isNaN(Number(inputValue))) ? Number(inputValue) : 1;
                const multiplier = delta > 0 ? 1 : -1;
                const totalAdjust = adjustAmount * multiplier;

                // Limpar o input após o uso
                sethpAdjustmentValues(prev => ({ ...prev, [combatantId]: '' }));

                return { ...c, hp: Math.min(c.maxHp, Math.max(0, c.hp + totalAdjust)) };
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
        await updateDoc(sessionRef, {
            combatants: sanitizedCombatants
        });
    };


    if (loading || authLoading) {
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
            {session.phase === 'preparation' && (
                <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 relative sm:sticky top-0 z-30 backdrop-blur-sm">
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl">⚔️</Link>
                            <div>
                                <h1 className="text-2xl font-bold font-cinzel text-rpg-gold text-shadow-md">Campo de Batalha</h1>
                                <p className="text-[10px] text-rpg-grey uppercase tracking-widest leading-none">Mestre: {session.hostName} {isHost && <span className="text-green-500 font-bold ml-1">(VOCÊ)</span>}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-black/40 border border-rpg-gold/20 px-3 py-1 rounded text-xs font-cinzel text-rpg-gold">
                                ID: {session.id}
                            </div>
                            <div className={`px-3 py-1 rounded text-[10px] font-bold font-cinzel border uppercase ${isHost ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-blue-900/30 text-blue-400 border-blue-500/30'}`}>
                                {isHost ? 'Modo Mestre' : 'Modo Jogador'}
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
            )}

            {/* STATUS BAR */}
            <section className={`bg-rpg-slate/40 border-b border-rpg-gold/10 sticky top-0 ${session.phase === 'preparation' ? 'sm:top-[74px]' : 'sm:top-0'} z-20 backdrop-blur-md transition-[top]`}>
                {/* VISÃO DO MESTRE - Expandida */}
                {isHost && (
                    <div className="p-4">
                        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            {/* Rodada */}
                            <div className="flex items-baseline gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Rodada</span>
                                    <span className="text-3xl font-bold text-rpg-gold font-medieval">{session.round}</span>
                                </div>
                            </div>

                            {/* Turno Atual */}
                            <div className="flex flex-col gap-2 flex-1 sm:flex-none">
                                <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Turno de</span>
                                <div className="flex items-center gap-3 bg-rpg-dark/50 border border-rpg-gold/20 rounded-lg p-3">
                                    <button
                                        onClick={() => handleHostAdvanceTurn('prev')}
                                        className="text-rpg-gold hover:text-white transition-all hover:scale-125 text-xl"
                                        title="Turno Anterior"
                                    >
                                        ◀
                                    </button>
                                    <span className="text-lg sm:text-xl font-bold text-rpg-parchment font-medieval flex-1">
                                        {currentCombatant?.name || "Aguardando"}
                                    </span>
                                    <button
                                        onClick={() => handleHostAdvanceTurn('next')}
                                        className="text-rpg-gold hover:text-white transition-all hover:scale-125 text-xl"
                                        title="Próximo Turno"
                                    >
                                        ▶
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISÃO DO JOGADOR - Compacta */}
                {!isHost && (
                    <div className="p-2 sm:p-3">
                        <div className="container mx-auto flex items-center justify-between gap-3">
                            {/* Rodada + Turno em uma linha */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-rpg-grey uppercase font-cinzel tracking-widest font-bold">Rodada</span>
                                    <span className="text-xl font-bold text-rpg-gold font-medieval">{session.round}</span>
                                </div>
                                <div className="text-white/20">|</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-rpg-grey uppercase font-cinzel tracking-widest font-bold">Turno</span>
                                    <span className="text-sm font-bold text-rpg-parchment font-medieval truncate max-w-xs">
                                        {currentCombatant?.name || "Aguardando"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* COMBAT LIST */}
            <main className="container mx-auto p-4 sm:p-6 flex-grow">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    {session.combatants.map((c, index) => {
                        const isCurrent = index === session.turnIndex;
                        const isPlayer = c.type === 'player';
                        const isOwnHero = user && c.ownerId === user.uid;
                        const showFullHP = (isHost === true) || (c.type === 'player' && isOwnHero === true);

                        return (
                            <div
                                key={c.id}
                                className={`
                                    relative bg-rpg-panel border rounded-lg p-4 transition-all
                                    ${session.phase === 'combat' && isCurrent ? 'border-rpg-gold ring-2 ring-rpg-gold/50 shadow-glow-gold/20 scale-[1.01]' : 'border-white/10 opacity-90 hover:opacity-100'}
                                    ${c.hp <= 0 ? 'grayscale opacity-50' : ''}
                                `}
                            >
                                {/* Header com Iniciativa e Nome */}
                                <div className="flex items-start gap-4 mb-4">
                                    {/* Iniciativa */}
                                    <div className="w-14 h-14 rounded-lg bg-rpg-slate/60 border border-rpg-gold/40 flex flex-col items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-[9px] text-rpg-grey font-cinzel leading-none uppercase font-bold">Ini</span>
                                        <span className="text-2xl font-bold font-medieval text-rpg-gold mt-1">{c.initiative}</span>
                                    </div>

                                    {/* Info do Combatente */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="text-xl sm:text-2xl font-bold font-medieval text-rpg-parchment truncate">
                                                {c.name}
                                            </h3>
                                            <span className={`px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-widest border
                                                ${c.type === 'monster' ? 'bg-red-900/40 text-red-200 border-red-500/40' :
                                                    c.type === 'npc' ? 'bg-blue-900/40 text-blue-200 border-blue-500/40' :
                                                        'bg-rpg-gold/30 text-rpg-gold border-rpg-gold/50'}`}>
                                                {c.type === 'monster' ? '🗡️ MONSTRO' : c.type === 'npc' ? '🤖 NPC' : '🛡️ HERÓI'}
                                            </span>
                                            {c.externalId && (
                                                <Link
                                                    href={`/personagem/${c.externalId}`}
                                                    target="_blank"
                                                    className="text-[9px] text-rpg-gold hover:text-white uppercase font-bold border border-rpg-gold/40 hover:border-rpg-gold px-2 py-1 rounded ml-auto transition-all"
                                                >
                                                    👁️ Ficha
                                                </Link>
                                            )}
                                        </div>

                                        {/* Efeitos Ativos */}
                                        {c.statusEffects.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {c.statusEffects.map(eff => (
                                                    <span
                                                        key={eff.id}
                                                        className="text-[9px] bg-purple-900/40 text-purple-200 px-2.5 py-1 rounded border border-purple-500/40 inline-flex items-center gap-1 font-cinzel"
                                                    >
                                                        ✨ {eff.name} ({eff.duration})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* HP Bar e Status */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    {showFullHP ? (
                                        // VISÃO COMPLETA (Mestre ou Dono)
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] uppercase font-cinzel text-rpg-grey font-bold">{getHpStatusLabel(c)}</span>
                                                    <span className="text-sm font-bold text-rpg-parchment font-medieval">{c.hp} / {c.maxHp}</span>
                                                </div>
                                                <div className="h-2.5 bg-rpg-slate/40 rounded-full border border-white/10 overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-500 rounded-full ${
                                                            c.hp / c.maxHp > 0.5
                                                                ? 'bg-gradient-to-r from-green-600 to-green-400'
                                                                : c.hp / c.maxHp > 0.2
                                                                ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                                                                : 'bg-gradient-to-r from-red-600 to-red-400'
                                                        }`}
                                                        style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Ajustes de HP (Host Only) */}
                                            {isHost && (
                                                <div className="flex items-center gap-2 bg-rpg-slate/30 rounded-lg border border-white/5 p-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Dano/Cura"
                                                        value={hpAdjustmentValues[c.id] || ''}
                                                        onChange={(e) => sethpAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                                if (value) handleHostUpdateHp(c.id, -value);
                                                            }
                                                        }}
                                                        className="flex-1 max-w-20 h-8 bg-rpg-dark/50 border border-white/10 rounded px-2 text-xs text-center focus:border-rpg-gold outline-none font-medieval"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                            if (value) {
                                                                handleHostUpdateHp(c.id, -value);
                                                                sethpAdjustmentValues(prev => ({ ...prev, [c.id]: '' }));
                                                            }
                                                        }}
                                                        className="h-8 px-3 flex items-center justify-center text-red-400 hover:bg-red-900/40 transition-all font-bold text-sm border border-red-500/30 rounded hover:border-red-500"
                                                    >
                                                        ✓ Aplicar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // VISÃO LIMITADA
                                        <div className="flex items-center justify-center p-3 bg-rpg-slate/30 rounded-lg border border-white/5">
                                            <span className="text-sm font-cinzel text-rpg-grey italic uppercase tracking-widest font-bold">
                                                {getHpStatusLabel(c)}
                                            </span>
                                        </div>
                                    )}
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
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setIsManualJoin(false)}
                            className={`flex-1 py-2 text-xs font-cinzel rounded border ${!isManualJoin ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'bg-transparent text-rpg-grey border-white/10'}`}
                        >
                            Meus Personagens
                        </button>
                        <button
                            onClick={() => setIsManualJoin(true)}
                            className={`flex-1 py-2 text-xs font-cinzel rounded border ${isManualJoin ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'bg-transparent text-rpg-grey border-white/10'}`}
                        >
                            Importar Herói
                        </button>
                    </div>

                    {!isManualJoin ? (
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
                                <p className="text-[10px] text-red-400 mt-2 font-medieval">
                                    Você não possui personagens criados. Use a aba &quot;Importar Herói&quot; para entrar manualmente.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 bg-black/20 p-3 rounded border border-white/5">
                            <div className="flex justify-end">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileImport}
                                    accept=".rpg"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] text-rpg-gold hover:underline flex items-center gap-1 font-cinzel"
                                >
                                    📂 Carregar arquivo .rpg
                                </button>
                            </div>
                            <div>
                                <label className="block text-rpg-gold text-[10px] uppercase font-cinzel mb-1">Nome do Herói</label>
                                <input
                                    type="text"
                                    value={manualChar.name}
                                    onChange={(e) => setManualChar({ ...manualChar, name: e.target.value })}
                                    className="w-full bg-rpg-slate border border-white/10 p-2 text-sm rounded font-medieval text-rpg-parchment outline-none focus:border-rpg-gold"
                                    placeholder="Ex: Aragorn"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-rpg-gold text-[10px] uppercase font-cinzel mb-1">Classe</label>
                                    <input
                                        type="text"
                                        value={manualChar.class}
                                        onChange={(e) => setManualChar({ ...manualChar, class: e.target.value })}
                                        className="w-full bg-rpg-slate border border-white/10 p-2 text-sm rounded font-medieval text-rpg-parchment outline-none focus:border-rpg-gold"
                                        placeholder="Ex: Guerreiro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-rpg-gold text-[10px] uppercase font-cinzel mb-1">Nível</label>
                                    <input
                                        type="number"
                                        value={manualChar.level}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setManualChar({ ...manualChar, level: Number(e.target.value) })}
                                        className="w-full bg-rpg-slate border border-white/10 p-2 text-sm rounded font-medieval text-rpg-parchment outline-none focus:border-rpg-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-rpg-gold text-[10px] uppercase font-cinzel mb-1">HP Máximo</label>
                                    <input
                                        type="number"
                                        value={manualChar.hp}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setManualChar({ ...manualChar, hp: Number(e.target.value) })}
                                        className="w-full bg-rpg-slate border border-white/10 p-2 text-sm rounded font-medieval text-rpg-parchment outline-none focus:border-rpg-gold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-rpg-gold text-[10px] uppercase font-cinzel mb-1">CA (Armor)</label>
                                    <input
                                        type="number"
                                        value={manualChar.ac}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setManualChar({ ...manualChar, ac: Number(e.target.value) })}
                                        className="w-full bg-rpg-slate border border-white/10 p-2 text-sm rounded font-medieval text-rpg-parchment outline-none focus:border-rpg-gold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-2">Iniciativa da Rodada</label>
                        <input
                            type="number"
                            value={joinInitiative}
                            onFocus={(e) => e.target.select()}
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
                            disabled={(!isManualJoin && !selectedCharId) || (isManualJoin && !manualChar.name) || isJoining}
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel shadow-glow-gold/20 transition-all disabled:opacity-50"
                        >
                            {isJoining ? 'Entrando...' : 'Entrar na Arena'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Removidos: modais de ações e efeitos do jogador */}
        </div>
    );
}
