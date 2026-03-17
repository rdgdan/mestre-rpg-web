'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCombat, Combatant } from '@/hooks/useCombat';
import TurnOrderTracker from '@/components/combat/TurnOrderTracker';
import CombatantList from '@/components/combat/CombatantList';
import Modal from '@/components/Modal';
import ClassEffectsModal from '@/components/combat/ClassEffectsModal';
import ConfirmModal from '../../../components/combat/ConfirmModal';
import MonsterStatBlock from '@/components/combat/MonsterStatBlock';
import Link from 'next/link';
import JSZip from 'jszip';
import { mapImportedDataToCharacter } from '@/lib/character-mapper';
import BattleMap from '@/components/combat/BattleMap';
import { getOrCreateBattleMap } from '@/lib/map-sync';

export default function SharedArenaPage() {
    const { id: encounterId } = useParams();
    const router = useRouter();
    // @ts-ignore
    const { user, loading: authLoading } = useAuth();

    const arenaId = typeof encounterId === 'string' ? encounterId : '';

    const {
        phase,
        combatants,
        round,
        turnIndex,
        loading,
        encounterTitle,
        isOnline,
        hostInfo,
        hpAdjustmentValues, sethpAdjustmentValues,
        healAdjustmentValues, setHealAdjustmentValues,
        notificationsMap,
        myCharacters,
        charactersLoading,
        isClassFxOpen, setIsClassFxOpen,
        classFxTarget, setClassFxTarget,
        confirmCureModal, setConfirmCureModal,
        updateHP,
        nextTurn,
        syncState,
        removeCombatant,
        applyClassEffectToCombatant,
        removeClassEffectFromCombatant,
        handleJoinBattle,
        monsterSheet, 
        setMonsterSheet
    } = useCombat(arenaId, user, 'player');

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedCharId, setSelectedCharId] = useState('');
    const [joinInitiative, setJoinInitiative] = useState<number>(0);
    const [isManualJoin, setIsManualJoin] = useState(false);
    const [manualChar, setManualChar] = useState({ name: '', class: 'Guerreiro', level: 1, hp: 10, ac: 10 });
    const [isJoining, setIsJoining] = useState(false);
    const [activeTab, setActiveTab] = useState<'combat' | 'map'>('combat');

    const isHost = Boolean(hostInfo.id && user?.uid && String(hostInfo.id) === String(user.uid));

    const handleJoin = async () => {
        setIsJoining(true);
        try {
            let charData: Partial<Combatant> = {};
            if (isManualJoin) {
                charData = {
                    name: manualChar.name,
                    class: manualChar.class,
                    level: manualChar.level,
                    hp: manualChar.hp,
                    maxHp: manualChar.hp,
                    ac: manualChar.ac,
                    initiative: joinInitiative,
                    type: 'player'
                };
            } else {
                const char = myCharacters.find(c => c.id === selectedCharId);
                if (char) {
                    charData = {
                        externalId: char.id,
                        name: char.name,
                        class: char.class,
                        level: char.level,
                        hp: char.currentHp || char.hp?.max || 10,
                        maxHp: char.hp?.max || 10,
                        ac: char.armorClass || 10,
                        initiative: joinInitiative,
                        type: 'player'
                    };
                }
            }
            await handleJoinBattle(charData);
            setIsJoinModalOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsJoining(false);
        }
    };

    const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            const zip = await JSZip.loadAsync(file);
            const jsonFiles = zip.file(/\.json$/i);
            if (jsonFiles.length === 0) return;

            const jsonData = JSON.parse(await jsonFiles[0].async("string"));
            const char = mapImportedDataToCharacter(jsonData, user.uid, '');

            setManualChar({
                name: char.name,
                class: char.class || 'Aventureiro',
                level: char.level || 1,
                hp: char.maxHp || 10,
                ac: char.armorClass || 10
            });
            setIsManualJoin(true);
        } catch (err) {
            console.error("Erro import:", err);
        }
    };

    if (authLoading || (loading && !isOnline)) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center font-cinzel text-rpg-gold animate-pulse">
                Invocando a Arena...
            </div>
        );
    }

    if (!isOnline && !loading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <h1 className="text-4xl font-bold font-cinzel text-red-500 mb-4 tracking-wider">Arena Offline</h1>
                <p className="text-rpg-parchment font-medieval text-xl">Esta sessão foi encerrada ou não existe.</p>
                <Link href="/" className="mt-8 bg-rpg-gold text-rpg-dark px-8 py-2 rounded font-bold font-cinzel hover:scale-105 transition-all">
                    Voltar para Início
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col font-lato">
            <TurnOrderTracker
                encounterTitle={encounterTitle}
                phase={phase}
                round={round}
                turnIndex={turnIndex}
                combatants={combatants}
                isOnline={isOnline}
                isMaster={isHost}
                onExit={() => router.push('/')}
                onStartCombat={() => { }}
                onResetCombat={() => { }}
                onFinishCombat={() => { }}
                onToggleOnline={() => { }}
                onAddCombatant={() => { }}
                onNextTurn={nextTurn}
            />

            {/* Seletor de Abas - Sempre visível se for o mestre ou se o combate já começou */}
            {(isHost || phase !== 'preparation') && (
                <div className="container mx-auto px-4 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-30 relative">
                    <div className="flex bg-black/60 p-1.5 rounded-2xl border border-rpg-gold/20 backdrop-blur-md shadow-2xl">
                        <button 
                            onClick={() => setActiveTab('combat')}
                            className={`px-8 py-2.5 rounded-xl font-cinzel text-xs tracking-widest transition-all duration-300 ${activeTab === 'combat' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/40 font-bold' : 'text-rpg-grey hover:text-white hover:bg-white/5'}`}
                        >
                            ⚔️ COMBATE
                        </button>
                        <button 
                            onClick={async () => {
                                if (isHost) {
                                    await getOrCreateBattleMap(arenaId);
                                }
                                setActiveTab('map');
                            }}
                            className={`px-8 py-2.5 rounded-xl font-cinzel text-xs tracking-widest transition-all duration-300 ${activeTab === 'map' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/40 font-bold' : 'text-rpg-grey hover:text-white hover:bg-white/5'}`}
                        >
                            🗺️ MAPA DE BATALHA
                        </button>
                    </div>

                    {isHost && (
                        <div className="flex gap-3">
                            <button 
                                onClick={() => window.open(`/arena/${arenaId}/projector`, '_blank', 'width=1280,height=720')}
                                className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 border border-purple-500/40 px-6 py-2.5 rounded-2xl font-cinzel text-[10px] tracking-widest transition-all shadow-glow-purple/20 flex items-center gap-2 group"
                            >
                                <span className="group-hover:scale-125 transition-transform">📽️</span> ABRIR PROJETOR
                            </button>
                        </div>
                    )}
                </div>
            )}

            {phase === 'preparation' && (
                <div className="flex flex-col items-center justify-center py-12 px-4 gap-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-cinzel text-rpg-gold">Salão de Concentração</h2>
                        <p className="text-rpg-grey max-w-md">Aguardando o Mestre iniciar o combate. Prepare seu herói!</p>
                    </div>

                    <button
                        onClick={() => setIsJoinModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-8 py-4 rounded-xl font-bold font-cinzel text-xl hover:scale-105 transition-all shadow-glow-gold/20"
                    >
                        ENTRAR NA BATALHA ⚔️
                    </button>

                    <div className="w-full max-w-2xl bg-rpg-panel/50 p-6 rounded-xl border border-rpg-gold/20 flex flex-col gap-4">
                        <h3 className="text-rpg-gold font-cinzel text-sm uppercase tracking-widest border-b border-rpg-gold/20 pb-2">Heróis Presentes</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {combatants.filter(c => c.type === 'player').map(hero => (
                                <div key={hero.id} className="bg-rpg-dark/50 p-3 rounded-lg border border-white/5 flex justify-between items-center group hover:border-rpg-gold/30 transition-all">
                                    <div className="overflow-hidden">
                                        <div className="font-bold text-rpg-parchment truncate">{hero.name}</div>
                                        <div className="text-[10px] text-rpg-grey uppercase font-bold tracking-widest">{hero.class} Nvl {hero.level}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-rpg-grey uppercase font-bold">Iniciativa</span>
                                        <span className="text-xl font-bold text-rpg-gold">{hero.initiative}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {phase !== 'preparation' && activeTab === 'combat' && (
                <CombatantList
                    combatants={combatants}
                    phase={phase}
                    turnIndex={turnIndex}
                    notificationsMap={notificationsMap}
                    hpAdjustmentValues={hpAdjustmentValues}
                    healAdjustmentValues={healAdjustmentValues}
                    sethpAdjustmentValues={sethpAdjustmentValues}
                    setHealAdjustmentValues={setHealAdjustmentValues}
                    updateHP={updateHP}
                    removeCombatant={removeCombatant}
                    setConfirmCureModal={setConfirmCureModal}
                    setClassFxTarget={setClassFxTarget}
                    setIsClassFxOpen={setIsClassFxOpen}
                    syncState={syncState}
                    setCombatants={() => { }} // Placeholder or real depending on need
                    isMaster={isHost}
                    user={user}
                    setMonsterSheet={setMonsterSheet}
                />
            )}

            {activeTab === 'map' && (
                <main className="container mx-auto p-3 sm:p-6 flex-grow flex flex-col h-[70vh]">
                    <div className="flex-1 bg-rpg-panel/30 border border-rpg-gold/10 rounded-2xl overflow-hidden shadow-inner relative">
                        <BattleMap arenaId={arenaId} isMaster={isHost} combatants={combatants} />
                    </div>
                    {isHost && (
                        <p className="mt-4 text-[10px] text-rpg-grey text-center italic font-medieval uppercase tracking-widest opacity-50">
                            Mestre: Clique em uma célula para revelar/esconder a névoa. Use os botões flutuantes para zoom.
                        </p>
                    )}
                </main>
            )}

            {/* Modal: Entrar na Batalha */}
            <Modal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                title="Entrar na Batalha"
            >
                <div className="space-y-6">
                    <div className="flex bg-rpg-dark p-1 rounded-lg">
                        <button
                            className={`flex-1 py-2 rounded font-bold font-cinzel text-xs transition-all ${!isManualJoin ? 'bg-rpg-gold text-rpg-dark shadow-md' : 'text-rpg-grey'}`}
                            onClick={() => setIsManualJoin(false)}
                        >
                            FICHA EXISTENTE
                        </button>
                        <button
                            className={`flex-1 py-2 rounded font-bold font-cinzel text-xs transition-all ${isManualJoin ? 'bg-rpg-gold text-rpg-dark shadow-md' : 'text-rpg-grey'}`}
                            onClick={() => setIsManualJoin(true)}
                        >
                            ENTRADA MANUAL / ARQUIVO
                        </button>
                    </div>

                    {isManualJoin ? (
                        <div className="space-y-4">
                            <div className="p-4 border-2 border-dashed border-rpg-gold/20 rounded-xl hover:border-rpg-gold/40 transition-all text-center">
                                <label className="cursor-pointer block">
                                    <span className="text-3xl block mb-2">📁</span>
                                    <span className="text-rpg-gold font-bold text-sm block">Importar Arquivo .rpg</span>
                                    <span className="text-[10px] text-rpg-grey">Use o arquivo exportado da sua ficha</span>
                                    <input type="file" className="hidden" accept=".rpg" onChange={handleFileImport} />
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[10px] uppercase font-bold mb-1 text-rpg-grey">Nome do Herói</label>
                                    <input
                                        className="w-full bg-rpg-dark border border-white/10 rounded-lg p-3 text-rpg-parchment outline-none focus:border-rpg-gold"
                                        value={manualChar.name}
                                        onChange={(e) => setManualChar({ ...manualChar, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1 text-rpg-grey">Classe</label>
                                    <input
                                        className="w-full bg-rpg-dark border border-white/10 rounded-lg p-3 text-rpg-parchment outline-none focus:border-rpg-gold"
                                        value={manualChar.class}
                                        onChange={(e) => setManualChar({ ...manualChar, class: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1 text-rpg-grey">Nível</label>
                                    <input
                                        type="number"
                                        className="w-full bg-rpg-dark border border-white/10 rounded-lg p-3 text-rpg-parchment outline-none focus:border-rpg-gold"
                                        value={manualChar.level}
                                        onChange={(e) => setManualChar({ ...manualChar, level: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1 text-rpg-grey">Vida Máxima</label>
                                    <input
                                        type="number"
                                        className="w-full bg-rpg-dark border border-white/10 rounded-lg p-3 text-rpg-parchment outline-none focus:border-rpg-gold"
                                        value={manualChar.hp}
                                        onChange={(e) => setManualChar({ ...manualChar, hp: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1 text-rpg-grey">Classe Armadura (CA)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-rpg-dark border border-white/10 rounded-lg p-3 text-rpg-parchment outline-none focus:border-rpg-gold"
                                        value={manualChar.ac}
                                        onChange={(e) => setManualChar({ ...manualChar, ac: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {myCharacters.map(char => (
                                <button
                                    key={char.id}
                                    onClick={() => setSelectedCharId(char.id)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${selectedCharId === char.id ? 'bg-rpg-gold text-rpg-dark border-rpg-gold shadow-glow-gold/20' : 'bg-rpg-dark border-white/5 text-rpg-parchment hover:border-white/20'}`}
                                >
                                    <div>
                                        <div className="font-bold">{char.name}</div>
                                        <div className={`text-[10px] uppercase font-bold ${selectedCharId === char.id ? 'text-rpg-dark/70' : 'text-rpg-grey'}`}>
                                            {char.class} Lvl {char.level}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medieval text-lg">{char.hp?.max || char.currentHp || 0} HP</div>
                                        <div className="text-[10px] uppercase font-bold">Resistência</div>
                                    </div>
                                </button>
                            ))}
                            {myCharacters.length === 0 && (
                                <div className="text-center py-8 text-rpg-grey">
                                    Você não possui personagens salvos.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div>
                            <label className="block text-sm font-cinzel text-rpg-gold mb-2 text-center">Resultado da Sua Iniciativa</label>
                            <input
                                type="number"
                                className="w-full bg-rpg-dark border-2 border-rpg-gold/40 rounded-xl p-4 text-center text-3xl font-bold text-rpg-gold outline-none focus:border-rpg-gold"
                                value={joinInitiative}
                                onChange={(e) => setJoinInitiative(Number(e.target.value))}
                            />
                        </div>
                        <button
                            onClick={handleJoin}
                            disabled={isJoining || (!selectedCharId && !isManualJoin)}
                            className="w-full bg-rpg-gold text-rpg-dark py-4 rounded-xl font-bold font-cinzel text-lg hover:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                        >
                            {isJoining ? 'ENTRANDO...' : 'ENTRAR NA ARENA'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Outros Modais Compartilhados */}
            <ClassEffectsModal
                isOpen={isClassFxOpen}
                onClose={() => setIsClassFxOpen(false)}
                target={classFxTarget}
                characterInfo={{}} // Arena (Player) usually doesn't have the full map, will use target class
                onApply={applyClassEffectToCombatant}
                onRemove={removeClassEffectFromCombatant}
            />

            <ConfirmModal
                isOpen={confirmCureModal.open}
                onClose={() => setConfirmCureModal({ open: false, combatant: null })}
                title={`Curar ${confirmCureModal.combatant?.name}?`}
                message={`Deseja curar completamente e levantar ${confirmCureModal.combatant?.name}?`}
                onConfirm={async () => {
                    if (confirmCureModal.combatant) {
                        await updateHP(confirmCureModal.combatant.id, confirmCureModal.combatant.maxHp);
                        setConfirmCureModal({ open: false, combatant: null });
                    }
                }}
                confirmText="CURAR ❤️"
            />

            {/* Monster Sheet Modal (Apenas visível se acionado pelo botão que só o mestre tem) */}
            <Modal
                isOpen={monsterSheet.open}
                onClose={() => setMonsterSheet({ open: false, monster: null })}
                title="FICHA DO MONSTRO"
                maxWidth="max-w-2xl"
            >
                {monsterSheet.monster && (
                    <MonsterStatBlock monster={monsterSheet.monster} />
                )}
            </Modal>
        </div>
    );
}
