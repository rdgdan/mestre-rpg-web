import React from 'react';
import { Character, ATTRIBUTE_DISPLAY_NAMES, ATTRIBUTE_KEYS } from '@/lib/character-data';
import { AttributeInput } from './AttributeInput';
import { StatBlock } from './StatBlock';

interface CharacterStatsTabProps {
    character: Character;
    isReadOnly: boolean;
    handleLevelChange: (level: number) => void;
    handleFieldChange: (field: string, value: any) => void;
    handleNestedChange: (path: string, value: any) => void;
    activeTooltip: string | null;
    setActiveTooltip: (label: string | null) => void;
}

export const CharacterStatsTab: React.FC<CharacterStatsTabProps> = ({
    character,
    isReadOnly,
    handleLevelChange,
    handleFieldChange,
    handleNestedChange,
    activeTooltip,
    setActiveTooltip
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Atributos Section */}
            <div className={`grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x transition-opacity ${character.currentHp <= 0 && !isReadOnly ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                {ATTRIBUTE_KEYS.map(attr => (
                    <AttributeInput
                        key={attr}
                        label={ATTRIBUTE_DISPLAY_NAMES[attr]}
                        value={character.attributes[attr]}
                        onChange={(val) => handleNestedChange(`attributes.${attr}`, val)}
                        disabled={isReadOnly || character.currentHp <= 0}
                        breakdown={character.attributeBreakdown?.[attr]}
                        activeTooltip={activeTooltip}
                        setActiveTooltip={setActiveTooltip}
                    />
                ))}
            </div>

            {/* Health and Status */}
            <div className="card-glass border-none p-6 md:p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rpg-gold/5 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-rpg-gold/10 transition-all duration-700" />
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* HP Circle Component (Modularizado Internamente) */}
                    <div className="flex flex-col items-center justify-center lg:border-r lg:border-rpg-gold/10 lg:pr-8">
                        <div className="relative w-32 h-32 sm:w-44 sm:h-44 group">
                            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" className="stroke-black/40" strokeWidth="6" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    className={`transition-all duration-1000 ease-out ${character.currentHp / character.maxHp > 0.5 ? 'stroke-green-500' : character.currentHp / character.maxHp > 0.2 ? 'stroke-yellow-500' : 'stroke-red-600'}`}
                                    strokeWidth="6"
                                    strokeDasharray={2 * Math.PI * 45}
                                    strokeDashoffset={2 * Math.PI * 45 * (1 - Math.min(1, character.currentHp / character.maxHp))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] sm:text-xs font-bold text-rpg-gold uppercase tracking-[0.2em] font-cinzel mb-1">Pontos de Vida</span>
                                <div className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        disabled={isReadOnly}
                                        value={character.currentHp}
                                        onChange={(e) => handleFieldChange('currentHp', parseInt(e.target.value) || 0)}
                                        className="w-16 sm:w-20 text-3xl sm:text-5xl font-black text-center bg-transparent text-rpg-parchment font-medieval outline-none"
                                    />
                                    <span className="text-sm sm:text-xl font-bold text-rpg-grey">/ {character.maxHp}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-4 w-full">
                            <button
                                disabled={isReadOnly}
                                onClick={() => handleFieldChange('currentHp', Math.max(0, character.currentHp - 1))}
                                className="flex-1 bg-red-900/20 border border-red-500/30 text-red-500 py-1.5 rounded-md font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >-</button>
                            <button
                                disabled={isReadOnly}
                                onClick={() => handleFieldChange('currentHp', Math.min(character.maxHp, character.currentHp + 1))}
                                className="flex-1 bg-green-900/20 border border-green-500/30 text-green-500 py-1.5 rounded-md font-bold hover:bg-green-500 hover:text-white transition-all active:scale-95"
                            >+</button>
                        </div>
                    </div>

                    <div className="flex-grow space-y-6">
                        {/* HP Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] sm:text-xs font-bold text-rpg-gold uppercase tracking-[0.2em] font-cinzel">Vigor do Herói</span>
                                <span className="text-[10px] sm:text-xs font-bold text-rpg-grey">{Math.round((character.currentHp / character.maxHp) * 100)}%</span>
                            </div>
                            <div className="h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden p-0.5">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${character.currentHp / character.maxHp > 0.5 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                                        (character.currentHp / character.maxHp) > 0.2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                        }`}
                                    style={{ width: `${Math.min(100, (character.currentHp / character.maxHp) * 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Secondary Stats Grid */}
                        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${character.currentHp <= 0 && !isReadOnly ? 'opacity-40' : ''}`}>
                            <StatBlock label="Classe de Armadura" value={character.armorClass} subLabel="CA" />
                            <StatBlock label="Iniciativa" value={character.initiative >= 0 ? `+${character.initiative}` : character.initiative} subLabel="Mod. Destreza" />
                            <StatBlock label="Deslocamento" value={character.currentHp <= 0 ? '0m' : `${character.speed}m`} subLabel={character.currentHp <= 0 ? 'Caído' : "Caminhada"} />
                            <div className="p-5 card-glass border-none text-center flex flex-col justify-center items-center group transition-all duration-300 min-h-[120px] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rpg-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <h4 className="text-[10px] font-black text-rpg-gold/60 uppercase mb-3 tracking-[0.2em] font-serif leading-tight">Proficiência</h4>
                                <div className="text-4xl font-black text-white font-serif group-hover:text-rpg-gold-light transition-colors">+{character.proficiencyBonus}</div>
                                <span className="text-[9px] text-rpg-grey/40 uppercase tracking-widest font-bold mt-1">Bônus Base</span>
                            </div>
                        </div>

                        {/* Deconstructed Stats: Death Saves & Temp HP */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* HP Temporário */}
                            <div className={`card-glass border-none p-5 text-center group translate-y-0 hover:-translate-y-1 transition-all ${character.currentHp <= 0 && !isReadOnly ? 'opacity-40' : ''}`}>
                                <h5 className="text-[10px] font-black text-blue-300 uppercase tracking-widest font-serif mb-3">HP Temporário</h5>
                                <div className="flex items-center justify-center gap-6">
                                    <button disabled={isReadOnly || (character.currentHp <= 0 && !isReadOnly)} onClick={() => handleFieldChange('temporaryHp', Math.max(0, (character.temporaryHp || 0) - 1))} className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center hover:bg-blue-500/30 transition-all">-</button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        disabled={isReadOnly || (character.currentHp <= 0 && !isReadOnly)}
                                        value={character.temporaryHp || 0}
                                        onChange={(e) => handleFieldChange('temporaryHp', parseInt(e.target.value) || 0)}
                                        className="w-20 text-4xl font-black text-white bg-transparent text-center font-serif outline-none"
                                    />
                                    <button disabled={isReadOnly || (character.currentHp <= 0 && !isReadOnly)} onClick={() => handleFieldChange('temporaryHp', (character.temporaryHp || 0) + 1)} className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center hover:bg-blue-500/30 transition-all">+</button>
                                </div>
                            </div>

                            {/* Resistência à Morte */}
                            <div className="card-glass border-none p-5 group translate-y-0 hover:-translate-y-1 transition-all">
                                <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest font-serif mb-4 text-center">Resistência à Morte</h5>
                                <div className="space-y-5 max-w-[200px] mx-auto py-2">
                                    <div className="flex justify-between items-center gap-6">
                                        <span className="text-[12px] text-green-500 font-bold tracking-[0.2em]">SUCESSO</span>
                                        <div className="flex gap-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} onClick={() => !isReadOnly && handleNestedChange('deathSaves.successes', character.deathSaves?.successes >= i ? i - 1 : i)}
                                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm rotate-45 border-2 transition-all cursor-pointer ${character.deathSaves?.successes >= i ? 'bg-green-500 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-black/40 border-white/10 hover:border-rpg-gold/40'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center gap-6">
                                        <span className="text-[12px] text-red-500 font-bold tracking-[0.2em]">FALHA</span>
                                        <div className="flex gap-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} onClick={() => !isReadOnly && handleNestedChange('deathSaves.failures', character.deathSaves?.failures >= i ? i - 1 : i)}
                                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm rotate-45 border-2 transition-all cursor-pointer ${character.deathSaves?.failures >= i ? 'bg-red-500 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'bg-black/40 border-white/10 hover:border-rpg-gold/40'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CharacterStatsTab;
