'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import Modal from '@/components/Modal';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { npcTemplates, NPCTemplate } from '@/lib/npc-combatants-data';

// Função utilitária para rolar 1d20
function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

// Função para obter modificador de Destreza (default 0)
function getDexMod(combatant: Combatant) {
    // Se houver atributo de destreza, usar, senão 0
    if (combatant && typeof combatant.dexterity === 'number') {
        return Math.floor((combatant.dexterity - 10) / 2);
    }
    // Tenta buscar por nome nos monstros/NPCs
    const monster = dndMonsters.find(m => m.name === combatant.name);
    if (monster && typeof monster.dexterity === 'number') {
        return Math.floor((monster.dexterity - 10) / 2);
    }
    // NPCs não têm destreza definida, default 0
    return 0;
}

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
    xp: number;
    initiative: number;
    statusEffects: StatusEffect[];
    dexterity?: number;
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
    const router = useRouter();

    // --- Estados Principais ---
    const [phase, setPhase] = useState<'preparation' | 'initiative' | 'combat'>('preparation');
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    // Função para rolar iniciativa automática para monstros e NPCs sem valor definido
    function rollInitiativeForMonstersAndNPCs() {
        setCombatants(prev => prev.map(c => {
            if ((c.type === 'monster' || c.type === 'npc') && (!c.initiative || c.initiative === 0)) {
                // Tenta buscar modificador de destreza do monstro (se existir)
                let dexMod = 0;
                const monster = dndMonsters.find(m => m.name === c.name);
                if (monster && typeof monster.dexterity === 'number') {
                    dexMod = Math.floor((monster.dexterity - 10) / 2);
                }
                // NPCs: default 0
                return { ...c, initiative: rollD20() + dexMod };
            }
            return c;
        }));
    }
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [round, setRound] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [onlineSessionId, setOnlineSessionId] = useState<string | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    // --- Estados de Modais ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
    const [xpDonationActive, setXpDonationActive] = useState(false);
    const [xpSummary, setXpSummary] = useState({ totalXp: 0, xpPerPlayer: 0, playerCount: 0 });
    const [fallenHeroesStatus, setFallenHeroesStatus] = useState<Record<string, 'dead' | 'revive'>>({});

    // --- Estados de Formulário ---
    const [availablePlayers, setAvailablePlayers] = useState<PlayerReference[]>([]);
    const [newCombatant, setNewCombatant] = useState({
        name: '',
        type: 'monster' as CombatantType,
        hp: 10,
        ac: 10,
        cr: '0',
        xp: 0,
        initiative: '' as string | number,
        playerId: '',
        quantity: 1
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

        // Encontrar o primeiro combatente vivo para começar
        let firstAliveIndex = sorted.findIndex(c => c.hp > 0);
        if (firstAliveIndex === -1) firstAliveIndex = 0;

        setCurrentTurnIndex(firstAliveIndex);
        setPhase('combat');
    };

    const nextTurn = () => {
        if (combatants.length === 0) return;

        let nextIndex = currentTurnIndex;
        let nextRound = round;
        let attempts = 0;

        // Procurar o próximo combatente vivo
        do {
            nextIndex = (nextIndex + 1) % combatants.length;
            if (nextIndex === 0) {
                nextRound++;
            }
            attempts++;
            // Se dermos a volta e todos estiverem mortos, paramos
            if (attempts >= combatants.length) break;
        } while (combatants[nextIndex].hp <= 0);

        setRound(nextRound);
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

    const createOnlineSession = async () => {
        if (!user) {
            alert("Você precisa estar logado para criar uma sessão online.");
            return;
        }
        if (combatants.length === 0) {
            alert("Adicione pelo menos um combatente antes de iniciar uma sessão online.");
            return;
        }

        setIsCreatingSession(true);
        try {
            const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const sessionRef = doc(db, 'arenas_online', shortId);

            await setDoc(sessionRef, {
                id: shortId,
                hostId: user.uid,
                hostName: user.displayName || 'Mestre',
                phase: phase,
                round: round,
                turnIndex: currentTurnIndex,
                combatants: combatants.map(c => {
                    const clean = { ...c };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                }),
                createdAt: new Date().toISOString()
            });

            setOnlineSessionId(shortId);
            alert(`Sessão Online criada! ID: ${shortId}. Use o link para convidar seus jogadores.`);
        } catch (err) {
            console.error("Erro ao criar sessão online:", err);
            alert("Não foi possível criar a sessão online.");
        } finally {
            setIsCreatingSession(false);
        }
    };

    // Sincronizar estado local com o Firestore se uma sessão online estiver ativa
    useEffect(() => {
        if (!onlineSessionId || !user) return;

        const sessionRef = doc(db, 'arenas_online', onlineSessionId);

        // Listener para mudanças externas (Jogadores entrando ou adicionando efeitos)
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const cloudCombatants = data.combatants as Combatant[];

                // Se houver novos combatentes ou mudança nos efeitos dos existentes
                let hasChanges = false;

                // Verifica novos combatentes
                const hasNewCombatants = cloudCombatants.some(cc => !combatants.some(lc => lc.id === cc.id));
                if (hasNewCombatants) hasChanges = true;

                // Verifica atualizações de efeitos (especialmente vindos de jogadores)
                const merged = combatants.map(localC => {
                    const cloudC = cloudCombatants.find(cc => cc.id === localC.id);
                    if (cloudC) {
                        // Verifica se há NOVOS efeitos na nuvem que não temos localmente
                        const newCloudEffects = cloudC.statusEffects.filter(ce =>
                            !localC.statusEffects.some(le => le.id === ce.id)
                        );

                        if (newCloudEffects.length > 0) {
                            hasChanges = true;
                            // Adiciona apenas os novos, mantendo o estado atual (duração) dos existentes
                            return {
                                ...localC,
                                statusEffects: [...localC.statusEffects, ...newCloudEffects]
                            };
                        }
                    }
                    return localC;
                });

                // Adiciona os novos que não existiam
                cloudCombatants.forEach(cc => {
                    if (!merged.some(lc => lc.id === cc.id)) {
                        merged.push(cc);
                    }
                });

                if (hasChanges) {
                    if (phase === 'combat') {
                        // Tenta manter a ordem atual mas com dados atualizados
                        setCombatants(prev => {
                            // Reconstroi a lista baseada na ordem atual (que pode ser diferente da merged sorted inicial)
                            // Apenas atualiza os dados dos combatentes existentes e anexa os novos no fim (ou reordena tudo?)
                            // Melhor reordenar tudo pela iniciativa se for combate para consistência
                            // Mas se o mestre mudou algo manualmente, pode ser confuso.
                            // Vamos confiar no sort de iniciativa padrão por enquanto.
                            return merged.sort((a, b) => b.initiative - a.initiative);
                        });
                    } else {
                        setCombatants(merged);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [onlineSessionId, user, combatants, phase]);

    // Enviar atualizações do Mestre para a nuvem
    useEffect(() => {
        if (!onlineSessionId || !user) return;

        const syncState = async () => {
            try {
                const sessionRef = doc(db, 'arenas_online', onlineSessionId);
                // Sanitiza combatentes e efeitos
                const sanitizedCombatants = combatants.map(c => {
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
                    phase: phase,
                    round: round,
                    turnIndex: currentTurnIndex,
                    combatants: sanitizedCombatants
                });
            } catch (err) {
                console.error("Erro ao sincronizar sessão online:", err);
            }
        };

        const timeout = setTimeout(syncState, 500); // Debounce leve
        return () => clearTimeout(timeout);
    }, [phase, round, currentTurnIndex, combatants, onlineSessionId, user]);

    const finishCombat = () => {
        const defeatedEnemies = combatants.filter(c => (c.type === 'monster' || c.type === 'npc') && c.hp === 0);
        const totalXp = defeatedEnemies.reduce((acc, c) => acc + (c.xp || 0), 0);
        const players = combatants.filter(c => c.type === 'player');
        const playerCount = players.length;
        const xpPerPlayer = playerCount > 0 ? Math.floor(totalXp / playerCount) : 0;

        setXpSummary({ totalXp, xpPerPlayer, playerCount });

        // Inicializar status de heróis caídos
        const casualties: Record<string, 'dead' | 'revive'> = {};
        combatants.filter(c => c.type === 'player' && c.hp <= 0).forEach(p => {
            casualties[p.id] = 'dead';
        });
        setFallenHeroesStatus(casualties);

        setIsXPModalOpen(true);

        // Se for sessão online, encerra após XP
        if (onlineSessionId && user) {
            setTimeout(async () => {
                const sessionRef = doc(db, 'arenas_online', onlineSessionId);
                await import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(sessionRef));
                console.log('Sessão online encerrada automaticamente após o fim do combate.');
            }, 3000); // 3 segundos para garantir XP distribuído
        }
    };

    const handleAwardXP = async () => {
        if (!xpDonationActive) {
            // Distribuir XP automaticamente
            const players = combatants.filter(c => c.type === 'player' && c.externalId);
            if (players.length > 0) {
                try {
                    const promises = players.map(async (p) => {
                        const pRef = doc(db, 'personagens', p.externalId!);
                        const updates: any = {
                            experience: increment(xpSummary.xpPerPlayer)
                        };

                        // Lógica de Reviver se selecionado no modal
                        if (fallenHeroesStatus[p.id] === 'revive') {
                            updates.currentHp = 1;
                        }

                        await updateDoc(pRef, updates);
                    });
                    await Promise.all(promises);
                    alert(`Sucesso! ${xpSummary.xpPerPlayer} XP adicionados à ficha de cada jogador.`);
                } catch (err) {
                    console.error("Erro ao distribuir XP:", err);
                    alert("Erro ao atualizar fichas. Verifique o console.");
                }
            }
        } else {
            alert("Modo de Doação Ativo: O XP não foi adicionado automaticamente. O mestre deve ajustar manualmente se necessário.");
        }

        setIsXPModalOpen(false);
        setRound(1);
        setCurrentTurnIndex(0);
        setPhase('preparation');
        router.push('/'); // Retornar ao Dashboard após finalizar
    };

    const clearCombat = () => {
        if (confirm("Deseja limpar o campo de batalha? Todos os combatentes serão removidos.")) {
            setCombatants([]);
            setRound(1);
            setCurrentTurnIndex(0);
            setPhase('preparation');
        }
    };

    const handleExitArena = () => {
        router.push('/');
    };

    // --- Adicionar/Remover ---

    const handleAddCombatant = (e: React.FormEvent) => {
        e.preventDefault();

        const qty = (newCombatant.type === 'monster' || newCombatant.type === 'npc') ? (newCombatant.quantity || 1) : 1;
        const newItems: Combatant[] = [];

        for (let i = 0; i < qty; i++) {
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
                        cr: `Lvl ${p.level}`,
                        xp: 0 // Players don't give XP
                    };
                }
            } else if (qty > 1) {
                // Adicionar sufixo se houver múltiplos
                name = `${name} ${i + 1}`;
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
                xp: newCombatant.xp || 0,
                initiative: initiativeValue,
                statusEffects: [],
                ...extraData
            };
            newItems.push(newItem);
        }

        const updatedList = [...combatants, ...newItems];

        if (phase === 'combat') {
            // Reordenar e manter o turno no combatente atual
            const currentId = combatants[currentTurnIndex]?.id;
            const sorted = updatedList.sort((a, b) => b.initiative - a.initiative);
            const newIndex = sorted.findIndex(c => c.id === currentId);

            setCombatants(sorted);
            if (newIndex !== -1) {
                setCurrentTurnIndex(newIndex);
            }
            alert(`${qty} combatentes entraram na batalha!`);
        } else {
            // Preparação ou Iniciativa: apenas adiciona
            setCombatants(updatedList);
        }

        setNewCombatant({ ...newCombatant, name: '', initiative: '', playerId: '', quantity: 1 });
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

            {phase === 'preparation' && (
                <header className="bg-rpg-panel p-3 sm:p-4 shadow-lg border-b-2 border-rpg-gold/30 relative sm:sticky top-0 z-30 backdrop-blur-sm">
                    <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-xl sm:text-2xl" title="Voltar">
                                ⚔️
                            </Link>
                            <h1 className="text-xl sm:text-3xl font-bold font-cinzel text-rpg-gold text-shadow-md truncate">Arena de Combate</h1>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex-grow sm:flex-grow-0 bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark p-2 px-4 sm:px-6 rounded font-bold font-cinzel text-xs sm:text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-glow-gold/20"
                            >
                                + Adicionar
                            </button>
                            {onlineSessionId ? (
                                <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 p-1 px-3 rounded">
                                    <span className="text-[10px] font-cinzel text-green-400">ONLINE: {onlineSessionId}</span>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/arena/${onlineSessionId}`;
                                            navigator.clipboard.writeText(url);
                                            alert("Link de convite copiado!");
                                        }}
                                        className="bg-green-600 hover:bg-green-500 text-white text-[10px] px-2 py-1 rounded font-bold"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={createOnlineSession}
                                    disabled={isCreatingSession || combatants.length === 0}
                                    className="flex-grow sm:flex-grow-0 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-2 px-3 sm:px-4 rounded font-bold font-cinzel text-[10px] sm:text-sm transition-all shadow-glow-sky/20 active:scale-95"
                                >
                                    {isCreatingSession ? 'Gerando...' : 'Iniciar Sessão Online'}
                                </button>
                            )}
                            <button
                                onClick={handleExitArena}
                                className="text-rpg-grey hover:text-rpg-parchment flex items-center gap-2 font-medieval text-xs sm:text-base px-2"
                            >
                                <span>&larr;</span> Sair
                            </button>
                            {onlineSessionId && user && (
                                <button
                                    className="bg-red-700 hover:bg-red-800 text-white px-4 py-1 rounded font-bold font-cinzel text-sm ml-2"
                                    onClick={async () => {
                                        try {
                                            const sessionRef = doc(db, 'arenas_online', onlineSessionId);
                                            await deleteDoc(sessionRef);
                                        } catch (err) {
                                            console.error('Erro ao apagar sessão online:', err);
                                        }
                                    }}
                                >
                                    Apagar Sessão Online
                                </button>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {/* CONTROLS BAR */}
            <section className="bg-rpg-slate/40 border-b border-rpg-gold/10 px-2 py-3 sm:p-4 sticky top-0 sm:top-[74px] z-20 backdrop-blur-md">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full md:w-auto">
                        {/* Indicador de Fase */}
                        {phase !== 'combat' && (
                            <div className="flex gap-1 sm:gap-4 items-center justify-center w-full">
                                <span className={`text-[9px] sm:text-[10px] uppercase font-cinzel px-1.5 sm:px-2 py-1 rounded border transition-all ${phase === 'preparation' ? 'bg-rpg-gold text-rpg-dark border-rpg-gold font-bold' : 'text-rpg-grey border-white/10'}`}>1. Preparação</span>
                                <span className="text-rpg-grey/20 hidden xs:inline">→</span>
                                <span className={`text-[9px] sm:text-[10px] uppercase font-cinzel px-1.5 sm:px-2 py-1 rounded border transition-all ${phase === 'initiative' ? 'bg-rpg-gold text-rpg-dark border-rpg-gold font-bold' : 'text-rpg-grey border-white/10'}`}>2. Iniciativa</span>
                                <span className="text-rpg-grey/20 hidden xs:inline">→</span>
                                <span className="text-[9px] sm:text-[10px] uppercase font-cinzel px-1.5 sm:px-2 py-1 rounded border transition-all text-rpg-grey border-white/10">3. Combate</span>
                            </div>
                        )}

                        {phase === 'combat' && (
                            <div className="flex items-center justify-center gap-6 sm:gap-8 w-full sm:w-auto">
                                <div className="flex flex-col items-center sm:items-start">
                                    <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Rodada</span>
                                    <span className="text-xl sm:text-2xl font-bold text-rpg-gold font-medieval">{round}</span>
                                </div>
                                <div className="flex flex-col items-center sm:items-start">
                                    <span className="text-[10px] text-rpg-grey uppercase font-cinzel tracking-widest">Turno de</span>
                                    <span className="text-xl sm:text-2xl font-bold text-rpg-parchment font-medieval truncate max-w-[150px]">
                                        {combatants[currentTurnIndex]?.name || "Finalizado"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full md:w-auto mt-1 sm:mt-0">
                        {phase === 'preparation' && (
                            <>
                                <button
                                    onClick={clearCombat}
                                    className="flex-1 sm:flex-none bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-500/30 p-2 px-3 sm:px-4 rounded font-bold font-cinzel text-[10px] sm:text-sm active:scale-95"
                                >
                                    💀 <span className="hidden sm:inline">Limpar Tudo</span><span className="sm:hidden">Limpar</span>
                                </button>
                                <button
                                    onClick={() => setPhase('initiative')}
                                    disabled={combatants.length === 0}
                                    className="flex-[2] sm:flex-none bg-sky-700 hover:bg-sky-600 text-white p-2.5 sm:p-3 px-6 sm:px-8 rounded font-bold font-cinzel text-xs sm:text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
                                >
                                    Fase de Iniciativa &rarr;
                                </button>
                            </>
                        )}

                        {phase === 'initiative' && (
                            <>
                                <button
                                    onClick={() => setPhase('preparation')}
                                    className="text-rpg-grey hover:text-white font-medieval px-2 sm:px-4 text-xs sm:text-base"
                                >
                                    &larr; <span className="sm:inline">Voltar</span>
                                </button>
                                <button
                                    onClick={rollInitiativeForMonstersAndNPCs}
                                    className="flex-1 sm:flex-none bg-sky-700 hover:bg-sky-600 text-white p-2.5 sm:p-3 px-4 sm:px-8 rounded font-bold font-cinzel text-[10px] sm:text-sm transition-all active:scale-95"
                                >
                                    🎲 <span className="hidden sm:inline">Iniciativa Auto</span><span className="sm:hidden">Auto</span>
                                </button>
                                <button
                                    onClick={startCombat}
                                    className="flex-[2] sm:flex-none bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-2.5 sm:p-3 px-6 sm:px-8 rounded font-bold font-cinzel text-xs sm:text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-glow-gold/40 border-2 border-rpg-gold/50"
                                >
                                    ⚔️ Iniciar Arena
                                </button>
                            </>
                        )}

                        {phase === 'combat' && (
                            <>
                                <button
                                    onClick={finishCombat}
                                    className="text-rpg-gold hover:text-white font-medieval px-3 sm:px-4 border border-rpg-gold/20 rounded hover:bg-rpg-gold/10 transition-all text-xs sm:text-base"
                                >
                                    Encerrar
                                </button>
                                <button
                                    onClick={nextTurn}
                                    className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-2.5 sm:p-3 px-6 sm:px-8 rounded font-bold font-cinzel text-xs sm:text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-glow-gold/40 border-2 border-rpg-gold/50"
                                >
                                    Próximo Turno &rarr;
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* INITIATIVE LIST */}
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                {combatants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 sm:p-20 border-2 border-dashed border-rpg-grey/20 rounded-xl bg-rpg-panel/30 text-center">
                        <div className="text-4xl sm:text-6xl mb-4 opacity-30">⚔️</div>
                        <h2 className="text-xl sm:text-2xl font-cinzel text-rpg-grey">O campo de batalha está vazio...</h2>
                        <p className="text-sm sm:text-base text-rpg-grey font-medieval">Adicione heróis e monstros para começar a iniciativa.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-6 text-rpg-gold hover:underline font-cinzel animate-pulse text-sm sm:text-base"
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
                                ${c.hp <= 0 ? 'grayscale opacity-50 border-red-900/50 scale-[0.98]' : ''}
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

                                    {c.hp <= 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                            <div className="bg-red-950/80 border-2 border-red-500 text-red-100 p-2 px-6 rounded-lg font-cinzel font-bold text-xl rotate-12 shadow-2xl">
                                                {c.type === 'player' ? '☠️ CAÍDO' : '☠️ MORTO'}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-2 sm:p-4">
                                        {/* Iniciativa */}
                                        <div className={`
                                            rounded-lg w-12 h-12 sm:w-16 sm:h-16 flex flex-col items-center justify-center border shrink-0 transition-all
                                            ${phase === 'initiative' ? 'bg-sky-900/40 border-sky-500 shadow-glow-sky' : 'bg-rpg-slate border-rpg-gold/20'}
                                        `}>
                                            <span className="text-[8px] sm:text-[10px] text-rpg-grey uppercase font-cinzel">Ini</span>
                                            {phase === 'initiative' ? (
                                                <input
                                                    type="number"
                                                    value={c.initiative}
                                                    onChange={(e) => updateInitiative(c.id, Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    className="bg-transparent text-xl sm:text-2xl font-bold font-medieval text-white w-full text-center focus:outline-none"
                                                    autoFocus={index === 0}
                                                />
                                            ) : (
                                                <span className="text-xl sm:text-2xl font-bold font-medieval text-rpg-gold">{c.initiative}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-grow min-w-0 w-full">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                                <h3 className={`text-lg sm:text-2xl font-bold font-medieval truncate max-w-[150px] sm:max-w-none ${phase === 'combat' && isCurrent ? 'text-rpg-parchment' : 'text-rpg-parchment/70'}`}>
                                                    {c.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] uppercase font-bold tracking-widest border
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
                                                            className="text-rpg-gold hover:text-rpg-gold-light bg-rpg-gold/5 p-1 rounded border border-rpg-gold/20 flex items-center gap-1 text-[8px] sm:text-[10px] uppercase font-bold px-2 transition-all hover:bg-rpg-gold/10"
                                                        >
                                                            👁️ <span className="hidden xs:inline">Ficha</span>
                                                        </Link>
                                                    )}
                                                </div>

                                                <div className="flex gap-1.5 sm:gap-2 ml-auto">
                                                    <div className="flex flex-col items-center justify-center bg-rpg-panel border border-rpg-gold/20 rounded px-1.5 sm:px-2 min-w-[32px] sm:min-w-[40px]">
                                                        <span className="text-[7px] sm:text-[8px] text-rpg-grey uppercase font-cinzel">CA</span>
                                                        <span className="text-[10px] sm:text-xs font-bold text-rpg-gold">{c.ac}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center bg-rpg-panel border border-white/5 rounded px-1.5 sm:px-2 min-w-[32px] sm:min-w-[40px]">
                                                        <span className="text-[7px] sm:text-[8px] text-rpg-grey uppercase font-cinzel">CR</span>
                                                        <span className="text-[10px] sm:text-xs font-bold text-rpg-parchment">{c.cr}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center bg-rpg-panel border border-rpg-gold/10 rounded px-1.5 sm:px-2 min-w-[32px] sm:min-w-[40px] hidden xs:flex">
                                                        <span className="text-[7px] sm:text-[8px] text-rpg-grey uppercase font-cinzel">XP</span>
                                                        <span className="text-[10px] sm:text-xs font-bold text-rpg-gold-light">{c.xp}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Detalhes Extra no Combat */}
                                            {phase === 'combat' && (
                                                <div className="mt-1">
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mb-1">
                                                        {c.statusEffects.map(effect => (
                                                            <div key={effect.id} className="bg-purple-900/40 border border-purple-500/30 rounded px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2">
                                                                <span className="text-purple-100 font-bold">✨ {effect.name}</span>
                                                                <span className="bg-purple-500 text-white px-1 sm:px-1 rounded-full text-[8px] sm:text-[10px]">{effect.duration}</span>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => { setSelectedCombatantId(c.id); setIsEffectModalOpen(true); }}
                                                            className="text-rpg-grey hover:text-rpg-gold text-[8px] sm:text-[10px] uppercase font-bold tracking-tighter ml-1"
                                                        >
                                                            + Efeito
                                                        </button>
                                                    </div>

                                                    {(c.class || c.level) && (
                                                        <div className="text-[8px] sm:text-[10px] text-rpg-grey font-cinzel uppercase flex flex-wrap gap-2">
                                                            {c.class && <span>{c.class}</span>}
                                                            {c.level && <span>• Nível {c.level}</span>}
                                                            <button
                                                                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                                                className="text-rpg-gold hover:underline lowercase ml-1"
                                                            >
                                                                {isExpanded ? "[Ocultar]" : "[Detalhes]"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Barra de HP (Escondida na Iniciativa para focar) */}
                                        {phase !== 'initiative' && (
                                            <div className="w-full sm:w-48 md:w-64 shrink-0 flex items-center gap-2 sm:gap-3 mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                                <div className="flex-grow group relative">
                                                    <div className="h-3 sm:h-4 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${c.hp / c.maxHp > 0.5 ? 'bg-green-600' : c.hp / c.maxHp > 0.2 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                                            style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between mt-0.5 sm:mt-1 px-1">
                                                        <span className="text-[10px] sm:text-xs font-medieval">{c.hp} / {c.maxHp} HP</span>
                                                        <span className="text-[8px] sm:text-[10px] text-rpg-grey font-medieval">Vida</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => updateHP(c.id, -1)}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-red-900/40 border border-red-500/30 flex items-center justify-center hover:bg-red-800 text-red-500 font-bold active:scale-95"
                                                    >
                                                        -
                                                    </button>
                                                    <button
                                                        onClick={() => updateHP(c.id, 1)}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-green-900/40 border border-green-500/30 flex items-center justify-center hover:bg-green-800 text-green-500 font-bold active:scale-95"
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
                                                className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto text-red-500/40 hover:text-red-500 p-2 transition-colors sm:ml-2"
                                                title="Remover do Combate"
                                            >
                                                ✖
                                            </button>
                                        )}
                                    </div>

                                    {/* Detalhes Expandidos (Equipamentos/Magias) */}
                                    {isExpanded && (
                                        <div className="px-4 sm:px-8 pb-4 pt-2 border-t border-rpg-gold/10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-fade-in bg-black/20">
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
                    <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
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
                                            className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
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
                                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nome do Herói</label>
                                            <input
                                                type="text"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
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
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.hp}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, hp: Number(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">
                                                Iniciativa {phase !== 'preparation' && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.initiative}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value })}
                                                onFocus={(e) => e.target.select()}
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
                                            className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                            onChange={(e) => {
                                                if (newCombatant.type === 'monster') {
                                                    const m = dndMonsters.find(dm => dm.name === e.target.value);
                                                    if (m) {
                                                        setNewCombatant({
                                                            ...newCombatant,
                                                            name: m.name,
                                                            hp: m.hp,
                                                            ac: m.ac,
                                                            cr: m.challenge,
                                                            xp: m.xp
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
                                                            cr: n.challenge,
                                                            xp: n.xp
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

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="col-span-2 sm:col-span-4">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Nome Personalizado</label>
                                            <input
                                                type="text"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                placeholder="Nome..."
                                                value={newCombatant.name}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">HP</label>
                                            <input
                                                type="number"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.hp}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, hp: Number(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">CA</label>
                                            <input
                                                type="number"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.ac}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, ac: Number(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">CR</label>
                                            <input
                                                type="text"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.cr}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, cr: e.target.value })}
                                                placeholder="Ex: 5"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">XP</label>
                                            <input
                                                type="number"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.xp}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, xp: Number(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Ini {phase !== 'preparation' && <span className="text-red-500">*</span>}</label>
                                            <input
                                                type="number"
                                                className="w-full bg-rpg-slate border border-white/10 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                value={newCombatant.initiative}
                                                onChange={(e) => setNewCombatant({ ...newCombatant, initiative: e.target.value })}
                                                onFocus={(e) => e.target.select()}
                                                required={phase !== 'preparation'}
                                                placeholder="0"
                                            />
                                        </div>
                                        {(newCombatant.type === 'monster' || newCombatant.type === 'npc') && (
                                            <div className="col-span-1">
                                                <label className="block text-rpg-gold text-xs uppercase font-cinzel mb-1">Qtd</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    className="w-full bg-rpg-slate border border-rpg-gold/30 p-2 text-sm sm:p-3 sm:text-base rounded font-medieval text-rpg-parchment focus:border-rpg-gold outline-none"
                                                    value={newCombatant.quantity}
                                                    onChange={(e) => setNewCombatant({ ...newCombatant, quantity: Number(e.target.value) || 1 })}
                                                    onFocus={(e) => e.target.select()}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark p-3 px-8 rounded font-bold font-cinzel transition-all order-1 sm:order-2"
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
                            onChange={(e) => setNewEffect({ ...newEffect, duration: Number(e.target.value) || 1 })}
                            onFocus={(e) => e.target.select()}
                            required
                        />
                        <p className="text-[10px] text-rpg-grey mt-1">O efeito diminuirá 1 rodada no início de cada turno deste combatente.</p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsEffectModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white p-3 px-8 rounded font-bold font-cinzel shadow-glow-purple/20 transition-all order-1 sm:order-2"
                        >
                            Aplicar Magia
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL XP SUMMARY */}
            <Modal isOpen={isXPModalOpen} onClose={() => setIsXPModalOpen(false)} title="Resumo de Recompensas">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-rpg-slate p-4 rounded-lg border border-rpg-gold/20 text-center">
                            <span className="text-[10px] text-rpg-gold uppercase font-cinzel block mb-1">XP Total Acumulado</span>
                            <span className="text-3xl font-bold text-rpg-parchment font-medieval">{xpSummary.totalXp}</span>
                        </div>
                        <div className="bg-rpg-slate p-4 rounded-lg border border-white/5 text-center">
                            <span className="text-[10px] text-rpg-grey uppercase font-cinzel block mb-1">XP por Jogador</span>
                            <span className="text-3xl font-bold text-rpg-parchment font-medieval">{xpSummary.xpPerPlayer}</span>
                        </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded border border-white/5">
                        <h4 className="text-xs font-bold text-rpg-gold uppercase font-cinzel mb-2 tracking-widest">Participantes ({xpSummary.playerCount} Heróis)</h4>
                        <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                            {combatants.filter(c => c.type === 'player').map(p => (
                                <div key={p.id} className="text-sm font-medieval flex justify-between">
                                    <span className={p.hp <= 0 ? 'line-through text-rpg-grey' : ''}>• {p.name} {p.hp <= 0 && '(Caído)'}</span>
                                    <span className="text-rpg-gold">+{xpSummary.xpPerPlayer} XP</span>
                                </div>
                            ))}
                            {xpSummary.playerCount === 0 && <p className="text-xs text-rpg-grey italic text-center">Nenhum jogador na arena para receber XP.</p>}
                        </div>
                    </div>

                    {/* BAIXAS NO COMBATE */}
                    {combatants.some(c => c.type === 'player' && c.hp <= 0) && (
                        <div className="bg-red-900/10 p-4 rounded border border-red-500/30">
                            <h4 className="text-xs font-bold text-red-400 uppercase font-cinzel mb-3 tracking-widest flex items-center gap-2">
                                <span>💀</span> Baixas no Combate
                            </h4>
                            <div className="space-y-3">
                                {combatants.filter(c => c.type === 'player' && c.hp <= 0).map(p => (
                                    <div key={p.id} className="flex flex-col sm:flex-row items-center justify-between bg-black/20 p-2 rounded gap-2">
                                        <span className="font-medieval text-sm">{p.name}</span>
                                        <div className="flex bg-rpg-slate rounded overflow-hidden border border-white/10 text-[10px] font-cinzel">
                                            <button
                                                type="button"
                                                onClick={() => setFallenHeroesStatus(prev => ({ ...prev, [p.id]: 'dead' }))}
                                                className={`px-3 py-1 transition-all ${fallenHeroesStatus[p.id] === 'dead' ? 'bg-red-600 text-white' : 'text-rpg-grey hover:bg-red-900/40'}`}
                                            >
                                                Declarar Óbito
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFallenHeroesStatus(prev => ({ ...prev, [p.id]: 'revive' }))}
                                                className={`px-3 py-1 transition-all ${fallenHeroesStatus[p.id] === 'revive' ? 'bg-blue-600 text-white' : 'text-rpg-grey hover:bg-blue-900/40'}`}
                                            >
                                                Reviver (História)
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-rpg-grey mt-2 italic leading-tight">* &quot;Reviver&quot; colocará o personagem com 1 HP na ficha. &quot;Óbito&quot; manterá o status de 0 HP.</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-rpg-gold/5 border border-rpg-gold/20 rounded">
                        <input
                            type="checkbox"
                            id="donatingXp"
                            checked={xpDonationActive}
                            onChange={(e) => setXpDonationActive(e.target.checked)}
                            className="w-5 h-5 rounded border-rpg-gold/30 text-rpg-gold bg-rpg-dark focus:ring-rpg-gold cursor-pointer"
                        />
                        <div className="flex-grow">
                            <label htmlFor="donatingXp" className="font-bold text-rpg-gold text-sm cursor-pointer select-none">Doar XP (Manual)</label>
                            <p className="text-[10px] text-rpg-grey leading-tight">Marque se o XP deve ser distribuído manualmente fora do sistema (ex: doar para outro personagem).</p>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => setIsXPModalOpen(false)}
                            className="p-3 px-6 font-medieval text-rpg-grey hover:text-white order-2 sm:order-1"
                        >
                            Continuar Luta
                        </button>
                        <button
                            type="button"
                            onClick={handleAwardXP}
                            className="bg-green-700 hover:bg-green-600 text-white p-3 px-8 rounded font-bold font-cinzel shadow-glow-green/20 transition-all order-1 sm:order-2"
                        >
                            Confirmar & Finalizar
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
