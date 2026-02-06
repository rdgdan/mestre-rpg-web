import React from 'react';
import { Combatant } from '@/hooks/useCombat';

interface TurnOrderTrackerProps {
    encounterTitle: string;
    phase: 'preparation' | 'initiative' | 'combat';
    round: number;
    turnIndex: number;
    combatants: Combatant[];
    isOnline: boolean;
    isMaster?: boolean;
    onExit: () => void;
    onStartCombat: () => void;
    onResetCombat: () => void;
    onFinishCombat: () => void;
    onToggleOnline: () => void;
    onAddCombatant: () => void;
    onNextTurn: () => void;
}

const TurnOrderTracker: React.FC<TurnOrderTrackerProps> = ({
    encounterTitle,
    phase,
    round,
    turnIndex,
    combatants,
    isOnline,
    isMaster = true,
    onExit,
    onStartCombat,
    onResetCombat,
    onFinishCombat,
    onToggleOnline,
    onAddCombatant,
    onNextTurn
}) => {
    const copyArenaLink = () => {
        const url = window.location.href.replace('/confrontos/', '/arena/');
        navigator.clipboard.writeText(url);
        alert('Link da Arena copiado!');
    };

    return (
        <>
            <header className="bg-rpg-panel p-3 sm:p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-40 backdrop-blur-md">
                <div className="container mx-auto flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={onExit}
                            className="bg-rpg-dark/50 border border-rpg-gold/30 text-rpg-gold p-2 rounded-lg hover:bg-rpg-gold/10 transition-all shrink-0 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <h1 className="text-sm sm:text-xl font-cinzel text-rpg-gold truncate font-bold">
                            {encounterTitle}
                        </h1>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                        {isMaster && (
                            <>
                                {phase === 'preparation' ? (
                                    <button
                                        onClick={onStartCombat}
                                        disabled={combatants.length < 1}
                                        className="bg-rpg-gold text-rpg-dark px-3 sm:px-4 py-2 rounded font-bold font-cinzel text-xs sm:text-sm hover:bg-rpg-gold-light transition-all disabled:opacity-50 active:scale-95 shadow-md"
                                    >
                                        INICIAR <span className="hidden sm:inline">COMBATE</span> ⚔️
                                    </button>
                                ) : (
                                    <div className="flex gap-1.5 sm:gap-2">
                                        <button onClick={onResetCombat} className="bg-red-900/50 text-rpg-parchment px-2 sm:px-3 py-2 rounded text-xs hover:bg-red-900 transition-all font-cinzel border border-red-500/30 active:scale-95">
                                            RESET
                                        </button>
                                        <button onClick={onFinishCombat} className="bg-green-700 text-white px-2 sm:px-4 py-2 rounded text-xs sm:text-sm font-bold font-cinzel hover:bg-green-600 transition-all active:scale-95 shadow-md">
                                            FINALIZAR 🏁
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={onToggleOnline}
                                    className={`px-3 py-2 rounded font-bold font-cinzel text-xs sm:text-sm transition-all active:scale-95 shadow-md border ${isOnline ? 'bg-purple-600 text-white border-purple-400 shadow-glow-purple/20' : 'bg-rpg-panel text-rpg-gold border-rpg-gold/30 opacity-60 hover:opacity-100'}`}
                                    title={isOnline ? "Arena Online Ativa" : "Ativar Arena Online"}
                                >
                                    {isOnline ? 'ONLINE 🌐' : 'OFFLINE 📡'}
                                </button>
                                {isOnline && (
                                    <button
                                        onClick={copyArenaLink}
                                        className="bg-rpg-panel border border-rpg-gold/30 text-rpg-gold p-2 rounded-lg hover:bg-rpg-gold/10 transition-all shrink-0 active:scale-95"
                                        title="Copiar Link da Arena"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    </button>
                                )}
                                <button
                                    onClick={onAddCombatant}
                                    className="bg-rpg-panel border border-rpg-gold/30 text-rpg-gold px-2.5 sm:px-3 py-2 rounded text-sm font-bold hover:bg-rpg-gold/10 transition-all active:scale-95 shrink-0"
                                    title="Adicionar Combatente"
                                >
                                    +
                                </button>
                            </>
                        )}
                        {!isMaster && (
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-glow-green animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-[10px] sm:text-xs font-bold font-cinzel text-rpg-grey uppercase tracking-tighter">
                                    {isOnline ? 'Sessão Ativa' : 'Desconectado'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {phase === 'combat' && (
                <div className="bg-rpg-gold/10 border-b border-rpg-gold/20 p-2 sm:p-3 flex justify-between items-center px-4 sm:px-6 sticky top-[61px] sm:top-[74px] z-30 backdrop-blur-sm">
                    <div className="font-cinzel text-[10px] sm:text-xs text-rpg-gold flex gap-3 sm:gap-6 items-baseline overflow-hidden">
                        <div className="shrink-0">RODADA: <span className="text-white text-base sm:text-xl font-bold">{round}</span></div>
                        <div className="truncate">TURNO: <span className="text-white text-base sm:text-xl font-bold uppercase">{combatants[turnIndex]?.name || '-'}</span></div>
                    </div>
                    {isMaster && (
                        <button
                            onClick={onNextTurn}
                            className="bg-rpg-gold text-rpg-dark px-4 sm:px-6 py-2 rounded-full font-bold font-cinzel text-xs hover:bg-rpg-gold-light transition-all transform active:scale-95 shadow-lg shrink-0 whitespace-nowrap"
                        >
                            PRÓX. TURNO ›
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default TurnOrderTracker;
