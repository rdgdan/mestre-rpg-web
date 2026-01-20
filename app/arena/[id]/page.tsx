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
import Toast from '@/components/ui/Toast';
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

    // State Declarations
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
    // Toast State
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleUpdateInitiative = async (combatantId: string, newInitiative: number) => {
        if (!session || !user) return;

        // Optimistic update (local visual feedback feels faster)
        // But here we rely on Firestore listener usually. 
        // Let's just update Firestore.

        try {
            const sessionRef = doc(db, 'arenas_online', id as string);
            const updatedCombatants = session.combatants.map(c => {
                if (c.id === combatantId) {
                    return { ...c, initiative: newInitiative };
                }
                return c;
            });

            // Re-sort ONLY if we want dynamic sorting in lobby, 
            // usually initiative sorting happens on 'Combat Start' or dynamic re-sort.
            // Let's re-sort immediately to keep consistent.
            updatedCombatants.sort((a, b) => b.initiative - a.initiative);

            // Sanitização, como feito no handleJoin
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

            await updateDoc(sessionRef, { combatants: sanitizedCombatants });
            addToast("Iniciativa atualizada!", "success");
        } catch (err) {
            console.error("Erro ao atualizar iniciativa:", err);
            addToast("Erro ao atualizar iniciativa.", "error");
        }
    };

    // ... (rest of code)







    // ...


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
        const unsubscribe = onSnapshot(sessionRef, async (docSnap) => {
            if (docSnap.exists()) {
                const sessionData = docSnap.data() as ArenaSession;
                setSession(sessionData);
                setError(null);

                // --- SINCRONIZAÇÃO ARENA -> FICHA (HP) ---
                // Se eu sou o dono de um combatente, verificar se o HP na arena mudou e atualizar a ficha
                if (user) {
                    const myCombatant = sessionData.combatants.find(c => c.ownerId === user.uid && c.type === 'player' && c.externalId);
                    if (myCombatant && myCombatant.externalId) {
                        try {
                            const charRef = doc(db, 'personagens', myCombatant.externalId);
                            const charSnap = await getDoc(charRef);

                            if (charSnap.exists()) {
                                const charData = charSnap.data();
                                // Se HP da arena for diferente do HP atual da ficha, atualiza ficha
                                // (Prioridade Arena durante combate para dano recebido)
                                if (myCombatant.hp !== charData.currentHp) {
                                    // Evita loop infinito: só atualiza se a diferença for maior que 0
                                    console.log(`[SYNC] Arena HP (${myCombatant.hp}) != Ficha HP (${charData.currentHp}). Atualizando ficha...`);
                                    await updateDoc(charRef, { currentHp: myCombatant.hp });
                                }
                            }
                        } catch (err) {
                            console.error("[SYNC] Erro ao sincronizar Arena -> Ficha:", err);
                        }
                    }
                }
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
    }, [id, user]); // Include user dependency

    // --- SINCRONIZAÇÃO FICHA -> ARENA (Listener em 'personagens') ---
    useEffect(() => {
        if (!user || !session) return;

        // Encontrar meu combatente ativo
        const myCombatant = session.combatants.find(c => c.ownerId === user.uid && c.type === 'player' && c.externalId);

        if (!myCombatant || !myCombatant.externalId) return;

        const charRef = doc(db, 'personagens', myCombatant.externalId);
        const unsubscribeChar = onSnapshot(charRef, async (docSnap) => {
            if (docSnap.exists()) {
                const charData = docSnap.data();

                // Verifica discrepâncias relevantes para enviar à Arena
                // Comparar HP e Efeitos
                // Se HP na ficha mudou (ex: usou pot, descanso), e é diferente da Arena
                // PRECISAMOS DE CUIDADO: Se Arena acabou de atualizar a ficha, não queremos re-enviar para Arena (loop)
                // Solução simples: Se a diferença for pequena, pode ser sync. Mas se for player action na ficha...

                // Vamos assumir que a Ficha é autoridade para EFEITOS e RECURSOS.
                // Arena é autoridade para HP (dano). Mas se curar na ficha?
                // Se currentHp > arena.hp (Cura), ficha ganha.
                // Se currentHp < arena.hp (Dano na ficha?), ficha ganha.
                // O problema é distinguir dano na arena de dano na ficha.

                // Vamos simplificar: Se diferir, a ficha manda. 
                // A sincronização Arena context (linha 250) já lida com Arena -> Ficha.
                // Se o usuário estiver editando a ficha, este listener dispara.

                let needsUpdate = false;
                const updates: Partial<Combatant> = {};

                // 1. HP Sync
                if (charData.currentHp !== myCombatant.hp) {
                    // Evita "eco" da atualização da própria arena
                    // Se a mudança veio da arena, o hook acima já igualou.
                    // Se mudou na ficha, é diferente. 
                    // Como distinguir?
                    // Poderíamos usar timestamp ou apenas aceitar o valor mais recente (Ficha sempre sobrescreve Arena neste listener).
                    // Para evitar briga de updates, vamos confiar na Ficha se a diferença persistir.
                    updates.hp = charData.currentHp;
                    needsUpdate = true;
                }

                // 2. Conditions/Effects Sync (Ficha -> Arena)
                // Ficha tem activeEffects (string[]) e conditions (string[])
                // Arena tem statusEffects (StatusEffect[])
                const fichaEffects = [
                    ...(charData.activeEffects || []),
                    ...(charData.conditions || [])
                ];

                // Mapear strings da ficha para estrutura da Arena
                // Precisamos preservar efeitos da Arena que NÃO estão na ficha?
                // Talvez efeitos temporários de combate (ex: Bless que o Clerigo jogou em mim).
                // Esses não estariam no doc do personagem.
                // Então, a sincronização deve ser ADITIVA ou SUBSTITUTIVA?
                // Se eu removo 'Fúria' na ficha, deve sair da Arena.
                // Se eu adiciono 'Fúria' na ficha, dave entrar na Arena.

                // A ficha é a "verdade" para estados intrínsecos. A arena para extrínsecos.
                // Difícil separar.
                // Vamos tentar mapear apenas efeitos CONHECIDOS que o próprio jogador controla (Auto-buffs).

                // Abordagem Segura: Sincronizar apenas o básico (Fúria, Condições Comuns) sem tocar nos buffs de terceiros.
                // Mas o pedido é "usou magia, fúria... sincronizar".

                // Vamos comparar o que temos na Ficha e garantir que esteja na Arena.
                const currentArenaEffectIds = myCombatant.statusEffects.map(e => e.id);
                const newEffectsFromSheet = fichaEffects.filter(id => !currentArenaEffectIds.includes(id));
                const removedEffectsFromSheet = currentArenaEffectIds.filter(id =>
                    // Se era um efeito que veio da ficha (ex: fúria) e não está mais lá
                    ['rage', 'poisoned', 'grappled'].includes(id) && !fichaEffects.includes(id)
                );

                if (newEffectsFromSheet.length > 0 || removedEffectsFromSheet.length > 0) {
                    // Construir nova lista
                    let newStatusEffects = [...myCombatant.statusEffects];

                    // Adicionar novos
                    newEffectsFromSheet.forEach(effectId => {
                        newStatusEffects.push({
                            id: effectId,
                            name: effectId.charAt(0).toUpperCase() + effectId.slice(1), // Nome provisório
                            duration: 10 // Duração padrão
                        });
                    });

                    // Remover antigos (apenas os que sabemos que são controlados pela ficha)
                    if (removedEffectsFromSheet.length > 0) {
                        newStatusEffects = newStatusEffects.filter(e => !removedEffectsFromSheet.includes(e.id));
                    }

                    if (newStatusEffects.length !== myCombatant.statusEffects.length) {
                        updates.statusEffects = newStatusEffects;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    console.log("[SYNC] Ficha -> Arena Changes:", updates);
                    // Atualiza arenas_online
                    // Cuidado: Precisamos ler o doc da arena mais atual para não sobrescrever arrays de combatants (concorrência)
                    // Fazer update atomicamente seria ideal, mas array update é chato.
                    // Vamos fazer merge no array local e update.

                    const arenaRef = doc(db, 'arenas_online', id as string);
                    // Como não podemos atualizar um item específico do array facilmente sem ler tudo...
                    // Temos que ler a sessão atual da REF (para ser safe) ou confiar no state session.
                    // Dado que estamos num listener de 'arenas_online' (no outro useEffect), 'session' deve estar bem atualizado.

                    const updatedCombatants = session.combatants.map(c => {
                        if (c.id === myCombatant.id) {
                            return { ...c, ...updates };
                        }
                        return c;
                    });

                    await updateDoc(arenaRef, { combatants: updatedCombatants });
                }
            }
        });

        return () => unsubscribeChar();

    }, [session, user, id]); // Re-run when session updates (to keep myCombatant fresh) or user changes

    const handleJoinBattle = async () => {
        if (!user || !session) return;
        if (!isManualJoin && !selectedCharId) return;

        // Validação básica manual
        if (isManualJoin && !manualChar.name) {
            addToast("Preencha o nome do herói.", "warning");
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

            // Registrar encontro ativo na ficha do personagem para logs/balõezinhos
            if (selectedCharId) {
                const charRef = doc(db, 'personagens', selectedCharId);
                await updateDoc(charRef, { activeEncounterId: id });
            }

            // NOTA: A sincronização com 'encounters' agora é feita AUTOMATICAMENTE pelo mestre 
            // através do listener que ele tem na 'arenas_online'. Removido o updateDoc direto 
            // no encounterRef para evitar erros de permissão para jogadores convidados.

            setIsJoinModalOpen(false);
            addToast("Você entrou na batalha! O mestre verá seu herói em instantes.", "success");
        } catch (err) {
            console.error("Erro ao entrar no combate:", err);
            addToast("Não foi possível entrar no combate.", "error");
        } finally {
            setIsJoining(false);
            setIsJoinModalOpen(false); // MOVIDO PARA CÁ
        }
    };

    const openJoinModal = async () => {
        if (!user) {
            addToast("Faça login para participar com seu personagem!", "warning");
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
                addToast("Arquivo inválido (.rpg sem json)", "error");
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
            addToast(`Dados de "${char.name}" carregados! Clique em "Entrar na Arena" para confirmar.`, "success");

        } catch (err) {
            console.error("Erro import:", err);
            addToast("Erro ao ler arquivo. Verifique se é um arquivo .rpg válido.", "error");
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

            {/* STATUS BAR - Apenas em Combate */}
            {session.phase === 'combat' && (
                <section className="bg-rpg-slate/40 border-b border-rpg-gold/10 sticky top-0 sm:top-0 z-20 backdrop-blur-md transition-[top]">
                    {/* VISÃO DO MESTRE - Expandida (Mantida) */}
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
            )}

            {/* MAIN CONTENT: LOBBY ou COMBATE */}
            <main className="container mx-auto p-4 sm:p-6 flex-grow">

                {/* LOBBY VIEW */}
                {session.phase === 'preparation' ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto space-y-8 animate-fade-in">
                        <div className="text-center space-y-4">
                            <div className="inline-block p-4 rounded-full bg-rpg-gold/10 border-2 border-rpg-gold/30 mb-2 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                                <span className="text-5xl">🏰</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-cinzel text-rpg-gold text-shadow-lg">
                                Salão de Concentração
                            </h2>
                            <p className="text-rpg-parchment/80 font-medieval text-xl max-w-md mx-auto">
                                Aguardando o Mestre iniciar o combate. Preparem suas armas e magias!
                            </p>
                        </div>

                        {/* Lista de Heróis Presentes */}
                        <div className="w-full bg-rpg-panel/50 border border-rpg-gold/20 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-rpg-gold text-xs uppercase font-bold tracking-widest mb-4 flex items-center gap-2 font-cinzel">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Heróis Preparados ({session.combatants.filter(c => c.type === 'player').length})
                            </h3>

                            {session.combatants.filter(c => c.type === 'player').length === 0 ? (
                                <div className="text-center py-8 text-rpg-grey italic font-medieval border border-dashed border-white/10 rounded-lg">
                                    Nenhum herói se apresentou ainda...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {session.combatants.filter(c => c.type === 'player').map(hero => (
                                        <div key={hero.id} className="flex items-center gap-4 bg-rpg-dark/40 p-3 rounded-lg border border-white/5 shadow-sm transform transition-all hover:scale-[1.02] hover:border-rpg-gold/30">

                                            {/* INITIATIVE SECTION - LEFT SIDE */}
                                            <div className="flex flex-col items-center justify-center p-2 bg-black/40 rounded border border-white/10 min-w-[4rem]">
                                                <span className="text-[10px] text-rpg-grey uppercase font-bold tracking-widest mb-1">Iniciativa</span>
                                                {hero.ownerId === user?.uid ? (
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="w-16 h-10 bg-rpg-dark border border-rpg-gold/50 rounded text-center text-xl font-bold text-rpg-gold focus:outline-none focus:border-rpg-gold focus:ring-1 focus:ring-rpg-gold"
                                                        defaultValue={hero.initiative}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={(e) => handleUpdateInitiative(hero.id, Number(e.target.value) || 0)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateInitiative(hero.id, Number(e.currentTarget.value) || 0);
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold text-rpg-gold">{hero.initiative}</span>
                                                )}
                                            </div>

                                            {/* ICON */}
                                            <div className="w-12 h-12 rounded bg-blue-900/20 flex items-center justify-center text-2xl border border-blue-500/20 shrink-0">
                                                🛡️
                                            </div>

                                            {/* INFO */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-rpg-parchment font-medieval truncate text-lg">{hero.name}</div>
                                                <div className="text-xs text-blue-300 uppercase font-bold tracking-wider">{hero.class} • Lvl {hero.level}</div>
                                            </div>

                                            {/* BADGE VOCÊ */}
                                            {hero.ownerId === user?.uid && (
                                                <span className="ml-auto text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-full border border-green-500/30 font-bold uppercase whitespace-nowrap shadow-glow-green/10">
                                                    Você
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={openJoinModal}
                            className="group relative px-8 py-4 bg-rpg-gold text-rpg-dark font-bold font-cinzel text-lg rounded shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] hover:bg-rpg-gold-light transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <span className="absolute inset-0 rounded border-2 border-white/20"></span>
                            ⚔️ Juntar-se à Batalha
                        </button>
                    </div>
                ) : (
                    // COMBAT LIST (Visual Rico)
                    <div className="max-w-4xl mx-auto flex flex-col gap-4">
                        {session.combatants.map((c, index) => {
                            const isCurrent = index === session.turnIndex;
                            const isOwnHero = user && c.ownerId === user.uid;
                            const showFullHP = (isHost === true) || (c.type === 'player' && isOwnHero === true);

                            // Visual Helpers
                            const isDefeated = c.hp <= 0;
                            const isDead = false; // Na Arena session simples não temos status 'dead' explícito ainda, usar HP <= 0 como fallback visual "Caído"

                            // Efeitos visuais
                            const hasEffects = c.statusEffects && c.statusEffects.length > 0;
                            const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
                            const commonConditionIds = ['caido', 'envenenado', 'atordoado', 'amedrontado', 'agarrado', 'incapacitado', 'invisivel', 'paralisado', 'petrificado', 'preso', 'inconsciente', 'cego', 'surdo', 'aterrorizado', 'exaurido', 'cansado', 'queimado', 'enfraquecido', 'fome', 'sangrando', 'ebrio', 'amaldicoado'];
                            const hasBenefits = hasEffects && c.statusEffects.some(se => benefitIds.includes(se.id) || (se as any).category === 'benefit');
                            const hasDebuffs = hasEffects && c.statusEffects.some(se => !benefitIds.includes(se.id) && (se as any).category !== 'benefit');
                            const hasBothEffects = hasBenefits && hasDebuffs;
                            const hasOnlyBenefits = hasBenefits && !hasDebuffs;
                            const hasOnlyDebuffs = hasDebuffs && !hasBenefits;
                            const hasUniqueEffects = hasEffects && c.statusEffects.some(se => !commonConditionIds.includes(se.id));
                            const hasOnlyGlobalConditions = hasEffects && c.statusEffects.every(se => commonConditionIds.includes(se.id));

                            return (
                                <div
                                    key={c.id}
                                    style={isDead ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                                    className={`
                                        relative p-3 sm:p-5 rounded-xl transition-all duration-300
                                        ${isDefeated ? 'border-2' : hasBothEffects ? 'border-l-[6px] border-l-green-500 border-r-[6px] border-r-red-500 border-t-2 border-b-2 border-t-purple-500/50 border-b-purple-500/50' : 'border-2'}
                                        ${isDefeated ? '' : hasUniqueEffects && !hasOnlyGlobalConditions ? 'effect-unique' : ''}
                                        ${session.phase === 'combat' && isCurrent && !isDefeated ? 'active-turn-animation bg-rpg-gold/15 border-rpg-gold scale-[1.01] z-10' :
                                            isDefeated ? 'bg-rpg-dark/80 border-gray-600/40 defeated-animation' :
                                                hasBothEffects ? 'bg-gradient-to-r from-green-950/20 via-rpg-dark/50 to-red-950/20 shadow-lg' :
                                                    hasOnlyBenefits ? 'bg-green-950/20 border-green-500/50 shadow-lg shadow-green-900/20' :
                                                        hasOnlyDebuffs ? 'bg-orange-950/20 border-orange-500/50 shadow-lg shadow-orange-900/20' :
                                                            c.type === 'player' ? 'bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-900/10' :
                                                                c.type === 'npc' ? 'bg-yellow-950/20 border-yellow-600/30 shadow-lg shadow-yellow-900/10' :
                                                                    'bg-red-950/20 border-red-600/30 shadow-lg shadow-red-900/10'}
                                    `}
                                >
                                    {/* Overlay Centralizado quando HP = 0 */}
                                    {isDefeated && (
                                        <div className="overlay-colorido absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/20 rounded-xl">
                                            <div className="bg-red-900 text-red-100 px-8 py-3 rounded-full font-cinzel font-bold text-2xl tracking-wide border-4 border-red-700 shadow-2xl">
                                                {c.type === 'monster' ? '💀 MORTO' : '⚰️ CAÍDO'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Row Principal */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-3 sm:gap-5 flex-1 w-full">
                                            {/* Iniciativa */}
                                            <div className="bg-rpg-dark border border-rpg-gold/30 w-10 h-10 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-cinzel text-rpg-gold font-bold shrink-0 shadow-inner text-lg sm:text-2xl">
                                                {c.initiative}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl sm:text-2xl font-cinzel text-rpg-parchment leading-tight truncate font-bold text-shadow-sm">
                                                        {c.name}
                                                    </h3>
                                                    {(isHost || isOwnHero) && c.externalId && (
                                                        <Link
                                                            href={`/personagem/${c.externalId}`}
                                                            target="_blank"
                                                            className="text-[10px] text-rpg-gold hover:text-white uppercase font-bold border border-rpg-gold/40 hover:border-rpg-gold px-2 py-0.5 rounded transition-all ml-2"
                                                        >
                                                            👁️ Ficha
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs uppercase font-bold tracking-widest mt-1">
                                                    <span className={`px-1.5 py-0.5 rounded border ${c.type === 'player' ? 'border-blue-500/50 text-blue-400 bg-blue-950/30' :
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

                                        {/* Barra de Vida & Efeitos */}
                                        <div className="flex flex-col gap-3 w-full sm:w-[50%] pt-3 sm:pt-0 sm:pl-4 sm:border-l border-white/5">
                                            {/* Barra de Vida */}
                                            <div className="w-full">
                                                {showFullHP ? (
                                                    <>
                                                        <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1.5 font-medieval tracking-widest">
                                                            <span className="text-rpg-grey">VIDA: <span className="text-rpg-parchment">{c.hp} / {c.maxHp}</span></span>
                                                            <span className={c.hp / c.maxHp < 0.3 ? 'text-red-500 animate-pulse' : 'text-rpg-grey'}>{Math.round((c.hp / c.maxHp) * 100)}%</span>
                                                        </div>
                                                        <div className="h-3 w-full bg-rpg-dark/50 rounded-full overflow-hidden border border-white/5 p-[1px] shadow-inner">
                                                            <div
                                                                className={`h-full transition-all duration-700 rounded-full ${c.hp / c.maxHp > 0.5 ? 'bg-gradient-to-r from-green-600 to-green-400' : c.hp / c.maxHp > 0.2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                                                                style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] uppercase font-cinzel text-rpg-grey font-bold">Estado</span>
                                                        <div className={`p-2 rounded text-center text-xs font-bold uppercase tracking-widest border ${c.hp / c.maxHp > 0.5 ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                                            c.hp / c.maxHp > 0.2 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                                                                'bg-red-900/20 text-red-400 border-red-500/30'
                                                            }`}>
                                                            {getHpStatusLabel(c)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Ajustes de HP (Host Only - Redundante mas mantido por segurança) */}
                                                {isHost && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input
                                                            type="number"
                                                            placeholder="+/-"
                                                            value={hpAdjustmentValues[c.id] || ''}
                                                            onChange={(e) => sethpAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                                    if (value) handleHostUpdateHp(c.id, -value);
                                                                }
                                                            }}
                                                            className="flex-1 h-6 bg-rpg-dark/50 border border-white/10 rounded px-2 text-[10px] text-center focus:border-rpg-gold outline-none font-medieval"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const value = parseInt(hpAdjustmentValues[c.id] || '0');
                                                                if (value) handleHostUpdateHp(c.id, -value);
                                                            }}
                                                            className="h-6 px-2 text-[10px] bg-white/5 hover:bg-white/10 rounded border border-white/10 text-rpg-gold"
                                                        >
                                                            OK
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Efeitos Ativos (Visual Rico) */}
                                            {hasEffects && (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {c.statusEffects.map(se => (
                                                        <span key={se.id} className="text-[9px] px-2 py-0.5 rounded border bg-purple-900/30 border-purple-500/30 text-purple-200 font-cinzel flex items-center gap-1">
                                                            ✨ {se.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mobile Button */}
                <div className="md:hidden fixed bottom-6 right-6 z-40">
                    {session.phase !== 'combat' && session.phase !== 'preparation' && (
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

            {/* TOASTS CONTAINER */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <Toast key={t.id} toast={{ ...t, duration: 3000 }} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </div>
    );
}
