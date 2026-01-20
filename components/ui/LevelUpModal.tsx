
// components/ui/LevelUpModal.tsx
"use client";

import React from 'react';
import { LevelProgression, SUBCLASSES, SUBCLASS_CHOICE_LEVELS } from '@/lib/class-features';
import { getSpellsKnownCount, getFullCasterSlotLevel, getSpellcastingAbility, getCantripsKnownCount } from '@/lib/level-progression';
import SpellSelectModal from './SpellSelectModal';
import { Spell } from '@/lib/spells-data';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (choices: { attributes: Record<string, number>; hpIncrease: number; newSpells?: Spell[]; subclass?: string }) => void;
    level: number;
    charClassName: string;
    progression?: LevelProgression;
    currentSpells?: Spell[];
    currentAttributes?: Record<string, number>;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, onApply, level, charClassName, progression, currentSpells = [], currentAttributes = {} }) => {
    const [attrChoices, setAttrChoices] = React.useState<Record<string, number>>({
        strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
    });
    const [hpIncrease, setHpIncrease] = React.useState(0);
    const [spellModalOpen, setSpellModalOpen] = React.useState(false);
    const [isCantripSelection, setIsCantripSelection] = React.useState(false); // Flag para saber se modal é truque
    const [newSpells, setNewSpells] = React.useState<Spell[]>([]);
    const [selectedSubclass, setSelectedSubclass] = React.useState<string>('');

    if (!isOpen) return null;

    const hasASI = progression?.features.some(f => f.name.includes("Melhoria no Valor de Atributo"));
    const totalPointsSpent = Object.values(attrChoices).reduce((a, b) => a + b, 0);
    const pointsRemaining = 2 - totalPointsSpent;



    // Lógica de Magias
    const spellsKnownTotal = getSpellsKnownCount(charClassName, level);
    const cantripsKnownTotal = getCantripsKnownCount(charClassName, level);

    // Classes preparadas ou Mago
    const isWizard = charClassName.toLowerCase().includes('mago');
    const isPreparedCaster = ['clérigo', 'druida', 'paladino'].some(c => charClassName.toLowerCase().includes(c));

    // Quantas magias pode APRENDER (adicionar ao grimório/conhecidas)
    let spellsToLearn = 0;
    let cantripsToLearn = Math.max(0, cantripsKnownTotal - currentSpells.filter(s => s.level === 0).length);

    if (isWizard) {
        // Nível 1: 3 Truques + 6 Magias = 9
        // Outros níveis: +2 Magias (Truques são fixos/incrementais à parte, mas simplificando)
        spellsToLearn = level === 1 ? 6 : 2;
        cantripsToLearn = level === 1 ? 3 : Math.max(0, cantripsKnownTotal - currentSpells.filter(s => s.level === 0).length);
    } else if (spellsKnownTotal > 0) {
        // Calcula quantas faltam para atingir o limite conhecido
        spellsToLearn = Math.max(0, spellsKnownTotal - currentSpells.filter(s => s.level > 0).length);
    }

    const availableSpellLevel = getFullCasterSlotLevel(level); // Simplificado. Warlock/Half-caster precisaria de mais refino na função getFullCasterSlotLevel

    const handleAttrChange = (attr: string, delta: number) => {
        if (delta > 0 && pointsRemaining <= 0) return;
        if (delta < 0 && attrChoices[attr] <= 0) return;
        setAttrChoices(prev => ({ ...prev, [attr]: prev[attr] + delta }));
    };

    const isMaxLevel = level === 20;
    const isTierLevel = [5, 11, 17].includes(level);

    // Lógica de Subclasse
    const subclassLevel = SUBCLASS_CHOICE_LEVELS[charClassName];
    const canChooseSubclass = level === subclassLevel;
    const availableSubclasses = canChooseSubclass ? SUBCLASSES[charClassName] : {};
    const hasSubclassesAvailable = Object.keys(availableSubclasses || {}).length > 0;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-2 sm:p-4 animate-in fade-in duration-500">
            <div className={`modal-theme-c border-2 ${isMaxLevel ? 'border-purple-500 shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]' : 'shadow-[0_0_50px_-10px_rgba(255,120,72,0.5)]'} rounded-lg w-full max-w-lg overflow-hidden relative group max-h-[95vh] flex flex-col`} style={{
              borderColor: isMaxLevel ? 'rgba(168, 85, 247, 1)' : 'rgba(255, 120, 72, 0.5)'
            }}>
                {/* Efeito de Brilho de Fundo */}
                <div className={`absolute inset-0 ${isMaxLevel ? 'bg-gradient-to-b from-purple-500/10 to-transparent' : 'bg-gradient-to-b from-yellow-500/10 to-transparent'} pointer-events-none`} />

                {/* Cabeçalho de Celebração */}
                <div className="p-4 sm:p-8 text-center modal-header-theme-c border-b relative overflow-hidden shrink-0" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}>
                    <div className="absolute inset-0 flex justify-center items-center opacity-10">
                        <span className={`text-7xl sm:text-9xl font-black ${isMaxLevel ? 'text-purple-500' : 'text-yellow-400'} select-none`}>{level}</span>
                    </div>
                    <h2 className={`${isMaxLevel ? 'text-purple-400' : 'text-yellow-300'} text-[10px] sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1 sm:mb-2 font-cinzel`}>
                        {isMaxLevel ? 'ALCANÇADO O ÁPICE DO PODER' : isTierLevel ? 'UM NOVO MARCO ALCANÇADO' : 'Novo Nível Alcançado'}
                    </h2>
                    <div className="flex justify-center items-baseline gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <span className={`text-4xl sm:text-6xl font-extrabold ${isMaxLevel ? 'text-purple-200' : 'text-rpg-parchment'} font-cinzel text-shadow-glow`}>{level}</span>
                        <span className="text-lg sm:text-2xl font-medieval text-rpg-grey italic">{isMaxLevel ? 'Lenda Viva' : 'nesta jornada'}</span>
                    </div>
                    <p className="text-yellow-300 text-base sm:text-xl font-medieval font-bold border-t border-b border-yellow-400/20 py-1 sm:py-2 inline-block px-4 sm:px-8">
                        {charClassName}
                    </p>
                </div>

                {/* Conteúdo das Habilidades */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar relative bg-rpg-panel/80 space-y-6 sm:space-y-8 flex-grow">
                    {/* SEÇÃO DE MAGIAS (NOVA) */}
                    {(spellsToLearn > 0 || isWizard) && (
                        <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-5 animate-in zoom-in-95 duration-500 delay-100 space-y-4">
                            {/* TRUQUES */}
                            {cantripsToLearn > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest border-l-4 border-purple-500 pl-3">Novos Truques</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-purple-200 font-bold">{newSpells.filter(s => s.level === 0).length}/{cantripsToLearn}</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${newSpells.filter(s => s.level === 0).length < cantripsToLearn ? 'bg-purple-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
                                                {newSpells.filter(s => s.level === 0).length < cantripsToLearn ? `Escolha ${cantripsToLearn - newSpells.filter(s => s.level === 0).length}` : '✓ Completo'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsCantripSelection(true); setSpellModalOpen(true); }}
                                        disabled={newSpells.filter(s => s.level === 0).length >= cantripsToLearn}
                                        className={`w-full p-4 border border-dashed border-purple-400/30 rounded-lg transition-all group flex items-center justify-center gap-2 ${
                                            newSpells.filter(s => s.level === 0).length >= cantripsToLearn
                                                ? 'opacity-50 cursor-not-allowed bg-purple-900/10'
                                                : 'hover:bg-purple-900/20'
                                        }`}
                                    >
                                        <span className="text-purple-300 group-hover:text-purple-100 font-bold uppercase tracking-widest text-xs">+ Selecionar Truque</span>
                                    </button>
                                    <div className="mt-2 space-y-1">
                                        {newSpells.filter(s => s.level === 0).map(spell => (
                                            <div key={spell.id} className="text-xs text-purple-200 bg-purple-900/40 px-2 py-1 rounded flex justify-between">
                                                <span>{spell.name}</span>
                                                <button onClick={() => setNewSpells(prev => prev.filter(s => s.id !== spell.id))} className="text-red-400 hover:text-red-200">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* MAGIAS NIVELADAS */}
                            {spellsToLearn > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest border-l-4 border-purple-500 pl-3">Novas Magias</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-purple-200 font-bold">{newSpells.filter(s => s.level > 0).length}/{spellsToLearn}</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${newSpells.filter(s => s.level > 0).length < spellsToLearn ? 'bg-purple-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
                                                {newSpells.filter(s => s.level > 0).length < spellsToLearn ? `Escolha ${spellsToLearn - newSpells.filter(s => s.level > 0).length}` : '✓ Completo'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsCantripSelection(false); setSpellModalOpen(true); }}
                                        disabled={newSpells.filter(s => s.level > 0).length >= spellsToLearn}
                                        className={`w-full p-4 border border-dashed border-purple-400/30 rounded-lg transition-all group flex items-center justify-center gap-2 ${
                                            newSpells.filter(s => s.level > 0).length >= spellsToLearn
                                                ? 'opacity-50 cursor-not-allowed bg-purple-900/10'
                                                : 'hover:bg-purple-900/20'
                                        }`}
                                    >
                                        <span className="text-purple-300 group-hover:text-purple-100 font-bold uppercase tracking-widest text-xs">+ Selecionar Magia</span>
                                    </button>
                                    <div className="mt-2 space-y-1">
                                        {newSpells.filter(s => s.level > 0).map(spell => (
                                            <div key={spell.id} className="text-xs text-purple-200 bg-purple-900/40 px-2 py-1 rounded flex justify-between">
                                                <span>{spell.name}</span>
                                                <button onClick={() => setNewSpells(prev => prev.filter(s => s.id !== spell.id))} className="text-red-400 hover:text-red-200">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SEÇÃO DE ATRIBUTOS (ASI) */}
                    {hasASI && (
                        <div className="bg-blue-900/10 border border-blue-500/30 rounded-lg p-5 animate-in zoom-in-95 duration-500">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Melhoria de Atributo</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${pointsRemaining > 0 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-600 text-gray-300'}`}>
                                    {pointsRemaining > 0 ? `${pointsRemaining} Pontos Restantes` : 'Pontos Distribuídos'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {Object.keys(attrChoices).map(attr => (
                                    <div key={attr} className="flex items-center justify-between bg-black/20 p-2 rounded border border-blue-500/10">
                                        <span className="text-[10px] sm:text-xs font-bold text-rpg-parchment uppercase">{attr.slice(0, 3)}</span>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <button onClick={() => handleAttrChange(attr, -1)} className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-rpg-slate rounded hover:bg-rpg-dark text-rpg-gold font-bold transition-colors">-</button>
                                            <span className="w-4 text-center font-bold text-blue-300 text-sm sm:text-base">{(currentAttributes[attr] || 10) + attrChoices[attr]} <span className="text-[8px] text-rpg-grey">({attrChoices[attr] > 0 ? '+' + attrChoices[attr] : attrChoices[attr]})</span></span>
                                            <button onClick={() => handleAttrChange(attr, 1)} className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-rpg-slate rounded hover:bg-rpg-dark text-rpg-gold font-bold transition-colors">+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SEÇÃO DE ESCOLHA DE SUBCLASSE */}
                    {canChooseSubclass && hasSubclassesAvailable && (
                        <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-lg p-5 animate-in zoom-in-95 duration-500 delay-200">
                            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest border-l-4 border-emerald-500 pl-3 mb-4">
                                Escolha seu Caminho: Subclasse
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.keys(availableSubclasses).map(subclassName => (
                                    <button
                                        key={subclassName}
                                        onClick={() => setSelectedSubclass(subclassName)}
                                        className={`p-4 rounded border text-left transition-all ${selectedSubclass === subclassName
                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-glow-emerald/20'
                                            : 'bg-black/40 border-emerald-500/10 text-rpg-grey hover:bg-emerald-900/20 hover:text-emerald-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold font-medieval text-lg">{subclassName}</span>
                                            {selectedSubclass === subclassName && <span className="text-emerald-400 font-bold">✓</span>}
                                        </div>
                                        {/* Poderia adicionar descrição aqui se disponível na estrutura */}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* SEÇÃO DE HP */}
                    <div className="bg-rpg-red/5 border border-rpg-red/20 rounded-lg p-5">
                        <h3 className="text-xs font-bold text-rpg-red uppercase tracking-widest mb-4 border-l-4 border-rpg-red pl-3">Aumento de Vitalidade</h3>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                            <div className="flex-grow">
                                <label className="block text-[10px] text-rpg-grey uppercase mb-1 font-bold">Valor Ganho (+ Dados + CON)</label>
                                <input
                                    type="number"
                                    value={hpIncrease}
                                    onChange={e => setHpIncrease(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/40 border border-rpg-red/20 rounded px-4 py-2 text-2xl font-bold text-rpg-parchment font-medieval focus:border-rpg-red/50 outline-none"
                                />
                            </div>
                            <div className="text-center bg-black/40 p-3 sm:p-4 rounded-lg border border-rpg-red/10 w-full sm:w-32 flex flex-row sm:flex-col justify-between items-center sm:justify-center">
                                <span className="text-[10px] text-rpg-grey uppercase block mb-0 sm:mb-1">Dado de Vida</span>
                                <span className="text-2xl font-black text-rpg-red font-medieval">{progression?.hitDice || 'd8'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-rpg-gold uppercase tracking-widest border-l-4 border-rpg-gold pl-3">Habilidades de Classe</h3>
                        {progression ? (
                            progression.features.filter(f => !f.name.includes("Melhoria no Valor de Atributo")).map((feature, idx) => (
                                <div key={idx} className="bg-white/5 border border-rpg-gold/10 p-4 rounded-md hover:bg-white/10 transition-colors group/item relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-rpg-parchment font-medieval text-lg group-hover/item:text-rpg-gold transition-colors">{feature.name}</h4>
                                        {feature.isChoice && (
                                            <span className="bg-blue-600/20 text-blue-300 text-[8px] px-2 py-0.5 rounded border border-blue-500/30 font-black uppercase tracking-tighter shadow-sm animate-pulse">Escolha Requerida</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-rpg-grey leading-relaxed font-sans">{feature.description}</p>
                                    {feature.choiceText && (
                                        <p className="mt-2 text-[10px] font-bold text-blue-300/80 bg-blue-900/10 p-2 rounded border border-blue-500/10 italic">{feature.choiceText}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50 italic">
                                <p className="text-4xl mb-4">📜</p>
                                <p>Continue treinando, aventureiro. O próximo nível reserva grandes mistérios.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-4 sm:p-6 border-t border-rpg-gold/20 flex justify-center bg-black/40 shrink-0">
                    <button
                        onClick={() => {
                            if (canChooseSubclass && !selectedSubclass) {
                                alert("Por favor, escolha uma subclasse para continuar.");
                                return;
                            }
                            onApply({ attributes: attrChoices, hpIncrease, newSpells, subclass: selectedSubclass });
                            onClose();
                        }}
                        className="w-full sm:w-auto px-8 sm:px-12 py-3 bg-gradient-to-r from-rpg-gold via-yellow-400 to-rpg-gold text-rpg-dark font-black rounded shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transform hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs sm:text-sm font-cinzel"
                    >
                        Reivindicar Poder
                    </button>
                </div>

                <SpellSelectModal
                    isOpen={spellModalOpen}
                    onClose={() => setSpellModalOpen(false)}
                    filterClass={charClassName}
                    filterLevel={isCantripSelection ? 0 : (availableSpellLevel > 0 ? availableSpellLevel : undefined)}
                    minLevel={isCantripSelection ? undefined : 1}
                    onSelect={(spell) => {
                        const limit = isCantripSelection ? cantripsToLearn : spellsToLearn;
                        const currentCount = isCantripSelection ? newSpells.filter(s => s.level === 0).length : newSpells.filter(s => s.level > 0).length;

                        // Validação de tipo (Magia vs Truque)
                        if (isCantripSelection && spell.level !== 0) {
                            alert("❌ Por favor, selecione um Truque (Nível 0).\n\nVocê está escolhendo Truques, não Magias.");
                            return;
                        }
                        if (!isCantripSelection && spell.level === 0) {
                            alert("❌ Por favor, selecione uma Magia de Nível 1 ou superior.\n\nVocê está escolhendo Magias, não Truques.");
                            return;
                        }

                        if (currentCount >= limit) {
                            alert(`❌ Limite atingido!\n\nVocê já escolheu ${currentCount}/${limit} ${isCantripSelection ? 'truques' : 'magias'}.\n\nRemova um para adicionar outro.`);
                            return;
                        }
                        if (!newSpells.find(s => s.id === spell.id) && !currentSpells.find(s => s.id === spell.id)) {
                            setNewSpells(prev => [...prev, spell]);
                            setSpellModalOpen(false);
                        } else {
                            alert("⚠️ Você já possui esta magia!\n\nNão é possível aprender a mesma magia duas vezes.");
                        }
                    }}
                    onCreate={() => {
                        // Opcional: implementar criação rápida
                        setSpellModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
};

export default LevelUpModal;
