'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Modal from '@/components/Modal';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { npcTemplates, NPCTemplate } from '@/lib/npc-combatants-data';

// --- Tipos ---

type CombatantType = 'player' | 'monster' | 'npc';

interface StatusEffect {
    id: string;
    name: string;
    duration: number; // Em rodadas
}

interface Combatant {
    id: string;
    externalId?: string; // ID do documento no Firebase se for player
    name: string;
    type: CombatantType;
    hp: number;
    maxHp: number;
    ac: number;
    cr: string;
    initiative: number;
    statusEffects: StatusEffect[];
    // Detalhes extras do banco
    class?: string;
    level?: number;
    equipment?: string[];
    spells?: string[];
    abilities?: string[];
}

interface PlayerReference {
    id: string;
    name: string;
    hp: number;
    class: string;
    level: number;
    equipment: string[];
    spells: string[];
    abilities: string[];
}

export default function ConfrontosPage() {
    const { user } = useAuth();

    // --- Estados Principais ---
    const [phase, setPhase] = useState<'preparation' | 'initiative' | 'combat'>('preparation');
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // --- Estados de Modais ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
    const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);

    // --- Estados de Formulário ---
    const [availablePlayers, setAvailablePlayers] = useState<PlayerReference[]>([]);
    const [newCombatant, setNewCombatant] = useState({
        name: '',
        type: 'monster' as CombatantType,
        hp: 10,
        ac: 10,
        cr: '0',
        initiative: '' as string | number,
        playerId: ''
    });
    const [newEffect, setNewEffect] = useState({
        name: '',
        duration: 1
    });

    // Carregar personagens do usuário para seleção
    useEffect(() => {
        if (!user) {
            setAvailablePlayers([]);
            return;
        }

        // Query simples para evitar problemas de índice
        const q = query(collection(db, 'personagens'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const players: PlayerReference[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Mapeamento robusto para suportar diferentes versões da ficha
                const hp = data.currentHp || data.hp?.current || data.hp?.max || data.maxHp || 10;

                players.push({
                    id: doc.id,
                    name: data.name || 'Sem Nome',
                    hp: hp,
                    class: data.class || data.classe || '',
                    level: data.level || data.nivel || 1,

                    // Suporta equipamento como string (importado) ou array (manual)
                    equipment: Array.isArray(data.features?.equipment) ? data.features.equipment :
                        (typeof data.equipment === 'string' ? [data.equipment] : []),

                    // Magias e Habilidades
                    spells: Array.isArray(data.spells) ? data.spells.map((s: any) => s.name || s) : [],
                    abilities: Array.isArray(data.features) ? data.features.map((f: any) => f.name || f) : []
                });
            });
            console.log("Jogadores carregados na Arena:", players.length);
            setAvailablePlayers(players);
        }, (err) => {
            console.error("Erro ao seguir personagens na Arena:", err);
        });

        return () => unsubscribe();
    }, [user]);

    // --- Lógica de Combate ---

    const startCombat = () => {
        if (combatants.length === 0) {
            alert("Adicione combatentes antes de começar!");
            return;
        }
        // Ordenar antes de começar o combate propriamente dito
        const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
        setCombatants(sorted);
        setCurrentTurnIndex(0);
        setPhase('combat');
    };

    const nextTurn = () => {
        if (combatants.length === 0) return;

        let nextIndex = (currentTurnIndex + 1) % combatants.length;
        let nextRound = round;

        if (nextIndex === 0) {
            nextRound = round + 1;
            setRound(nextRound);
        }

        setCurrentTurnIndex(nextIndex);

        // Lógica de Efeitos: Diminuir duração ao INICIAR o turno do combatente
        const updatedCombatants = combatants.map((c, idx) => {
            if (idx === nextIndex) {
                return {
                    ...c,
                    statusEffects: c.statusEffects
                        .map(e => ({ ...e, duration: e.duration - 1 }))
                        .filter(e => e.duration > 0)
                };
            }
            return c;
        });
        setCombatants(updatedCombatants);
    };

    const resetCombat = () => {
        if (confirm("Deseja resetar o combate? Todos os combatentes serão mantidos, mas a ordem e rodada voltarão ao início.")) {
            setRound(1);
            setCurrentTurnIndex(0);
            setPhase('preparation');
        }
    };

    const clearCombat = () => {
        if (confirm("Deseja limpar o campo de batalha? Todos os combatentes serão removidos.")) {
            setCombatants([]);
            setRound(1);
            setCurrentTurnIndex(0);
            setPhase('preparation');
        }
    };

    // --- Adicionar/Remover ---

    const handleAddCombatant = (e: React.FormEvent) => {
        e.preventDefault();

        let name = newCombatant.name;
        let hp = newCombatant.hp;
        let externalId = undefined;
        let extraData: Partial<Combatant> = {};

        if (newCombatant.type === 'player' && newCombatant.playerId) {
            const p = availablePlayers.find(ap => ap.id === newCombatant.playerId);
            if (p) {
                name = p.name;
                hp = p.hp;
                externalId = p.id;
                extraData = {
                    class: p.class,
                    level: p.level,
                    equipment: p.equipment,
                    spells: p.spells,
                    abilities: p.abilities,
                    ac: 10, // Default for players if not in ref
                    cr: `Lvl ${p.level}`
                };
            }
        }

        if (phase !== 'preparation' && (newCombatant.initiative === '' || isNaN(Number(newCombatant.initiative)))) {
            alert("É obrigatório definir um valor de iniciativa para entrar no combate!");
            return;
        }

        const initiativeValue = Number(newCombatant.initiative) || 0;

        const newItem: Combatant = {
            id: Math.random().toString(36).substr(2, 9),
            externalId,
            name,
            type: newCombatant.type,
            hp,
            maxHp: hp,
            ac: newCombatant.ac || 10,
            cr: newCombatant.cr || '0',
            initiative: initiativeValue,
            statusEffects: [],
            ...extraData
        };

        const updatedList = [...combatants, newItem];

        if (phase === 'combat') {
            // Reordenar e manter o turno no combatente atual
            const currentId = combatants[currentTurnIndex]?.id;
            const sorted = updatedList.sort((a, b) => b.initiative - a.initiative);
            const newIndex = sorted.findIndex(c => c.id === currentId);

            setCombatants(sorted);
            if (newIndex !== -1) {
                setCurrentTurnIndex(newIndex);
            }
            alert(`${name} entrou na batalha na posição de iniciativa ${initiativeValue}!`);
        } else if (phase === 'initiative') {
            // Apenas adiciona, a ordenação virá no "Iniciar Combate"
            setCombatants(updatedList);
        } else {
            // Preparação: apenas adiciona no fim da lista
            setCombatants(updatedList);
        }

        setNewCombatant({ ...newCombatant, name: '', initiative: '', playerId: '' });
        setIsAddModalOpen(false);
    };
    const removeCombatant = (id: string) => {
        setCombatants(combatants.filter(c => c.id !== id));
    };

    const updateHP = (id: string, amount: number) => {
        setCombatants(combatants.map(c => {
            if (c.id === id) {
                return { ...c, hp: Math.max(0, c.hp + amount) };
            }
            return c;
        }));
    };

    const updateInitiative = (id: string, value: number) => {
        setCombatants(combatants.map(c => {
            if (c.id === id) {
                return { ...c, initiative: value };
            }
            return c;
        }));
    };

    const addEffect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCombatantId) return;

        const effect: StatusEffect = {
            id: Math.random().toString(36).substr(2, 9),
            name: newEffect.name,
            duration: newEffect.duration
        };

        setCombatants(combatants.map(c => {
            if (c.id === selectedCombatantId) {
                return { ...c, statusEffects: [...c.statusEffects, effect] };
            }
            return c;
        }));

        setNewEffect({ name: '', duration: 1 });
        setIsEffectModalOpen(false);
    };

    // --- Renderização ---

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col font-lato">

            {/* HEADER */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-30 backdrop-blur-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl" title="Voltar">
                            ⚔️
                        </Link>
                        <h1 className="text-3xl font-bold font-cinzel text-rpg-gold text-shadow-md">Arena de Combate</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark p-2 px-6 rounded font-bold font-cinzel transition-all transform hover:scale-105 shadow-glow-gold/20"
                        >
                            + Adicionar
                        </button>
                        <Link href="/" className="text-rpg-grey hover:text-rpg-parchment flex items-center gap-2 font-medieval">
                            <span>&larr;</span> Sair
                        </Link>
                    </div>
                </div>
            </header>

            {/* CONTROLS BAR */}
            <section className="bg-rpg-slate/40 border-b border-rpg-gold/10 p-4 sticky top-[74px] z-20 backdrop-blur-md">
                <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-8">
                        {/* Indicador de Fase */}
                        <div className="flex gap-4 items-center">
                            <span className={`text-[10px] uppercase font-cinzel px-2 py-1 rounded border ${phase === 'preparation' ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'text-rpg-grey border-white/10'}`}>1. Preparação</span>
                            <span className="text-rpg-grey/20">→</span>
                            <span className={`text-[10px] uppercase font-cinzel px-2 py-1 rounded border ${phase === 'initiative' ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'text-rpg-grey border-white/10'}`}>2. Iniciativa</span>
                            <span className="text-rpg-grey/20">→</span>
                            <span className={`text-[10px] uppercase font-cinzel px-2 py-1 rounded border ${phase === 'combat' ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'text-rpg-grey border-white/10'}`}>3. Combate</span>
                        </div>

                        {phase === 'combat' && (
                            <div className="flex items-center gap-8 ml-4 border-l border-white/10 pl-8">
                                <div className="flex flex-col">
                                    <span className="text-xs text-rpg-grey uppercase font-cinzel tracking-widest">Rodada</span>
                                    <span className="text-2xl font-bold text-rpg-gold font-medieval">{round}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-rpg-grey uppercase font-cinzel tracking-widest">Turno de</span>
                                    <span className="text-2xl font-bold text-rpg-parchment font-medieval">
                                        {combatants[currentTurnIndex]?.name || "Finalizado"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {phase === 'preparation' && (
                            <>
                                <button
                                    onClick={clearCombat}
                                    className="bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-500/30 p-2 px-4 rounded font-bold font-cinzel text-sm"
                                >
                                    💀 Limpar Tudo
                                </button>
                                <button
                                    onClick={() => setPhase('initiative')}
                                    disabled={combatants.length === 0}
                                    className="bg-sky-700 hover:bg-sky-600 text-white p-3 px-8 rounded font-bold font-cinzel transition-all transform hover:scale-105"
                                >
                                    Pronto para Iniciativa &rarr;
                                </button>
                            </>
                        )}

                        {phase === 'initiative' && (
                            <>
                                <button
                                    onClick={() => setPhase('preparation')}
                                    className="text-rpg-grey hover:text-white font-medieval px-4"
                                >
                                    &larr; Voltar
                                </button>
                                <button
                                    onClick={startCombat}
                                    className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel transition-all transform hover:scale-105 shadow-glow-gold/40 border-2 border-rpg-gold/50"
                                >
                                    ⚔️ Ordenar e Iniciar Combate
                                </button>
                            </>
                        )}

                        {phase === 'combat' && (
                            <>
                                <button
                                    onClick={resetCombat}
                                    className="text-rpg-grey hover:text-white font-medieval px-4"
                                >
                                    Terminar Combate
                                </button>
                                <button
                                    onClick={nextTurn}
                                    className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel transition-all transform hover:scale-105 shadow-glow-gold/40 border-2 border-rpg-gold/50"
                                >
                                    Próxima Jogada &rarr;
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* INITIATIVE LIST */}
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                {combatants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-rpg-grey/20 rounded-xl bg-rpg-panel/30">
                        <div className="text-6xl mb-4 opacity-30">⚔️</div>
                        <h2 className="text-2xl font-cinzel text-rpg-grey">O campo de batalha está vazio...</h2>
                        <p className="text-rpg-grey font-medieval">Adicione heróis e monstros para começar a iniciativa.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-6 text-rpg-gold hover:underline font-cinzel animate-pulse"
                        >
                            + Iniciar Chamado de Batalha
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                        {combatants.map((c, index) => {
                            const isCurrent = index === currentTurnIndex;
                            const isExpanded = expandedId === c.id;
                            return (
                                <div
                                    key={c.id}
                                    className={`
                                relative bg-rpg-panel border-2 rounded-lg p-1 transition-all
                                ${phase === 'combat' && isCurrent
                                            ? 'border-rpg-gold shadow-glow-gold/40 translate-x-4'
                                            : 'border-rpg-gold/10 opacity-75'}
                                ${phase === 'initiative' ? 'border-sky-500/40 shadow-glow-sky' : ''}
                            `}
                                >
                                    {phase === 'combat' && isCurrent && (
                                        <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl animate-bounce-right">
                                            🔱
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row items-center gap-4 p-4">
                                        {/* Iniciativa */}
                                        <div className={`
                                            rounded-lg w-16 h-16 flex flex-col items-center justify-center border shrink-0 transition-all
                                            ${phase === 'initiative' ? 'bg-sky-900/40 border-sky-500 shadow-glow-sky' : 'bg-rpg-slate border-rpg-gold/20'}
                                        `}>
                                            <span className="text-[10px] text-rpg-grey uppercase font-cinzel">Ini</span>
                                            {phase === 'initiative' ? (
                                                <input
                                                    type="number"
                                                    value={c.initiative}
                                                    onChange={(e) => updateInitiative(c.id, Number(e.target.value))}
                                                    className="bg-transparent text-2xl font-bold font-medieval text-white w-full text-center focus:outline-none"
                                                    autoFocus={index === 0}
                                                />
                                            ) : (
                                                <span className="text-2xl font-bold font-medieval text-rpg-gold">{c.initiative}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className={`text-2xl font-bold font-medieval truncate ${phase === 'combat' && isCurrent ? 'text-rpg-parchment' : 'text-rpg-parchment/70'}`}>
                                                    {c.name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border
                                            ${c.type === 'monster' ? 'bg-red-900/30 text-red-100 border-red-500/30' :
                                                        c.type === 'npc' ? 'bg-blue-900/30 text-blue-100 border-blue-500/30' :
                                                            'bg-rpg-gold/20 text-rpg-gold border-rpg-gold/30'}`}>
                                                    {c.type === 'monster' ? 'Monstro' : c.type === 'npc' ? 'NPC' : 'Player'}
                                                </span>

                                                {/* Link para Ficha */}
                                                {c.externalId && phase !== 'initiative' && (
                                                    <Link
                                                        href={`/personagem/${c.externalId}`}
                                                        target="_blank"
                                                        className="text-rpg-gold hover:text-rpg-gold-light bg-rpg-gold/5 p-1 rounded border border-rpg-gold/20 flex items-center gap-1 text-[10px] uppercase font-bold px-2 transition-all hover:bg-rpg-gold/10"
                                                    >
                                                        👁️ Ficha
                                                    </Link>
                                                )}

                                                <div className="flex gap-2 ml-auto">
                                                    <div className="flex flex-col items-center justify-center bg-rpg-panel border border-rpg-gold/20 rounded px-2 min-w-[40px]">
                                                        <span className="text-[8px] text-rpg-grey uppercase font-cinzel">CA</span>
                                                        <span className="text-xs font-bold text-rpg-gold">{c.ac}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center bg-rpg-panel border border-white/5 rounded px-2 min-w-[40px]">
                                                        <span className="text-[8px] text-rpg-grey uppercase font-cinzel">CR</span>
                                                        <span className="text-xs font-bold text-rpg-parchment">{c.cr}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detalhes Extra no Combat */}
                                            {phase === 'combat' && (
                                                <>
                                                    <div className="flex flex-wrap gap-2 items-center mb-2">
                                                        {c.statusEffects.map(effect => (
                                                            <div key={effect.id} className="bg-purple-900/40 border border-purple-500/30 rounded px-2 py-0.5 text-xs flex items-center gap-2">
                                                                <span className="text-purple-100 font-bold">✨ {effect.name}</span>
                                                                <span className="bg-purple-500 text-white px-1 rounded-full text-[10px]">{effect.duration}</span>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => { setSelectedCombatantId(c.id); setIsEffectModalOpen(true); }}
                                                            className="text-rpg-grey hover:text-rpg-gold text-[10px] uppercase font-bold tracking-tighter"
                                                        >
                                                            + Adicionar Efeito
                                                        </button>
                                                    </div>

                                                    {(c.class || c.level) && (
                                                        <div className="text-[10px] text-rpg-grey font-cinzel uppercase flex gap-2">
                                                            {c.class && <span>{c.class}</span>}
                                                            {c.level && <span>• Nível {c.level}</span>}
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                                                className="text-rpg-gold hover:underline lowercase ml-2"
                                                            >
                                                                {isExpanded ? "[Ocultar detalhes]" : "[Ver equipamentos/magias]"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Barra de HP (Escondida na Iniciativa para focar) */}
                                        {phase !== 'initiative' && (
                                            <div className="w-full md:w-64 shrink-0 flex items-center gap-3">
                                                <div className="flex-grow group relative">
                                                    <div className="h-4 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${c.hp / c.maxHp > 0.5 ? 'bg-green-600' : c.hp / c.maxHp > 0.2 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                                            style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between mt-1 px-1">
                                                        <span className="text-xs font-medieval">{c.hp} / {c.maxHp} HP</span>
                                                        <span className="text-[10px] text-rpg-grey font-medieval">Vida</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => updateHP(c.id, -1)}
                                                        className="w-8 h-8 rounded bg-red-900/40 border border-red-500/30 flex items-center justify-center hover:bg-red-800 text-red-500 font-bold"
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        onClick={() => updateHP(c.id, 1)}
                                                        className="w-8 h-8 rounded bg-green-900/40 border border-green-500/30 flex items-center justify-center hover:bg-green-800 text-green-500 font-bold"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Ações de Card (Apenas na Preparação) */}
                                        {phase === 'preparation' && (
                                            <button
                                                onClick={() => removeCombatant(c.id)}
                                                className="text-red-500/20 hover:text-red-500 p-2 transition-colors ml-2"
                                                title="Remover do Combate"
                                            >
                                                ✖
                                            </button>
                                        )}
                                    </div>

                                    {/* Detalhes Expandidos (Equipamentos/Magias) */}
                                    {isExpanded && (
                                        <div className="px-8 pb-4 pt-2 border-t border-rpg-gold/10 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in bg-black/20">
                                            <div>
                                                <h4 className="text-[10px] text-rpg-gold uppercase font-cinzel mb-2 border-b border-rpg-gold/10">Equipamento</h4>
                                                <ul className="text-xs font-medieval space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {(c.equipment && c.equipment.length > 0) ? c.equipment.map((item, i) => (
                                                        <li key={i} className="text-rpg-parchment/70">• {item}</li>
                                                    )) : <li className="text-rpg-grey italic">Nenhum item.</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] text-sky-400 uppercase font-cinzel mb-2 border-b border-sky-400/10">Magias</h4>
                                                <ul className="text-xs font-medieval space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {(c.spells && c.spells.length > 0) ? c.spells.map((spell, i) => (
                                                        <li key={i} className="text-sky-100/70">• {spell}</li>
                                                    )) : <li className="text-rpg-grey italic">Sem magias.</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] text-purple-400 uppercase font-cinzel mb-2 border-b border-purple-400/10">Habilidades</h4>
                                                <ul className="text-xs font-medieval space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {(c.abilities && c.abilities.length > 0) ? c.abilities.map((ability, i) => (
                                                        <li key={i} className="text-purple-100/70">• {ability}</li>
                                                    )) : <li className="text-rpg-grey italic">Sem habilidades extras.</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="text-center p-4 text-rpg-grey/30 font-medieval text-xs">
                D&D Campanha e Álcool © 2026 | Arena de Preparação e Combate
            </footer>

            {/* MODAL ADICIONAR */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Convocação de Combate">
                <form onSubmit={handleAddCombatant} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Tipo de Unidade</label>
                            <div className="flex gap-2">
                                {['monster', 'npc', 'player'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewCombatant({ ...newCombatant, type: type as CombatantType, playerId: '' })}
                                        className={`flex-1 p-2 rounded border font-medieval capitalize transition-all
                                    ${newCombatant.type === type
                                                ? 'bg-rpg-gold text-rpg-dark border-rpg-gold shadow-glow-gold/20'
                                                : 'bg-rpg-slate text-rpg-grey border-white/10 hover:border-rpg-gold/30'}`}
                                    >
                                        {type === 'player' ? 'Jogador' : type === 'npc' ? 'NPC' : 'Monstro'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {newCombatant.type === 'player' ? (
                            <div className="col-span-1 sm:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Importar da Taverna (Opcional)</label>
                                    <select
                                        className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                        value={newCombatant.playerId}
                                        onChange={(e) => {
                                            const p = availablePlayers.find(ap => ap.id === e.target.value);
                                            if (p) {
                                                setNewCombatant({
                                                    ...newCombatant,
                                                    playerId: e.target.value,
                                                    name: p.name,
                                                    hp: p.hp
                                                });
                                            } else {
                                                setNewCombatant({ ...newCombatant, playerId: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">-- Herói Desconhecido --</option>
                                        {availablePlayers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.class} Lvl {p.level})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nome do Herói</label>
                                        <input
                                            type="text"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            placeholder="Nome do Jogador..."
                                            value={newCombatant.name}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Vida Total (HP)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.hp}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, hp: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">
                                            Iniciativa {phase !== 'preparation' && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.initiative}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value })}
                                            required={phase !== 'preparation'}
                                            placeholder={phase !== 'preparation' ? "Número..." : "0"}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="col-span-1 sm:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">
                                        Selecionar da Biblioteca ({newCombatant.type === 'monster' ? 'Monstros' : 'NPCs'})
                                    </label>
                                    <select
                                        className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                        onChange={(e) => {
                                            if (newCombatant.type === 'monster') {
                                                const m = dndMonsters.find(dm => dm.name === e.target.value);
                                                if (m) {
                                                    setNewCombatant({
                                                        ...newCombatant,
                                                        name: m.name,
                                                        hp: m.hp,
                                                        ac: m.ac,
                                                        cr: m.challenge
                                                    });
                                                }
                                            } else {
                                                const n = npcTemplates.find(nt => nt.name === e.target.value);
                                                if (n) {
                                                    setNewCombatant({
                                                        ...newCombatant,
                                                        name: n.name,
                                                        hp: n.hp,
                                                        ac: n.ac,
                                                        cr: n.challenge
                                                    });
                                                }
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Escolha um {newCombatant.type === 'monster' ? 'Monstro' : 'NPC'} --</option>
                                        {newCombatant.type === 'monster'
                                            ? dndMonsters.map(m => (
                                                <option key={m.name} value={m.name}>{m.name} (CR {m.challenge} • {m.hp} HP)</option>
                                            ))
                                            : npcTemplates.map(n => (
                                                <option key={n.name} value={n.name}>{n.name} (CR {n.challenge} • {n.hp} HP)</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nome Personalizado</label>
                                        <input
                                            type="text"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            placeholder="Nome..."
                                            value={newCombatant.name}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Vida Total (HP)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.hp}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, hp: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Classe de Armadura (CA)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.ac}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, ac: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nível de Desafio (CR)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.cr}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, cr: e.target.value })}
                                            placeholder="Ex: 1/4, 5, etc"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Iniciativa {phase !== 'preparation' && <span className="text-red-500">*</span>}</label>
                                        <input
                                            type="number"
                                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            value={newCombatant.initiative}
                                            onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value })}
                                            required={phase !== 'preparation'}
                                            placeholder={phase !== 'preparation' ? "Número..." : "0"}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel transition-all"
                        >
                            Adicionar à Arena
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL EFEITO */}
            <Modal isOpen={isEffectModalOpen} onClose={() => setIsEffectModalOpen(false)} title="Adicionar Bênção ou Maldição">
                <form onSubmit={addEffect} className="space-y-4">
                    <div>
                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nome do Efeito</label>
                        <input
                            type="text"
                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                            placeholder="Fúria, Envenenado, Benção..."
                            value={newEffect.name}
                            onChange={(e) => setNewEffect({ ...newEffect, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Duração (Rodadas)</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full bg-rpg-slate border border-white/10 p-3 rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                            value={newEffect.duration}
                            onChange={(e) => setNewEffect({ ...newEffect, duration: Number(e.target.value) })}
                            required
                        />
                        <p className="text-[10px] text-rpg-grey mt-1">O efeito diminuirá 1 rodada no início de cada turno deste combatente.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsEffectModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white p-3 px-8 rounded font-bold font-cinzel shadow-glow-purple/20 transition-all"
                        >
                            Aplicar Magia
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
