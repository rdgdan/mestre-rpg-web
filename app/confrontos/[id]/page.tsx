'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCombat } from '@/hooks/useCombat';
import BattleMap from '@/components/combat/BattleMap';
import { getOrCreateBattleMap } from '@/lib/map-sync';

// Components
import TurnOrderTracker from '@/components/combat/TurnOrderTracker';
import CombatantList from '@/components/combat/CombatantList';
import AddCombatantModal from '@/components/combat/AddCombatantModal';
import ClassEffectsModal from '@/components/combat/ClassEffectsModal';
import ConfirmModal from '@/components/combat/ConfirmModal';
import CombatNotifications from '@/components/CombatNotifications';
import Modal from '@/components/Modal';
import MonsterStatBlock from '@/components/combat/MonsterStatBlock';

export default function ConfrontoDetalhesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const arenaId = id;

    const combat = useCombat(id, user);
    const [activeTab, setActiveTab] = useState<'combat' | 'map'>('combat');

    if (combat.loading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">⚔️</div>
                    <h2 className="text-rpg-gold font-cinzel text-xl animate-pulse">Invocando a Arena...</h2>
                </div>
            </div>
        );
    }

    const totalXP = combat.combatants
        .filter(c => c.type === 'monster' || c.type === 'npc')
        .reduce((acc, c) => acc + (c.xp || 0), 0);

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment font-medieval pb-20 overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rpg-red/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rpg-gold/5 blur-[120px] rounded-full" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rpg-gold/20 to-transparent" />
            </div>

            <TurnOrderTracker
                encounterTitle={combat.encounterTitle}
                phase={combat.phase}
                round={combat.round}
                turnIndex={combat.turnIndex}
                combatants={combat.combatants}
                isOnline={combat.isOnline}
                onExit={() => router.push('/confrontos')}
                onStartCombat={combat.startCombat}
                onResetCombat={() => combat.setConfirmResetModal(true)}
                onFinishCombat={() => combat.setIsXPModalOpen(true)}
                onToggleOnline={combat.toggleOnlineCombat}
                onAddCombatant={() => combat.setIsAddModalOpen(true)}
                onNextTurn={combat.nextTurn}
            />

            {/* Seletor de Abas - Sempre visível para o mestre */}
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
                            await getOrCreateBattleMap(arenaId);
                            setActiveTab('map');
                        }}
                        className={`px-8 py-2.5 rounded-xl font-cinzel text-xs tracking-widest transition-all duration-300 ${activeTab === 'map' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/40 font-bold' : 'text-rpg-grey hover:text-white hover:bg-white/5'}`}
                    >
                        🗺️ MAPA DE BATALHA
                    </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => window.open(`/arena/${arenaId}/projector`, '_blank', 'width=1280,height=720')}
                        className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 border border-purple-500/40 px-6 py-2.5 rounded-2xl font-cinzel text-[10px] tracking-widest transition-all shadow-glow-purple/20 flex items-center gap-2 group"
                    >
                        <span className="group-hover:scale-125 transition-transform">📽️</span> ABRIR PROJETOR
                    </button>
                </div>
            </div>

            {activeTab === 'combat' && (
                <CombatantList
                    combatants={combat.combatants}
                    phase={combat.phase}
                    turnIndex={combat.turnIndex}
                    notificationsMap={combat.notificationsMap}
                    hpAdjustmentValues={combat.hpAdjustmentValues}
                    healAdjustmentValues={combat.healAdjustmentValues}
                    sethpAdjustmentValues={combat.sethpAdjustmentValues}
                    setHealAdjustmentValues={combat.setHealAdjustmentValues}
                    updateHP={combat.updateHP}
                    removeCombatant={combat.removeCombatant}
                    setConfirmCureModal={combat.setConfirmCureModal}
                    setClassFxTarget={combat.setClassFxTarget}
                    setIsClassFxOpen={combat.setIsClassFxOpen}
                    syncState={combat.syncState}
                    setCombatants={combat.setCombatants}
                    isMaster={true}
                    user={user}
                    setMonsterSheet={combat.setMonsterSheet}
                />
            )}

            {activeTab === 'map' && (
                <main className="w-full max-w-[98vw] mx-auto p-2 sm:p-4 flex-grow flex flex-col h-[85vh] animate-fade-up">
                    <div className="flex-1 bg-rpg-panel/30 border border-rpg-gold/10 rounded-2xl overflow-hidden shadow-inner relative">
                        <BattleMap arenaId={arenaId} isMaster={true} combatants={combat.combatants} />
                    </div>
                    <p className="mt-4 text-[10px] text-rpg-grey text-center italic font-medieval uppercase tracking-widest opacity-50">
                        Mestre: Clique em uma célula para revelar/esconder a névoa. Use os botões flutuantes para zoom e sincronização.
                    </p>
                </main>
            )}

            {/* Empty State */}
            {combat.combatants.length === 0 && (
                <div className="text-center py-16 sm:py-24 bg-rpg-panel border border-rpg-gold/20 rounded-2xl max-w-2xl mx-auto shadow-2xl backdrop-blur-sm mt-10 px-6">
                    <div className="text-7xl mb-6 opacity-20 filter grayscale">🏹</div>
                    <h2 className="text-2xl font-cinzel text-rpg-gold mb-3">Arena Deserta</h2>
                    <p className="text-rpg-grey mb-10 max-w-sm mx-auto leading-relaxed">Prepare sua aventura adicionando monstros, servos ou os heróis da sua campanha.</p>
                    <button
                        onClick={() => combat.setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-10 py-4 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-glow-gold/20 active:scale-95"
                    >
                        ADICIONAR COMBATENTE
                    </button>
                </div>
            )}

            {/* Modals */}
            <AddCombatantModal
                isOpen={combat.isAddModalOpen}
                onClose={() => combat.setIsAddModalOpen(false)}
                onAdd={combat.addCombatant}
                dbMonsters={combat.dbMonsters}
                dbStandardNpcs={combat.dbStandardNpcs}
                customNpcs={combat.customNpcs}
                myCharacters={combat.myCharacters}
                charactersLoading={combat.charactersLoading}
            />

            <ClassEffectsModal
                isOpen={combat.isClassFxOpen}
                target={combat.classFxTarget}
                characterInfo={combat.characterInfo}
                onClose={() => combat.setIsClassFxOpen(false)}
                onApply={combat.applyClassEffectToCombatant}
                onRemove={combat.removeClassEffectFromCombatant}
            />

            {/* Victory Modal */}
            <Modal isOpen={combat.isXPModalOpen} onClose={() => combat.setIsXPModalOpen(false)} title="GLÓRIA E RECOMPENSA">
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
                    <button
                        onClick={() => router.push('/confrontos')}
                        className="w-full bg-rpg-gold text-rpg-dark px-8 py-4 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all"
                    >
                        VOLTAR AO LOBBY
                    </button>
                </div>
            </Modal>

            {/* Success/Error Notifications */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                <CombatNotifications notifications={combat.combatNotifications} />
            </div>

            {/* Phase Actions Floating */}
            {combat.phase === 'combat' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex gap-3 sm:gap-4 px-4 w-full max-w-md pointer-events-none">
                    <button
                        onClick={() => combat.setConfirmResetModal(true)}
                        className="flex-1 h-14 bg-rpg-panel border border-white/10 rounded-xl font-cinzel font-bold text-rpg-grey hover:text-white transition-all shadow-2xl pointer-events-auto"
                    >
                        🔄 RESET
                    </button>
                    <button
                        onClick={() => combat.setIsXPModalOpen(true)}
                        className="flex-1 h-14 bg-green-600/20 border border-green-500/30 rounded-xl font-cinzel font-bold text-green-400 hover:bg-green-600/30 transition-all shadow-2xl pointer-events-auto shadow-glow-green/10"
                    >
                        🏆 VITÓRIA
                    </button>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={combat.confirmCureModal.open}
                onClose={() => combat.setConfirmCureModal({ open: false, combatant: null })}
                title="Curar Combatente"
                message={`Deseja levantar ${combat.confirmCureModal.combatant?.name} com 1 HP?`}
                onConfirm={async () => {
                    if (combat.confirmCureModal.combatant) {
                        await combat.updateHP(combat.confirmCureModal.combatant.id, 1);
                        combat.setConfirmCureModal({ open: false, combatant: null });
                    }
                }}
            />

            <ConfirmModal
                isOpen={combat.confirmResetModal}
                onClose={() => combat.setConfirmResetModal(false)}
                title="Resetar Combate"
                message="Deseja voltar para a fase de preparação?"
                onConfirm={async () => {
                    combat.setPhase('preparation');
                    combat.setRound(1);
                    combat.setTurnIndex(0);
                    await combat.syncState({ phase: 'preparation', round: 1, turnIndex: 0 });
                    combat.setConfirmResetModal(false);
                }}
                confirmText="Resetar"
            />

            {/* Monster Sheet Modal */}
            <Modal
                isOpen={combat.monsterSheet.open}
                onClose={() => combat.setMonsterSheet({ open: false, monster: null })}
                title="FICHA DO MONSTRO"
                maxWidth="max-w-2xl"
            >
                {combat.monsterSheet.monster && (
                    <MonsterStatBlock monster={combat.monsterSheet.monster} />
                )}
            </Modal>
        </div>
    );
}
