import React from 'react';
import Link from 'next/link';
import { Character } from '@/lib/character-data';
import { getXPForNextLevel, getXPProgress, shouldLevelUp } from '@/lib/xp-progression';
import { SUBCLASS_CHOICE_LEVELS } from '@/lib/class-features';

interface CharacterHeaderProps {
    character: Character;
    isReadOnly: boolean;
    isNew: boolean;
    onFieldChange: (field: any, value: any) => void;
    onLevelChange: (newLevel: number) => void;
    onOpenSubclassModal: () => void;
    onOpenXPModal: () => void;
    onOpenSelectionModal: (type: 'class' | 'race') => void;
    onUpdateCharacter: (updater: (char: Character) => Character) => void;
    onSaveNewCharacter?: () => void;
    onRest: (type: 'short' | 'long') => void;
    campaignId?: string;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
    character,
    isReadOnly,
    isNew,
    onFieldChange,
    onLevelChange,
    onOpenSubclassModal,
    onOpenXPModal,
    onOpenSelectionModal,
    onUpdateCharacter,
    onSaveNewCharacter,
    onRest,
    campaignId
}) => {
    return (
        <div className="max-w-7xl mx-auto relative z-10">
            {/* Navigation and Actions */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <div className="w-full md:w-auto">
                    <Link
                        href={campaignId ? `/campanha/${campaignId}?tab=characters` : "/personagens"}
                        className="block w-full text-center md:inline-block md:w-auto px-4 py-2 text-sm font-bold rounded-md bg-rpg-panel border border-rpg-gold/20 text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold shadow-lg hover:shadow-glow-gold transition-all"
                    >
                        &larr; {campaignId ? "Voltar à Campanha" : "Voltar ao Salão"}
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                    {isReadOnly && (
                        <div className="px-4 py-2 bg-rpg-gold/20 border border-rpg-gold text-rpg-gold rounded font-bold font-cinzel flex items-center gap-2 animate-pulse text-xs md:text-sm">
                            <span>👁️</span> <span className="hidden sm:inline">Modo Espectador (Mestre)</span><span className="sm:hidden">Espectador</span>
                        </div>
                    )}

                    {!isReadOnly && !isNew && (
                        <>
                            <button
                                onClick={() => onRest('short')}
                                className="flex-grow md:flex-grow-0 bg-amber-900/20 border border-amber-500/30 text-amber-400 px-3 py-2 rounded hover:bg-amber-900/40 transition-all text-xs font-bold flex items-center justify-center gap-2"
                                title="Descanso Curto - 1 hora (Bruxaria se recupera)"
                            >
                                <span>☕</span> Curto
                            </button>
                            <button
                                onClick={() => onRest('long')}
                                className="flex-grow md:flex-grow-0 bg-indigo-900/20 border border-indigo-500/30 text-indigo-400 px-3 py-2 rounded hover:bg-indigo-900/40 transition-all text-xs font-bold flex items-center justify-center gap-2"
                                title="Restaurar PV e Slots de Magia"
                            >
                                <span>⛺</span> Longo
                            </button>
                        </>
                    )}

                    {isNew && onSaveNewCharacter && (
                        <button
                            onClick={onSaveNewCharacter}
                            className="w-full md:w-auto px-6 py-2 font-bold rounded-md bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark hover:from-yellow-400 hover:to-rpg-gold shadow-lg transform hover:scale-105 transition-all"
                        >
                            Salvar Novo Personagem
                        </button>
                    )}
                </div>
            </div>

            <header className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6 p-6 md:p-8 card-glass border-none shadow-2xl relative overflow-hidden group transition-all duration-500 hover:shadow-glow-gold/10">
                {/* Glow decorativo de fundo */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-rpg-gold/5 rounded-full blur-3xl group-hover:bg-rpg-gold/10 transition-all duration-700" />
                
                <div className="flex-grow w-full relative z-10">
                    <input
                        type="text"
                        disabled={isReadOnly}
                        value={character.name}
                        onChange={e => onFieldChange('name', e.target.value)}
                        className="w-full text-3xl sm:text-4xl md:text-6xl font-black bg-transparent border-none font-serif text-rpg-gold focus:outline-none transition-all placeholder-rpg-grey/20 truncate drop-shadow-sm"
                        placeholder="Nome do Personagem"
                    />
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="px-3 py-1 bg-rpg-gold/10 rounded-full border border-rpg-gold/20">
                            <p className="text-rpg-gold/90 uppercase font-black tracking-[0.25em] text-[11px]">
                                {character.race} • {character.displayClass || character.class}{character.subclass ? ` (${character.subclass})` : ''}
                            </p>
                        </div>
                        {!character.subclass && character.level >= (SUBCLASS_CHOICE_LEVELS[character.class] || 3) && !isReadOnly && (
                            <button
                                onClick={onOpenSubclassModal}
                                className="text-[9px] bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full hover:bg-purple-500 hover:text-white transition-all animate-pulse flex items-center gap-1 shadow-glow-purple/20 whitespace-nowrap"
                            >
                                <span className="text-xs">✨</span> Subclasse
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-[600px]">
                    <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-left">Classes do Personagem</label>
                        <div className="flex flex-wrap gap-2">
                            {(character.classes || []).map((c, index) => (
                                <div key={`${c.name}-${index}`} className="flex items-center bg-rpg-slate border border-rpg-gold/30 rounded-md overflow-hidden shadow-lg group hover:border-rpg-gold transition-all">
                                    <button
                                        disabled={isReadOnly}
                                        onClick={() => onOpenSelectionModal('class')}
                                        className="px-3 py-1.5 text-left font-medieval text-sm flex flex-col min-w-[100px] hover:bg-rpg-gold/5"
                                    >
                                        <span className="text-rpg-gold text-xs leading-tight">{c.name}</span>
                                        <span className="text-rpg-grey text-[10px] leading-tight font-bold">Nível {c.level}</span>
                                    </button>
                                    {!isReadOnly && (character.classes || []).length > 1 && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Remover a classe ${c.name}? Isso não afetará seu nível total, mas você precisará distribuir o nível ${c.level} em outra classe.`)) {
                                                    onUpdateCharacter(char => {
                                                        const newClasses = char.classes.filter((_, i) => i !== index);
                                                        return { ...char, classes: newClasses };
                                                    });
                                                }
                                            }}
                                            className="px-2 py-1.5 h-full bg-rpg-red/10 text-rpg-red hover:bg-rpg-red/20 border-l border-rpg-gold/20 transition-all text-xs"
                                            title="Remover Classe"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isReadOnly && (character.classes || []).length < 4 && (
                                <button
                                    onClick={() => onOpenSelectionModal('class')}
                                    className="px-3 py-1.5 bg-green-900/20 border border-green-500/30 text-green-400 rounded-md hover:bg-green-900/40 transition-all text-xs font-bold flex items-center gap-2"
                                >
                                    <span>+</span> Multiclasse
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-left">Raça</label>
                        <button disabled={isReadOnly} onClick={() => onOpenSelectionModal('race')} className={`w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-left hover:border-rpg-gold/50 font-medieval text-sm ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {character.race || 'Selecione...'}
                        </button>
                    </div>

                    <div className="flex items-end gap-3 col-span-1 sm:col-span-2">
                        <div className="w-24 text-center group shrink-0">
                            <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel transition-colors group-hover:text-yellow-400 text-center">Nível</label>
                            <div className="relative flex items-center justify-between bg-rpg-slate border-2 border-rpg-gold/30 rounded-lg p-1 shadow-lg shadow-black/40 group-hover:border-rpg-gold transition-all h-[42px]">
                                <button
                                    onClick={() => onLevelChange((character.level || 1) - 1)}
                                    disabled={isReadOnly}
                                    className={`w-7 h-full flex items-center justify-center bg-rpg-dark/50 hover:bg-rpg-red/20 text-rpg-grey hover:text-rpg-red rounded transition-all font-bold z-10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >-</button>
                                <span className="text-2xl font-black text-rpg-gold font-medieval drop-shadow-glow-gold px-1">{character.level || 1}</span>
                                <button
                                    onClick={() => onLevelChange((character.level || 1) + 1)}
                                    disabled={isReadOnly}
                                    className={`w-7 h-full flex items-center justify-center bg-rpg-dark/50 hover:bg-green-900/20 text-rpg-grey hover:text-green-500 rounded transition-all font-bold z-10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >+</button>
                            </div>
                        </div>

                        <div className="flex-grow min-w-0">
                            <label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-left">Experiência</label>
                            <div className="bg-rpg-slate border border-rpg-gold/20 rounded-md p-2 flex flex-col gap-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-rpg-grey font-cinzel truncate">
                                        {(() => {
                                            const nextXP = getXPForNextLevel(character.level);
                                            return character.level >= 20 ? 'Max' : `${character.experience} / ${nextXP} XP`;
                                        })()}
                                    </span>
                                    {!isReadOnly && (
                                        <div className="flex gap-2">
                                            {shouldLevelUp(character.level, character.experience) && (
                                                <button
                                                    onClick={() => onLevelChange((character.level || 1) + 1)}
                                                    className="text-[9px] bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 rounded font-bold transition-all whitespace-nowrap animate-bounce shadow-glow-green"
                                                >
                                                    Level Up! 🌟
                                                </button>
                                            )}
                                            <button
                                                onClick={onOpenXPModal}
                                                className="text-[9px] bg-rpg-gold/20 hover:bg-rpg-gold/30 text-rpg-gold px-2 py-0.5 rounded font-bold transition-all whitespace-nowrap"
                                            >
                                                + XP
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {character.level < 20 && (
                                    <div className="h-2 bg-black/40 rounded-full border border-white/5 overflow-hidden mt-1 mx-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-rpg-gold/60 to-rpg-gold transition-all duration-500 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                                            style={{
                                                width: `${getXPProgress(character.level, character.experience)}%`
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
};

export default CharacterHeader;
