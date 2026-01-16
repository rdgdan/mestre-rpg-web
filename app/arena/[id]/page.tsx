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

    // Effect management for players
    const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
    const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});
    const [customEffName, setCustomEffName] = useState('');
    const [customEffDur, setCustomEffDur] = useState(10);
    const [hpAdjustmentValues, sethpAdjustmentValues] = useState<Record<string, string>>({});
    const [globalEffects, setGlobalEffects] = useState<GameEffectTemplate[]>([]);
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [playerCombatant, setPlayerCombatant] = useState<Combatant | null>(null);

    // Gera ações disponíveis baseado na classe e estado do combatante
    const getAvailableActions = (combatant: Combatant) => {
        const actions: { label: string; action: string; emoji: string; color: string }[] = [];

        // Ações básicas
        if (combatant.type === 'player') {
            if (combatant.hp > 0) {
                actions.push({ label: 'Ação Padrão', action: 'action', emoji: '⚔️', color: 'bg-blue-600' });
                actions.push({ label: 'Ação Bônus', action: 'bonus', emoji: '✨', color: 'bg-purple-600' });
                actions.push({ label: 'Reação', action: 'reaction', emoji: '🛡️', color: 'bg-orange-600' });
                actions.push({ label: 'Movimento', action: 'move', emoji: '🏃', color: 'bg-green-600' });
            }

            // Ações específicas por classe
            if (combatant.class?.toLowerCase().includes('bárbaro')) {
                actions.push({ label: 'Entrar em Fúria', action: 'rage', emoji: '😤', color: 'bg-red-700' });
            }
            if (combatant.class?.toLowerCase().includes('paladino')) {
                actions.push({ label: 'Imposição de Mãos', action: 'lay_on_hands', emoji: '✋', color: 'bg-yellow-600' });
            }
            if (combatant.class?.toLowerCase().includes('mago') || combatant.class?.toLowerCase().includes('bruxo') || combatant.class?.toLowerCase().includes('clérigo')) {
                actions.push({ label: 'Lançar Magia', action: 'cast_spell', emoji: '🔮', color: 'bg-indigo-600' });
            }
            if (combatant.class?.toLowerCase().includes('ladino')) {
                actions.push({ label: 'Ataque Furtivo', action: 'sneak_attack', emoji: '🗡️', color: 'bg-slate-700' });
            }
            if (combatant.class?.toLowerCase().includes('bardo')) {
                actions.push({ label: 'Inspiração Bardica', action: 'bardic_inspiration', emoji: '🎵', color: 'bg-pink-600' });
            }

            // Ações de combate
            actions.push({ label: 'Teste de Força', action: 'str_check', emoji: '💪', color: 'bg-red-600' });
            actions.push({ label: 'Teste de Destreza', action: 'dex_check', emoji: '🎯', color: 'bg-green-600' });
            actions.push({ label: 'Teste de Inteligência', action: 'int_check', emoji: '🧠', color: 'bg-blue-600' });
            actions.push({ label: 'Teste de Sabedoria', action: 'wis_check', emoji: '👁️', color: 'bg-purple-600' });
            actions.push({ label: 'Teste de Carisma', action: 'cha_check', emoji: '😊', color: 'bg-pink-600' });

            // Ações de estado
            actions.push({ label: 'Teste de Sobrevivência', action: 'death_save', emoji: '💓', color: 'bg-red-800' });
            actions.push({ label: 'Recuperar', action: 'stabilize', emoji: '🩹', color: 'bg-green-700' });

            // Estado negativo
            if (combatant.hp <= 0) {
                actions.push({ label: 'Caído - Teste de Morte', action: 'death_save', emoji: '💀', color: 'bg-red-900' });
            }
        }

        return actions;
    };

    const executeAction = (combatant: Combatant, action: string) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        let message = '';

        switch (action) {
            case 'rage':
                message = `${combatant.name} entra em FÚRIA! (+2 dano, -2 CA) 😤`;
                break;
            case 'lay_on_hands':
                message = `${combatant.name} usa Imposição de Mãos! Cura até ${combatant.level * 5} HP ✋`;
                break;
            case 'cast_spell':
                message = `${combatant.name} está lançando uma magia... 🔮`;
                break;
            case 'sneak_attack':
                message = `${combatant.name} tenta um Ataque Furtivo! (Rolou ${roll}) 🗡️`;
                break;
            case 'bardic_inspiration':
                message = `${combatant.name} canta Inspiração Bardica! D8 para aliados 🎵`;
                break;
            case 'str_check':
                message = `${combatant.name} faz Teste de Força: d20 = ${roll} 💪`;
                break;
            case 'dex_check':
                message = `${combatant.name} faz Teste de Destreza: d20 = ${roll} 🎯`;
                break;
            case 'int_check':
                message = `${combatant.name} faz Teste de Inteligência: d20 = ${roll} 🧠`;
                break;
            case 'wis_check':
                message = `${combatant.name} faz Teste de Sabedoria: d20 = ${roll} 👁️`;
                break;
            case 'cha_check':
                message = `${combatant.name} faz Teste de Carisma: d20 = ${roll} 😊`;
                break;
            case 'death_save': {
                const success = roll >= 10;
                message = `${combatant.name} faz Teste de Morte: ${success ? '✅ Sucesso!' : '❌ Falha!'} (${roll})`;
                break;
            }
            case 'action':
                message = `${combatant.name} está fazendo uma Ação Padrão... ⚔️`;
                break;
            case 'bonus':
                message = `${combatant.name} usa uma Ação Bônus! ✨`;
                break;
            case 'reaction':
                message = `${combatant.name} pode reagir! 🛡️`;
                break;
            case 'move':
                message = `${combatant.name} se move! 🏃`;
                break;
            default:
                message = `${combatant.name} faz algo...`;
        }

        alert(message);
        setIsActionsModalOpen(false);
    };

    // Load global effects
    useEffect(() => {
        const loadFx = async () => {
            try {
                const docRef = doc(db, 'game_rules', 'effects');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setGlobalEffects(docSnap.data().list || []);
                }
            } catch (err) {
                console.error("Scale error:", err);
            }
        };
        loadFx();
    }, []);

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
                    const encounterCombatants = encounterData.combatants || [];
                    
                    // Verifica se o jogador já existe na encounter
                    const existingIndex = encounterCombatants.findIndex((c: Combatant) => 
                        c.externalId === (isManualJoin ? undefined : selectedCharId) ||
                        (isManualJoin && c.name === manualChar.name)
                    );
                    
                    // Pega o combatente que foi adicionado à arenas_online
                    const newJoinedCombatant = sanitizedCombatants[sanitizedCombatants.length - 1];
                    
                    let updatedEncounterCombatants;
                    if (existingIndex > -1) {
                        // Atualiza existente
                        updatedEncounterCombatants = [...encounterCombatants];
                        updatedEncounterCombatants[existingIndex] = newJoinedCombatant;
                    } else {
                        // Adiciona novo
                        updatedEncounterCombatants = [...encounterCombatants, newJoinedCombatant];
                    }
                    
                    // Reordena por iniciativa
                    updatedEncounterCombatants.sort((a: Combatant, b: Combatant) => b.initiative - a.initiative);
                    
                    await updateDoc(encounterRef, {
                        combatants: updatedEncounterCombatants
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
            <section className={`bg-rpg-slate/40 border-b border-rpg-gold/10 p-4 sticky top-0 ${session.phase === 'preparation' ? 'sm:top-[74px]' : 'sm:top-0'} z-20 backdrop-blur-md transition-[top]`}>
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
                        const showFullHP = (isHost === true) || (c.type === 'player' && isOwnHero === true);

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
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setPlayerCombatant(c);
                                                            setIsActionsModalOpen(true);
                                                        }}
                                                        className="text-[8px] bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 uppercase font-bold border border-blue-500/20 px-2 py-0.5 rounded ml-1"
                                                    >
                                                        ⚡ Ações
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEffectModalOpen(true)}
                                                        className="text-[8px] bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 uppercase font-bold border border-purple-500/20 px-2 py-0.5 rounded ml-1"
                                                    >
                                                        ✨ Ativar Efeito
                                                    </button>
                                                </>
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

                                    {/* HP BAR & Status */}
                                    <div className="flex items-center gap-3">
                                        {showFullHP ? (
                                            // VISÃO COMPLETA (Mestre ou Dono do Personagem)
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
                                                {/* Botões de HP só para host */}
                                                {isHost && (
                                                    <div className="flex items-center gap-1 bg-black/40 rounded border border-white/10 p-1 mt-2">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={hpAdjustmentValues[c.id] || ''}
                                                            onChange={(e) => sethpAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleHostUpdateHp(c.id, -1);
                                                                }
                                                            }}
                                                            className="w-10 h-6 bg-rpg-slate/50 border border-white/5 rounded px-1 text-[10px] text-center focus:border-rpg-gold outline-none font-medieval [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <button onClick={() => handleHostUpdateHp(c.id, -1)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm">-</button>
                                                        <button onClick={() => handleHostUpdateHp(c.id, 1)} className="w-6 h-6 flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all font-bold text-sm border-l border-white/10">+</button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // VISÃO LIMITADA (Jogador vendo Monstro/NPC/Outro Jogador)
                                            <div className="w-32 md:w-48 flex items-center justify-end">
                                                <span className="text-sm font-cinzel text-rpg-grey italic tracking-widest bg-rpg-slate/50 px-3 py-1 rounded-md border border-white/10">
                                                    {getHpStatusLabel(c)}
                                                </span>
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

            {/* MODAL EFEITOS (Para Jogadores) */}
            <Modal isOpen={isEffectModalOpen} onClose={() => setIsEffectModalOpen(false)} title="Ativar Magia / Habilidade">
                <div className="space-y-4">
                    <p className="text-xs text-rpg-grey italic mb-2">Escolha o efeito que você ativou na mesa real:</p>

                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {globalEffects.map(eff => (
                            <button
                                key={eff.name}
                                onClick={() => handlePlayerAddEffect(eff.name, eff.duration)}
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
                                    list="online-effects-list"
                                    value={customEffName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCustomEffName(val);
                                        const matching = globalEffects.find(f => f.name === val);
                                        if (matching) setCustomEffDur(matching.duration);
                                    }}
                                    className="flex-grow bg-rpg-slate border border-white/10 p-2 rounded text-xs text-rpg-parchment outline-none focus:border-purple-500"
                                    placeholder="Procure ou digite..."
                                />
                                <datalist id="online-effects-list">
                                    {globalEffects.map(f => (
                                        <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                </datalist>
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

            {/* MODAL AÇÕES */}
            <Modal isOpen={isActionsModalOpen} onClose={() => setIsActionsModalOpen(false)} title={`⚡ Ações de ${playerCombatant?.name || 'Herói'}`}>
                {playerCombatant && (
                    <div className="space-y-4">
                        <p className="text-sm text-rpg-grey mb-6 text-center font-medieval">
                            {playerCombatant.class} - Nível {playerCombatant.level} | HP: {playerCombatant.hp}/{playerCombatant.maxHp}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {getAvailableActions(playerCombatant).map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => executeAction(playerCombatant, action.action)}
                                    className={`${action.color} hover:opacity-90 text-white p-4 rounded-lg font-bold font-cinzel text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg border border-white/20 flex flex-col items-center gap-2`}
                                >
                                    <span className="text-2xl">{action.emoji}</span>
                                    <span className="text-xs text-center leading-tight">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-rpg-slate/50 rounded-lg border border-rpg-gold/10">
                            <p className="text-xs text-rpg-grey text-center italic">
                                💡 As ações aparecem baseadas na classe do seu personagem. Comunique com o mestre sobre o resultado!
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
