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
        <div className="px-6 py-4 border-y border-rpg-gold/20 bg-gradient-to-r from-black/40 via-rpg-dark/60 to-black/40">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-rpg-gold font-cinzel text-xs uppercase tracking-widest font-bold">⚡ Efeitos Ativos</span>
                        <span className="bg-rpg-gold/20 text-rpg-gold px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {allActiveIds.length}
                        </span>
                    </div>

                    <div className="flex-1 flex gap-2 flex-wrap">
                        {/* Benefícios */}
                        {benefits.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {benefits.map(id => {
                                    const style = getEffectStyle(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`px-3 py-1.5 rounded-lg border ${style.borderClass} ${style.bgClass} flex items-center gap-2 animate-pulse-soft`}
                                        >
                                            <span className={`text-xs ${style.iconBg}`}>✨</span>
                                            <span className="text-xs font-bold text-green-100">{getEffectName(id)}</span>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => onToggleEffect(id)}
                                                    className="text-[10px] hover:text-red-400 transition-colors ml-1"
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
                            <div className="flex gap-1.5 flex-wrap">
                                {debuffs.map(id => {
                                    const style = getEffectStyle(id);
                                    return (
                                        <div
                                            key={id}
                                            className={`px-3 py-1.5 rounded-lg border ${style.borderClass} ${style.bgClass} flex items-center gap-2 animate-pulse-soft`}
                                        >
                                            <span className={`text-xs ${style.iconBg}`}>⚠</span>
                                            <span className="text-xs font-bold text-red-100">{getEffectName(id)}</span>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={() => onToggleEffect(id)}
                                                    className="text-[10px] hover:text-white transition-colors ml-1"
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
