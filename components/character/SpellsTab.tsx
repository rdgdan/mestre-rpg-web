import React, { useState, useMemo } from 'react';
import { Character, ATTRIBUTE_DISPLAY_NAMES } from '@/lib/character-data';
import { StatBlock } from '@/components/character/StatBlock';
import SpellSlotsDisplay from '@/components/ui/SpellSlotsDisplay';
import { getMaxSpellSlots, getSpellUsageDescription } from '@/lib/spell-slots';
import { getCasterType } from '@/lib/level-progression';

interface SpellsTabProps {
    character: Character;
    isReadOnly: boolean;
    preparedSpellsInfo: any;
    expandedSpellLevels: Record<number, boolean>;
    setExpandedSpellLevels: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    setSpellSelectOpen: (open: boolean) => void;
    handleSpellUsed: (spell: any) => void;
    togglePreparedSpell: (spellName: string) => void;
    handleRemoveSpell: (spellName: string) => void;
    formatSpellValue: (value: any) => string;
}

export const SpellsTab: React.FC<SpellsTabProps> = ({
    character,
    isReadOnly,
    preparedSpellsInfo,
    expandedSpellLevels,
    setExpandedSpellLevels,
    setSpellSelectOpen,
    handleSpellUsed,
    togglePreparedSpell,
    handleRemoveSpell,
    formatSpellValue
}) => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className={`grid grid-cols-1 ${preparedSpellsInfo ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4`}>
                <StatBlock label="Atributo de Conjuração" value={character.spellcasting?.ability ? ATTRIBUTE_DISPLAY_NAMES[character.spellcasting.ability].slice(0, 3).toUpperCase() : '-'} />
                <StatBlock label="CD de Resistência" value={character.spellcasting?.saveDc || 0} />
                <StatBlock label="Bônus de Ataque" value={`+${character.spellcasting?.attackBonus || 0}`} />
                {preparedSpellsInfo && (
                    <StatBlock
                        label="Magias Preparadas"
                        value={`${preparedSpellsInfo.current}/${preparedSpellsInfo.max}`}
                        subLabel={preparedSpellsInfo.current > preparedSpellsInfo.max ? '⚠️ Limite Excedido' : 'Grimório'}
                    />
                )}
            </div>

            {/* Exibição de Slots de Magia */}
            {character.class && character.spells && character.spellcasting && (
                <SpellSlotsDisplay
                    spellSlots={character.spellcasting.slots || {}}
                    pactLevel={character.spellcasting.pactLevel || 0}
                    characterClass={character.class || ''}
                    characterLevel={character.level || 1}
                    spells={character.spells || []}
                    onUseSpell={handleSpellUsed}
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif text-rpg-gold-light tracking-wide">Grimório Arcano</h2>
                {!isReadOnly && (
                    <button 
                        onClick={() => setSpellSelectOpen(true)} 
                        className="btn-premium btn-premium-gold text-[11px]"
                    >
                        <span>✨</span> ADICIONAR MAGIA
                    </button>
                )}
            </div>

            {/* Seção de Truques (Nível 0) */}
            {(() => {
                const cantrips = (character.spells || []).filter(s => s && (s.level === 0 || s.level === undefined)); // Assume 0/undefined as cantrip if not specified
                if (cantrips.length > 0) {
                    return (
                        <div className="mb-8 overflow-hidden">
                            <div className="card-glass border-none p-5 mb-4 relative group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50 shadow-glow-purple" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 rounded-lg text-xl">✨</div>
                                        <div>
                                            <h3 className="text-lg font-serif text-purple-300 tracking-wider">Truques & Cantrips</h3>
                                            <p className="text-[11px] text-rpg-grey/60 uppercase tracking-widest mt-0.5">Nível 0 • Sempre Disponível</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-purple-500/20 text-purple-200 uppercase tracking-widest font-black px-4 py-1.5 rounded-full border border-purple-400/20 shadow-inner">Ilimitado</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cantrips.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                    <div key={spell.id || idx} className="card-glass card-glass-hover p-4 border-none group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-bold text-rpg-gold-light font-serif text-lg leading-tight group-hover:text-white transition-colors">{spell.name}</span>
                                            <div className="flex gap-1.5 ml-2 flex-shrink-0">
                                                {spell.concentration && <span className="w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-300 rounded text-[9px] font-black border border-blue-400/30" title="Concentração">C</span>}
                                                {spell.ritual && <span className="w-5 h-5 flex items-center justify-center bg-amber-500/20 text-amber-300 rounded text-[9px] font-black border border-amber-400/30" title="Ritual">R</span>}
                                                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded text-[9px] font-black border border-gray-400/20 uppercase">{(spell.sourceClass || character.class).slice(0, 3)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] text-rpg-grey/70 uppercase font-sans tracking-tight border-b border-purple-500/10 pb-2">
                                            <span>{formatSpellValue(spell.castingTime)}</span>
                                            <span>{formatSpellValue(spell.range)}</span>
                                            <span>{formatSpellValue(spell.duration)}</span>
                                            <span className="text-purple-400/70 italic">{spell.school}</span>
                                        </div>
                                        <p className="text-xs text-rpg-grey/80 leading-relaxed">{spell.description}</p>
                                        {!isReadOnly && (
                                            <div className="flex justify-end mt-3">
                                                <button onClick={() => handleRemoveSpell(spell.name)} className="p-1.5 text-rpg-red/70 hover:text-rpg-red transition-colors" title="Esquecer Magia">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Magias Niveladas e Slots */}
            <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 mb-6 px-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-amber-500/10 rounded-lg text-lg border border-amber-500/20">📖</div>
                    <h3 className="text-xl font-serif text-amber-200 tracking-widest uppercase">Círculos de Magia</h3>
                </div>
                {(() => {
                    // Agrupar magias por nível (apenas nível 1+)
                    const validSpells = (character.spells || []).filter(s => s && typeof s === 'object' && (s.level !== undefined) && s.level > 0);

                    // Obter lista de níveis que possuem slots OU magias aprendidas
                    const slotsKeys = Object.keys(character.spellcasting?.slots || {});
                    const levelsWithSlots = slotsKeys
                        .filter(k => !isNaN(Number(k)))
                        .map(Number);

                    // Adiciona o nível de pacto se existir slots de pacto
                    const pactLevel = character.spellcasting?.pactLevel;
                    const hasPact = slotsKeys.includes('pact') && pactLevel;
                    if (hasPact && pactLevel && !levelsWithSlots.includes(pactLevel)) {
                        levelsWithSlots.push(pactLevel);
                    }

                    const levelsWithSpells = validSpells.map(s => s.level);
                    const allLevels = Array.from(new Set([...levelsWithSlots, ...levelsWithSpells]))
                        .filter(l => !isNaN(l))
                        .sort((a, b) => a - b);

                    if (allLevels.length === 0 && (!character.spells || character.spells.length === 0)) {
                        return (
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-10 rounded-lg shadow-md flex flex-col items-center justify-center text-rpg-grey/40">
                                <p className="text-6xl mb-4">📜</p>
                                <p className="italic font-medieval text-xl">Sua mente está limpa de encantamentos.</p>
                            </div>
                        );
                    }

                    return allLevels.map(level => {
                        const spells = validSpells.filter(s => s.level === level);
                        const isExpanded = expandedSpellLevels[level] !== false; // Default expanded
                        const levelLabel = `${level}º Nível`;

                        const slotInfo = character.spellcasting?.slots?.[level.toString()];
                        const pactInfo = (level === pactLevel) ? character.spellcasting?.slots?.pact : null;

                        // Renderização dos Slots no Cabeçalho
                        const SlotCounter = () => {
                            if (!slotInfo && !pactInfo) return null;

                            return (
                                <div className="flex gap-3 ml-4">
                                    {slotInfo && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full shadow-inner">
                                            <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Slots</span>
                                            <span className="text-xs font-serif text-white">{slotInfo.current}/{slotInfo.max}</span>
                                        </div>
                                    )}
                                    {pactInfo && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full shadow-inner" title="Slots de Pacto">
                                            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Pacto</span>
                                            <span className="text-xs font-serif text-white">{pactInfo.current}/{pactInfo.max}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div key={level} className="card-glass border-none overflow-hidden transition-all duration-300 group">
                                <div
                                    className="w-full flex justify-between items-center p-5 cursor-pointer relative z-10"
                                    onClick={() => setExpandedSpellLevels(prev => ({ ...prev, [level]: !prev[level] }))}
                                >
                                    <div className="flex items-center flex-wrap gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center bg-purple-500/20 text-purple-100 rounded-lg text-lg font-black border border-purple-400/30 shadow-glow-purple/20">{level}</div>
                                        <h3 className="text-lg font-serif text-white tracking-widest uppercase">{levelLabel}</h3>
                                        <SlotCounter />
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <span className="text-[10px] text-rpg-grey/40 uppercase tracking-[0.2em] font-black">{spells.length} MAGIA{spells.length !== 1 ? 'S' : ''}</span>
                                        <div className={`p-1.5 rounded-full bg-white/5 text-rpg-gold transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-rpg-gold/10' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-t border-white/5 bg-black/5 animate-fade-in">
                                        {spells.length === 0 ? (
                                            <div className="col-span-full text-center py-6 text-rpg-grey/30 italic font-serif">Nenhuma magia aprendida para este círculo.</div>
                                        ) : (
                                            spells.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                                <div key={spell.id || idx} className="card-glass card-glass-hover border-none p-4 flex flex-col group relative transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-3 flex-grow">
                                                            <button
                                                                disabled={isReadOnly}
                                                                onClick={() => togglePreparedSpell(spell.name)}
                                                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex-shrink-0 ${spell.prepared ? 'bg-green-500 border-white/20 shadow-glow-green/30' : 'border-white/10 hover:border-green-500/50'}`}
                                                                title={spell.prepared ? "Despreparar" : "Preparar"}
                                                            ></button>
                                                            <span className="font-bold text-lg font-serif text-white group-hover:text-rpg-gold-light transition-colors leading-tight">{spell.name}</span>
                                                        </div>
                                                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                                                            {spell.concentration && <span className="w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-300 rounded text-[9px] font-black border border-blue-400/30" title="Concentração">C</span>}
                                                            {spell.ritual && <span className="w-5 h-5 flex items-center justify-center bg-amber-500/20 text-amber-300 rounded text-[9px] font-black border border-amber-400/30" title="Ritual">R</span>}
                                                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded text-[9px] font-black border border-purple-400/30 uppercase">{(spell.sourceClass || character.class).slice(0, 3)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3 text-[9px] text-rpg-grey/50 uppercase font-black tracking-widest border-b border-white/5 pb-3">
                                                        <span>{formatSpellValue(spell.castingTime)}</span>
                                                        <span>{formatSpellValue(spell.range)}</span>
                                                        <span>{formatSpellValue(spell.duration)}</span>
                                                        <span className="italic text-rpg-gold/40">{spell.school}</span>
                                                    </div>
                                                    <p className="text-xs text-rpg-grey/70 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{spell.description}</p>
                                                    {!isReadOnly && (
                                                        <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleRemoveSpell(spell.name)} className="w-7 h-7 flex items-center justify-center bg-red-500/5 border border-red-500/20 text-red-500/50 hover:text-red-500 hover:border-red-500 rounded transition-all">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                   <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
};

export default SpellsTab;
