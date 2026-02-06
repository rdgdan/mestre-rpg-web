import React from 'react';
import Link from 'next/link';
import { Combatant, CombatNotification, StatusEffect } from '@/hooks/useCombat';

interface CombatantCardProps {
    combatant: Combatant;
    index: number;
    phase: string;
    turnIndex: number;
    notificationsMap: Record<string, CombatNotification>;
    hpAdjustmentValues: Record<string, string>;
    healAdjustmentValues: Record<string, string>;
    sethpAdjustmentValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setHealAdjustmentValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateHP: (cid: string, amount: number) => Promise<void>;
    removeCombatant: (cid: string) => Promise<void>;
    setConfirmCureModal: React.Dispatch<React.SetStateAction<{ open: boolean; combatant: Combatant | null }>>;
    setClassFxTarget: React.Dispatch<React.SetStateAction<Combatant | null>>;
    setIsClassFxOpen: React.Dispatch<React.SetStateAction<boolean>>;
    syncState: (updates: any) => Promise<void>;
    combatants: Combatant[];
    setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
    isMaster?: boolean;
    isOwnHero?: boolean;
}

const CombatantCard: React.FC<CombatantCardProps> = ({
    combatant: c,
    index,
    phase,
    turnIndex,
    notificationsMap,
    hpAdjustmentValues,
    healAdjustmentValues,
    sethpAdjustmentValues,
    setHealAdjustmentValues,
    updateHP,
    removeCombatant,
    setConfirmCureModal,
    setClassFxTarget,
    setIsClassFxOpen,
    syncState,
    combatants,
    setCombatants,
    isMaster = true,
    isOwnHero = false,
}) => {
    const hasEffects = c.statusEffects && c.statusEffects.length > 0;
    const isDefeated = c.hp === 0;
    const isDead = c.status === 'dead';
    const showFullHP = isMaster || isOwnHero;

    const benefitIds = ['rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary', 'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind', 'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense', 'lay-hands', 'divine-smite', 'aura-protection', 'invisivel', 'enfeiticado'];
    const commonConditionIds = ['caido', 'envenenado', 'atordoado', 'amedrontado', 'agarrado', 'incapacitado', 'invisivel', 'paralisado', 'petrificado', 'preso', 'inconsciente', 'cego', 'surdo', 'aterrorizado', 'exaurido', 'cansado', 'queimado', 'enfraquecido', 'fome', 'sangrando', 'ebrio', 'amaldicoado'];

    const hasBenefits = hasEffects && c.statusEffects.some(se => benefitIds.includes(se.id) || (se as any).category === 'benefit');
    const hasDebuffs = hasEffects && c.statusEffects.some(se => !benefitIds.includes(se.id) && (se as any).category !== 'benefit');
    const hasBothEffects = hasBenefits && hasDebuffs;
    const hasOnlyBenefits = hasBenefits && !hasDebuffs;
    const hasOnlyDebuffs = hasDebuffs && !hasBenefits;
    const hasUniqueEffects = hasEffects && c.statusEffects.some(se => !commonConditionIds.includes(se.id));
    const hasOnlyGlobalConditions = hasEffects && c.statusEffects.every(se => commonConditionIds.includes(se.id));

    const getEffectDisplayName = (id: string, name: string) => {
        if (id === 'rage') return 'FÚRIA';
        if (id === 'bless') return 'ABENÇOADO';
        if (id === 'inspiration') return 'INSPIRAÇÃO';
        return name.toUpperCase();
    };

    const getHpStatusLabel = (comb: Combatant) => {
        const ratio = comb.hp / comb.maxHp;
        if (comb.hp <= 0) return comb.type === 'monster' ? 'Morto' : 'Caído';
        if (ratio < 0.2) return 'À beira da morte';
        if (ratio < 0.5) return 'Muito Machucado';
        if (ratio < 0.9) return 'Ferido';
        return 'Saudável';
    };

    return (
        <div
            style={isDead ? { opacity: 0.5, pointerEvents: 'none' } : {}}
            className={`
                relative p-3 sm:p-5 rounded-xl transition-all duration-300
                ${isDefeated ? 'border-2' : hasBothEffects ? 'border-l-[6px] border-l-green-500 border-r-[6px] border-r-red-500 border-t-2 border-b-2 border-t-purple-500/50 border-b-purple-500/50' : 'border-2'}
                ${isDefeated ? '' : hasUniqueEffects && !hasOnlyGlobalConditions ? 'effect-unique' : ''}
                ${phase === 'combat' && turnIndex === index && !isDefeated ? 'active-turn-animation bg-rpg-gold/15 border-rpg-gold scale-[1.01] z-10' :
                    isDefeated ? 'bg-rpg-dark/80 border-gray-600/40 defeated-animation' :
                        hasBothEffects ? 'bg-gradient-to-r from-green-950/20 via-rpg-dark/50 to-red-950/20 shadow-lg' :
                            hasOnlyBenefits ? 'bg-green-950/20 border-green-500/50 shadow-lg shadow-green-900/20' :
                                hasOnlyDebuffs ? 'bg-orange-950/20 border-orange-500/50 shadow-lg shadow-orange-900/20' :
                                    c.type === 'player' ? 'bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-900/10' :
                                        c.type === 'npc' ? 'bg-yellow-950/20 border-yellow-600/30 shadow-lg shadow-yellow-900/10' :
                                            'bg-red-950/20 border-red-600/30 shadow-lg shadow-red-900/10'}
            `}
        >
            {/* Balão de Notificação */}
            {notificationsMap[c.externalId || c.id] && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[60] animate-bubble-float pointer-events-none">
                    <div className="bg-rpg-gold text-rpg-dark font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)] border-2 border-rpg-dark flex items-center gap-2 whitespace-nowrap">
                        <span className="text-base">{notificationsMap[c.externalId || c.id].icon}</span>
                        <span>{notificationsMap[c.externalId || c.id].message}</span>
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rpg-gold mx-auto" />
                </div>
            )}

            {/* Faixa MORTO */}
            {isDead && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 rounded-xl">
                    <div className="transform -rotate-12">
                        <div className="bg-red-900 text-red-100 px-16 py-4 font-cinzel font-bold text-4xl tracking-widest border-4 border-red-700 shadow-2xl rounded-xl">
                            ☠️ MORTO ☠️
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay CAÍDO */}
            {isDefeated && !isDead && (
                <div className="overlay-colorido absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/20 rounded-xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-red-900 text-red-100 px-8 py-3 rounded-full font-cinzel font-bold text-2xl tracking-wide border-4 border-red-700 shadow-2xl">
                            {c.type === 'monster' ? '💀 MORTO' : '⚰️ CAÍDO'}
                        </div>
                        {isMaster && (c.type === 'player' || c.type === 'npc') && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmCureModal({ open: true, combatant: c })}
                                    className="bg-green-600 border-4 border-green-300 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all animate-pulse"
                                >
                                    ❤️ {c.type === 'player' ? 'CURAR' : 'LEVANTAR'}
                                </button>
                                <button
                                    onClick={async () => {
                                        const updated = combatants.map(comb => comb.id === c.id ? { ...comb, status: 'dead' as const, hp: 0 } : comb);
                                        setCombatants(updated);
                                        await syncState({ combatants: updated });
                                    }}
                                    className="bg-red-600 border-4 border-red-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all"
                                >
                                    ☠️ MATAR
                                </button>
                            </div>
                        )}
                        {!isMaster && isOwnHero && (
                            <button
                                onClick={() => setConfirmCureModal({ open: true, combatant: c })}
                                className="bg-green-600 border-4 border-green-300 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all animate-pulse"
                            >
                                ❤️ USAR POÇÃO / CURA
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-5 flex-1 w-full">
                    <div className="bg-rpg-dark border border-rpg-gold/30 w-10 h-10 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-cinzel text-rpg-gold font-bold shrink-0 shadow-inner">
                        {c.initiative}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-xl font-cinzel text-rpg-parchment leading-tight truncate group-hover:text-rpg-gold transition-colors">{c.name}</h3>
                            {isOwnHero && (
                                <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold uppercase">VOCÊ</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs uppercase font-bold tracking-widest mt-1">
                            <span className={`px-1.5 py-0.5 rounded border ${c.type === 'player' ? 'border-blue-500/50 text-blue-400 bg-blue-950/30' :
                                c.type === 'npc' ? 'border-yellow-600/50 text-yellow-400 bg-yellow-950/30' :
                                    'border-red-600/50 text-red-400 bg-red-950/30'
                                }`}>
                                {c.type === 'monster' ? '👹 MONSTRO' : c.type === 'player' ? '🛡️ JOGADOR' : '⚔️ NPC'}
                            </span>
                            {(isMaster || isOwnHero) && c.externalId && (
                                <Link
                                    href={`/personagem/${c.externalId}`}
                                    target="_blank"
                                    className="px-1.5 py-0.5 rounded border border-rpg-gold/50 text-rpg-gold bg-rpg-gold/10 hover:bg-rpg-gold/20 transition-all flex items-center gap-1"
                                >
                                    👁️ FICHA
                                </Link>
                            )}
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

                <div className="flex flex-col gap-3 w-full pt-3 border-t border-white/5 sm:w-[50%] sm:pt-0 sm:border-t-0 sm:border-l sm:pl-4">
                    {/* Vida */}
                    <div className="w-full">
                        {showFullHP ? (
                            <>
                                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-1.5 font-medieval tracking-widest">
                                    <span className="text-rpg-grey">VIDA: <span className="text-rpg-parchment">{c.hp} / {c.maxHp}</span></span>
                                    <span className={c.hp / c.maxHp < 0.3 ? 'text-red-500 animate-pulse' : 'text-rpg-grey'}>{Math.round((c.hp / c.maxHp) * 100)}%</span>
                                </div>
                                <div className="h-2 sm:h-3 w-full bg-rpg-dark/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
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
                    </div>

                    {/* Efeitos */}
                    {hasEffects && (
                        (() => {
                            const benefits = c.statusEffects.filter(se => benefitIds.includes(se.id) || (se as any).category === 'benefit');
                            const debuffs = c.statusEffects.filter(se => !benefits.includes(se));

                            if (benefits.length > 0 && debuffs.length > 0) {
                                return (
                                    <div className="w-full rounded-lg overflow-hidden border-2 border-purple-500/50">
                                        <div className="flex h-12">
                                            <div className="flex-1 bg-gradient-to-br from-green-900/50 to-green-900/20 border-r border-green-600/50 px-2 py-1 overflow-y-auto">
                                                <div className="text-[9px] text-green-400 font-bold uppercase mb-0.5">✦ Ben.</div>
                                                {benefits.map(se => <div key={se.id} className="text-[12px] text-green-300 font-bold truncate">{getEffectDisplayName(se.id, se.name)}</div>)}
                                            </div>
                                            <div className="flex-1 bg-gradient-to-br from-red-900/50 to-red-900/20 px-2 py-1 overflow-y-auto">
                                                <div className="text-[9px] text-red-400 font-bold uppercase mb-0.5">⚠ Mal.</div>
                                                {debuffs.map(se => <div key={se.id} className="text-[12px] text-red-300 font-bold truncate">{getEffectDisplayName(se.id, se.name)}</div>)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            if (benefits.length > 0) {
                                return (
                                    <div className="w-full space-y-1">
                                        {benefits.map(se => (
                                            <div key={se.id} className="p-2 rounded bg-green-900/20 border border-green-600/50 text-green-300 text-[12px] font-bold">
                                                ✦ {getEffectDisplayName(se.id, se.name)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            return (
                                <div className="w-full space-y-1">
                                    {debuffs.map(se => (
                                        <div key={se.id} className="p-2 rounded bg-red-900/20 border border-red-600/50 text-red-300 text-[12px] font-bold">
                                            ⚠ {getEffectDisplayName(se.id, se.name)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}

                    {/* Controles */}
                    {(isMaster || isOwnHero) && (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center justify-start">
                                {c.type === 'player' && (
                                    <button
                                        onClick={() => { setClassFxTarget(c); setIsClassFxOpen(true); }}
                                        className="w-14 h-12 rounded-lg bg-indigo-900/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40 transition-all flex items-center justify-center text-xl"
                                    >
                                        ✨
                                    </button>
                                )}
                                <button onClick={() => updateHP(c.id, -1)} className="flex-1 h-12 rounded-lg bg-red-900/20 border border-red-500/40 text-red-400 font-bold text-xl hover:bg-red-900/40 transition-all">-</button>
                                <button onClick={() => updateHP(c.id, 1)} className="flex-1 h-12 rounded-lg bg-green-900/20 border border-green-500/40 text-green-400 font-bold text-xl hover:bg-green-900/40 transition-all">+</button>
                                {isMaster && (
                                    <button onClick={() => removeCombatant(c.id)} className="w-14 h-12 rounded-lg bg-rpg-dark/50 border border-white/10 text-white/20 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 items-center">
                                <div className="flex-1 flex gap-1 items-center bg-rpg-dark/30 rounded-lg border border-red-500/20 px-2 py-1.5">
                                    <input
                                        type="number"
                                        placeholder="Dano"
                                        value={hpAdjustmentValues[c.id] || ''}
                                        onChange={(e) => sethpAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const v = parseInt(hpAdjustmentValues[c.id] || '0');
                                                if (v) { updateHP(c.id, -v); sethpAdjustmentValues(prev => ({ ...prev, [c.id]: '' })); }
                                            }
                                        }}
                                        className="w-full h-10 bg-rpg-dark/50 border border-white/10 rounded px-2 text-sm text-center focus:border-rpg-gold outline-none font-medieval text-white font-bold"
                                    />
                                    <button
                                        onClick={() => {
                                            const v = parseInt(hpAdjustmentValues[c.id] || '0');
                                            if (v) { updateHP(c.id, -v); sethpAdjustmentValues(prev => ({ ...prev, [c.id]: '' })); }
                                        }}
                                        className="h-10 px-3 text-red-400 font-bold rounded active:scale-95"
                                    >
                                        ✓
                                    </button>
                                </div>

                                <div className="flex-1 flex gap-1 items-center bg-rpg-dark/30 rounded-lg border border-green-500/20 px-2 py-1.5">
                                    <input
                                        type="number"
                                        placeholder="Cura"
                                        value={healAdjustmentValues[c.id] || ''}
                                        onChange={(e) => setHealAdjustmentValues(prev => ({ ...prev, [c.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const v = parseInt(healAdjustmentValues[c.id] || '0');
                                                if (v) { updateHP(c.id, v); setHealAdjustmentValues(prev => ({ ...prev, [c.id]: '' })); }
                                            }
                                        }}
                                        className="w-full h-10 bg-rpg-dark/50 border border-white/10 rounded px-2 text-sm text-center focus:border-rpg-gold outline-none font-medieval text-white font-bold"
                                    />
                                    <button
                                        onClick={() => {
                                            const v = parseInt(healAdjustmentValues[c.id] || '0');
                                            if (v) { updateHP(c.id, v); setHealAdjustmentValues(prev => ({ ...prev, [c.id]: '' })); }
                                        }}
                                        className="h-10 px-3 text-green-400 font-bold rounded active:scale-95"
                                    >
                                        ✓
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CombatantCard;
