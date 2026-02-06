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

            <div className="flex justify-end mb-2">
                {!isReadOnly && (
                    <button onClick={() => setSpellSelectOpen(true)} className="px-5 py-2.5 rounded-lg bg-rpg-gold text-rpg-dark font-bold hover:shadow-glow-gold transition-all shadow-md uppercase text-xs tracking-wider font-cinzel" style={{
                        background: 'linear-gradient(135deg, #FFB800 0%, #FF7848 100%)',
                        boxShadow: '0 0 16px rgba(255, 120, 72, 0.4)'
                    }}>+ Adicionar Magia</button>
                )}
            </div>

            {/* Seção de Truques (Nível 0) */}
            {(() => {
                const cantrips = (character.spells || []).filter(s => s && (s.level === 0 || s.level === undefined)); // Assume 0/undefined as cantrip if not specified
                if (cantrips.length > 0) {
                    return (
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/10 border border-purple-500/20 rounded-lg p-4 shadow-md hover:border-purple-500/40 transition-all mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">✨</span>
                                        <h3 className="text-base font-bold text-amber-400 font-cinzel uppercase tracking-widest">Truques & Talentos Mágicos</h3>
                                    </div>
                                    <span className="text-[11px] bg-purple-500/20 border border-purple-400/30 text-purple-200 uppercase tracking-widest font-semibold px-3 py-1 rounded-full">∞ Ilimitados</span>
                                </div>
                                <p className="text-[11px] text-rpg-grey/70 uppercase tracking-widest mt-2">Magia de nível 0 - Sempre disponível</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cantrips.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                    <div key={spell.id || idx} className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 border border-purple-500/20 hover:border-purple-500/40 rounded-lg p-4 transition-all relative shadow-md hover:shadow-lg hover:shadow-purple-500/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-amber-300 font-medieval text-base flex-grow">{spell.name}</span>
                                            <div className="flex gap-1 ml-2 flex-shrink-0">
                                                {spell.concentration && <span className="text-[8px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Concentração">C</span>}
                                                {spell.ritual && <span className="text-[8px] bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ritual">R</span>}
                                                <span className="text-[8px] bg-green-900/60 text-green-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ilimitado">∞</span>
                                                <span className="text-[8px] bg-purple-600/40 text-white px-1.5 py-0.5 rounded font-black tracking-tighter" title="Classe">{(spell.sourceClass || character.class).slice(0, 3).toUpperCase()}</span>
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
                <h3 className="text-base font-bold text-amber-400 font-cinzel uppercase tracking-widest flex items-center gap-2 ml-1 mb-4">
                    <span className="text-lg">📖</span> Grimório de Magias
                </h3>
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

                            // Slots Normais
                            const normalSlots = slotInfo ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] bg-purple-900/40 text-purple-200 border border-purple-500/30 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm font-bold">
                                        Slots: <span className="text-purple-100 font-cinzel text-xs ml-1">{slotInfo.current}/{slotInfo.max}</span>
                                    </span>
                                </div>
                            ) : null;

                            // Slots de Pacto (Bruxo)
                            const pactSlots = pactInfo ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()} title="Magia de Pacto (Bruxo) - Recupera em Descanso Curto">
                                    <span className="text-[10px] bg-blue-900/40 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm font-bold">
                                        Pacto: <span className="text-blue-100 font-cinzel text-xs ml-1">{pactInfo.current}/{pactInfo.max}</span>
                                    </span>
                                </div>
                            ) : null;

                            return (
                                <div className="flex gap-2 ml-4">
                                    {normalSlots}
                                    {pactSlots}
                                </div>
                            );
                        };

                        return (
                            <div key={level} className="bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md overflow-hidden transition-all hover:border-rpg-gold/20">
                                <div
                                    className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/10 border-b border-purple-500/20 cursor-pointer hover:bg-gradient-to-r hover:from-purple-900/50 hover:to-purple-800/20 transition-all"
                                    onClick={() => setExpandedSpellLevels(prev => ({ ...prev, [level]: !prev[level] }))}
                                >
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-full text-sm font-bold border border-purple-300/50 shadow-[0_0_8px_rgba(147,51,234,0.4)]">{level}</span>
                                        <h3 className="text-base font-bold text-rpg-gold font-cinzel uppercase tracking-widest">{levelLabel}</h3>
                                        <div className="flex-grow" />
                                        <SlotCounter />
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <span className="text-[11px] text-rpg-grey/80 uppercase tracking-widest font-semibold bg-black/20 px-3 py-1 rounded-full">{spells.length} magia{spells.length !== 1 ? 's' : ''}</span>
                                        <span className={`text-rpg-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-gradient-to-b from-purple-950/20 to-transparent rounded-b-lg">
                                        {spells.length === 0 ? (
                                            <div className="col-span-full text-center py-4 text-rpg-grey/50 italic text-xs">Nenhuma magia aprendida deste nível.</div>
                                        ) : (
                                            spells.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((spell, idx) => (
                                                <div key={spell.id || idx} className="bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-4 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all relative shadow-md hover:shadow-lg hover:shadow-purple-500/10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2 flex-grow">
                                                            <button
                                                                disabled={isReadOnly}
                                                                onClick={() => togglePreparedSpell(spell.name)}
                                                                className={`w-3 h-3 rounded-full border transition-all flex-shrink-0 ${spell.prepared ? 'bg-green-500 border-green-400 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'border-purple-400/50 hover:border-green-500/70'}`}
                                                                title={spell.prepared ? "Despreparar" : "Preparar"}
                                                            ></button>
                                                            <span className="font-bold text-amber-300 font-medieval text-base">{spell.name}</span>
                                                        </div>
                                                        <div className="flex gap-1 ml-2 flex-shrink-0">
                                                            {spell.concentration && <span className="text-[8px] bg-blue-900/60 text-blue-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Concentração">C</span>}
                                                            {spell.ritual && <span className="text-[8px] bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ritual">R</span>}
                                                            {spell.level !== undefined && spell.level !== 0 && (
                                                                <span className="text-[8px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Slots">
                                                                    {getSpellUsageDescription(spell.level, getMaxSpellSlots(character.class, character.level, spell.level), 0)}
                                                                </span>
                                                            )}
                                                            {spell.level === 0 && <span className="text-[8px] bg-green-900/60 text-green-200 px-1.5 py-0.5 rounded font-black tracking-tighter" title="Ilimitado">∞</span>}
                                                            <span className="text-[8px] bg-purple-600/40 text-white px-1.5 py-0.5 rounded font-black tracking-tighter" title="Classe">
                                                                {(() => {
                                                                    if (spell.sourceClass) return spell.sourceClass.slice(0, 3).toUpperCase();
                                                                    const casterClass = (character.classes || []).find(c => getCasterType(c.name) !== 'none');
                                                                    return (casterClass?.name || character.class || 'MAG').slice(0, 3).toUpperCase();
                                                                })()}
                                                            </span>
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
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
