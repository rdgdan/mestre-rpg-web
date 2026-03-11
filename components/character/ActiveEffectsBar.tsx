import React from 'react';
import { Character } from '@/lib/character-data';
import {
    CLASS_EFFECTS,
    COMMON_CONDITIONS,
    getEffectStyle,
    BENEFIT_IDS
} from '@/lib/effects-conditions';

interface ActiveEffectsBarProps {
    character: Character;
    isReadOnly: boolean;
    onToggleEffect: (id: string) => void;
}

export const ActiveEffectsBar: React.FC<ActiveEffectsBarProps> = ({
    character,
    isReadOnly,
    onToggleEffect
}) => {
    const activeEffects = character.activeEffects || [];
    const activeConditions = character.conditions || [];
    const allActiveIds = [...activeEffects, ...activeConditions];

    if (allActiveIds.length === 0) return null;

    const benefits = allActiveIds.filter(id => BENEFIT_IDS.includes(id));
    const debuffs = allActiveIds.filter(id => !BENEFIT_IDS.includes(id));

    const getEffectName = (id: string) => {
        const classEffect = Object.values(CLASS_EFFECTS).flat().find(e => e.id === id);
        if (classEffect) return classEffect.name;
        const commonCondition = COMMON_CONDITIONS.find(c => c.id === id);
        if (commonCondition) return commonCondition.name;
        return id;
    };

    return (
        <div className="px-6 py-5 card-glass border-none shadow-2xl relative overflow-hidden group/effects">
            <div className="absolute inset-0 bg-gradient-to-r from-rpg-gold/5 via-transparent to-rpg-gold/5 opacity-0 group-hover/effects:opacity-100 transition-opacity duration-1000" />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-rpg-gold/10 flex items-center justify-center border border-rpg-gold/20 shadow-glow-gold/10">
                            <span className="text-xl">⚡</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-rpg-gold font-black font-cinzel text-[10px] uppercase tracking-[0.3em]">Efeitos Ativos</span>
                            <span className="text-rpg-grey/60 text-[9px] font-black uppercase tracking-widest">{allActiveIds.length} em vigor</span>
                        </div>
                    </div>

                    <div className="flex-1 flex gap-3 flex-wrap justify-center md:justify-start">
                        {/* Benefícios */}
                        {benefits.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {benefits.map(id => {
                                    const style = getEffectStyle(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`px-4 py-2 rounded-xl border-none bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 backdrop-blur-md flex items-center gap-3 animate-pulse-soft shadow-lg group/item transition-all hover:scale-105`}
                                        >
                                            <span className="text-base">✨</span>
                                            <span className="text-xs font-black text-emerald-100 uppercase tracking-tighter">{getEffectName(id)}</span>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => onToggleEffect(id)}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-black/20 text-emerald-400/50 hover:bg-emerald-500 hover:text-white transition-all text-[8px]"
                                                    title="Remover"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Malefícios */}
                        {debuffs.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {debuffs.map(id => {
                                    const style = getEffectStyle(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`px-4 py-2 rounded-xl border-none bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-md flex items-center gap-3 animate-pulse-soft shadow-lg group/item transition-all hover:scale-105`}
                                        >
                                            <span className="text-base text-red-400">⚠</span>
                                            <span className="text-xs font-black text-red-100 uppercase tracking-tighter">{getEffectName(id)}</span>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => onToggleEffect(id)}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-black/20 text-red-400/50 hover:bg-red-500 hover:text-white transition-all text-[8px]"
                                                    title="Remover"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveEffectsBar;
