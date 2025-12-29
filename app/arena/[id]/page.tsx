'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

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

    const isHost = user && user.uid === session.hostId;
    const currentCombatant = session.combatants[session.turnIndex];

    const getHpStatusLabel = (c: Combatant) => {
        if (c.hp <= 0) return '💀 MORTO/CAÍDO';
        const percent = (c.hp / c.maxHp) * 100;
        if (percent > 75) return '🟩 Saudável';
        if (percent > 25) return '🟨 Ferido';
        return '🟥 Nas Últimas';
    };

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
                        {isHost && (
                            <Link href="/confrontos" className="bg-rpg-gold/10 hover:bg-rpg-gold/20 border border-rpg-gold/40 text-rpg-gold text-[10px] px-3 py-1 rounded font-bold uppercase transition-all">
                                Painel do Mestre
                            </Link>
                        )}
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
                            <span className="text-xl font-bold text-rpg-parchment font-medieval">
                                {currentCombatant?.name || "Aguardando"}
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-xs text-rpg-grey font-medieval">A sincronização é automática. Fique atento!</span>
                    </div>
                </div>
            </section>

            {/* COMBAT LIST */}
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                <div className="max-w-3xl mx-auto flex flex-col gap-3">
                    {session.combatants.map((c, index) => {
                        const isCurrent = index === session.turnIndex;
                        const isPlayer = c.type === 'player';
                        const isOwnHero = isPlayer && user && c.externalId; // Simulação: se tiver externalId é player
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
                                        </div>

                                        {/* Status Effects */}
                                        <div className="flex flex-wrap gap-1">
                                            {c.statusEffects.map(eff => (
                                                <span key={eff.id} className="text-[9px] bg-purple-900/30 text-purple-200 px-1.5 rounded border border-purple-500/20">
                                                    ✨ {eff.name} ({eff.duration})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* HP BAR (Player View) */}
                                    {(isHost || isPlayer) ? (
                                        <div className="w-32 md:w-48 shrink-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] uppercase font-cinzel text-rpg-grey">{getHpStatusLabel(c)}</span>
                                                {showFullHP && <span className="text-[10px] font-bold text-rpg-parchment">{c.hp}/{c.maxHp}</span>}
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
