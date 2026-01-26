import { Character } from '@/lib/character-data';
import { CLASS_PRIMARY_ATTRIBUTES, getSmartASISuggestions } from '@/lib/class-attributes';
import { LevelProgression, SUBCLASSES, SUBCLASS_CHOICE_LEVELS } from '@/lib/class-features';
import { getCantripsKnownCount, getFullCasterSlotLevel, getSpellsKnownCount } from '@/lib/level-progression';
import { Spell } from '@/lib/spells-data';
import React, { useEffect, useMemo } from 'react';
import SpellSelectModal from './SpellSelectModal';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (choices: { attributes: Record<string, number>; hpIncrease: number; newSpells?: Spell[]; subclass?: string; className: string; isNewClass: boolean }) => void;
    level: number;
    charClassName: string;
    progression?: LevelProgression;
    currentSpells?: Spell[];
    currentAttributes?: Record<string, number>;
    character: Character;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, onApply, level, charClassName, progression, currentSpells = [], currentAttributes = {}, character }) => {
    const [step, setStep] = React.useState<'class-selection' | 'details'>('class-selection');
    const [selectedClassName, setSelectedClassName] = React.useState<string>(charClassName);
    const [isNewClass, setIsNewClass] = React.useState(false);

    const [attrChoices, setAttrChoices] = React.useState<Record<string, number>>({
        strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
    });
    const [hpIncrease, setHpIncrease] = React.useState(0);
    const [spellModalOpen, setSpellModalOpen] = React.useState(false);
    const [isCantripSelection, setIsCantripSelection] = React.useState(false);
    const [newSpells, setNewSpells] = React.useState<Spell[]>([]);
    const [selectedSubclass, setSelectedSubclass] = React.useState<string>('');

    // ===== TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER EARLY RETURN =====
    const activeClassName = selectedClassName;
    const hasASI = progression?.features.some(f => f.name.includes("Melhoria no Valor de Atributo"));
    const totalPointsSpent = Object.values(attrChoices).reduce((a, b) => a + b, 0);
    const pointsRemaining = 2 - totalPointsSpent;

    // Sugestões inteligentes de ASI baseadas na classe
    const suggestedAttributes = useMemo(() => {
        if (!hasASI || !activeClassName) return null;
        return getSmartASISuggestions(activeClassName, currentAttributes);
    }, [hasASI, activeClassName, currentAttributes]);

    // Pré-selecionar atributos sugeridos e calcular HP padrão
    useEffect(() => {
        if (step === 'details') {
            // 1. Sugestões de ASI
            if (hasASI && suggestedAttributes) {
                const initialChoices: Record<string, number> = {
                    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
                };
                suggestedAttributes.attributes.forEach((attr, index) => {
                    if (index < 2) initialChoices[attr] = 1;
                });
                setAttrChoices(initialChoices);
            }

            // 2. Calcular HP Padrão (Média do Dado + CON)
            if (progression?.hitDice) {
                const conScore = currentAttributes.constitution || 10;
                const conMod = Math.floor((conScore - 10) / 2);

                // Extrair o tamanho do dado (ex: "1d8" -> 8)
                const dieSize = parseInt(progression.hitDice.split('d')[1]) || 8;

                // Média arredondada para cima (Regra D&D 5e: (Dado / 2) + 1)
                // Ex: d8 (4.5) -> 5 | d10 (5.5) -> 6
                const avgRoll = Math.ceil(dieSize / 2) + 1;

                const standardHp = Math.max(1, avgRoll + conMod); // Mínimo 1 HP
                setHpIncrease(standardHp);
            }
        }
    }, [hasASI, suggestedAttributes, step, progression?.hitDice, currentAttributes]);

    // Lógica de Magias
    const spellsKnownTotal = getSpellsKnownCount(activeClassName, isNewClass ? 1 : (character?.classes?.find(c => c.name === activeClassName)?.level || 0) + 1);
    const cantripsKnownTotal = getCantripsKnownCount(activeClassName, isNewClass ? 1 : (character?.classes?.find(c => c.name === activeClassName)?.level || 0) + 1);

    // Classes preparadas ou Mago
    const isWizard = activeClassName.toLowerCase().includes('mago');
    const isPreparedCaster = ['clérigo', 'druida', 'paladino'].some(c => activeClassName.toLowerCase().includes(c));
    // ===== FIM DOS HOOKS =====

    if (!isOpen) return null;

    // Se estiver no passo de seleção
    if (step === 'class-selection') {
        const currentClasses = character?.classes || [{ name: charClassName, level: level }];

        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-500">
                <div className="modal-theme-c border-2 border-rpg-gold/30 rounded-lg w-full max-w-md p-8 bg-rpg-panel relative text-center">
                    <h2 className="text-2xl font-cinzel text-rpg-gold mb-6 uppercase tracking-widest">Subir de Nível</h2>
                    <p className="text-rpg-grey mb-8 font-medieval">Em qual classe você deseja focar seu treinamento?</p>

                    <div className="space-y-3 mb-8">
                        {currentClasses.map((c, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSelectedClassName(c.name); setIsNewClass(false); setStep('details'); }}
                                className="w-full py-4 bg-rpg-slate/50 border border-rpg-gold/20 rounded-lg text-rpg-parchment font-bold hover:bg-rpg-gold hover:text-rpg-dark transition-all flex justify-between px-6 items-center group"
                            >
                                <span className="font-medieval text-lg">{c.name}</span>
                                <span className="text-xs bg-black/30 px-2 py-1 rounded group-hover:bg-black/50">Nível {c.level} → {c.level + 1}</span>
                            </button>
                        ))}

                        <button
                            onClick={() => { setSelectedClassName('Guerreiro'); setIsNewClass(true); setStep('details'); }}
                            className="w-full py-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-emerald-300 font-bold hover:bg-emerald-500 hover:text-white transition-all flex justify-center items-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            <span className="font-medieval text-lg">Nova Classe (Multiclasse)</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="text-rpg-grey/50 hover:text-rpg-grey uppercase text-[10px] font-bold tracking-widest">Cancelar</button>
                </div>
            </div>
        );
    }

    // Quantas magias pode APRENDER
    let spellsToLearn = 0;
    let cantripsToLearn = Math.max(0, cantripsKnownTotal - currentSpells.filter(s => s.level === 0).length);

    const currentClassLevel = isNewClass ? 0 : (character?.classes?.find(c => c.name === activeClassName)?.level || 0);
    const nextClassLevel = currentClassLevel + 1;

    if (isWizard) {
        spellsToLearn = nextClassLevel === 1 ? 6 : 2;
        cantripsToLearn = nextClassLevel === 1 ? 3 : Math.max(0, cantripsKnownTotal - currentSpells.filter(s => s.level === 0).length);
    } else if (spellsKnownTotal > 0) {
        spellsToLearn = Math.max(0, spellsKnownTotal - currentSpells.filter(s => s.level > 0).length);
    }

    const availableSpellLevel = getFullCasterSlotLevel(nextClassLevel);

    const handleAttrChange = (attr: string, delta: number) => {
        const currentValue = (currentAttributes[attr] || 10) + attrChoices[attr];

        if (delta > 0) {
            if (pointsRemaining <= 0) return;
            if (currentValue + delta > 20) {
                alert(`⚠️ O atributo ${attr.toUpperCase()} não pode ultrapassar o limite máximo de 20.`);
                return;
            }
        }

        if (delta < 0 && attrChoices[attr] <= 0) return;
        setAttrChoices(prev => ({ ...prev, [attr]: prev[attr] + delta }));
    };

    const canClaimPower = () => {
        if (hasASI && pointsRemaining > 0) return false;
        const cantripsChosen = newSpells.filter(s => s.level === 0).length;
        const spellsChosen = newSpells.filter(s => s.level > 0).length;
        if (cantripsToLearn > 0 && cantripsChosen < cantripsToLearn) return false;
        if (spellsToLearn > 0 && spellsChosen < spellsToLearn) return false;
        if (canChooseSubclass && !selectedSubclass) return false;
        return true;
    };

    const isMaxLevel = level === 20;
    const isTierLevel = [5, 11, 17].includes(level);

    // Lógica de Subclasse
    const subclassLevel = SUBCLASS_CHOICE_LEVELS[activeClassName];
    const canChooseSubclass = nextClassLevel === subclassLevel;
    const availableSubclasses = canChooseSubclass ? SUBCLASSES[activeClassName] : {};
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
                        <span className={`text-7xl sm:text-9xl font-black ${isMaxLevel ? 'text-purple-500' : 'text-yellow-400'} select-none`}>{level + 1}</span>
                    </div>
                    <button
                        onClick={() => setStep('class-selection')}
                        className="absolute top-4 left-4 text-rpg-grey/40 hover:text-rpg-gold transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                        <span>← Alterar Classe</span>
                    </button>

                    <h2 className={`${isMaxLevel ? 'text-purple-400' : 'text-yellow-300'} text-[10px] sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1 sm:mb-2 font-cinzel`}>
                        {isMaxLevel ? 'ALCANÇADO O ÁPICE DO PODER' : isTierLevel ? 'UM NOVO MARCO ALCANÇADO' : 'Novo Nível Alcançado'}
                    </h2>
                    <div className="flex justify-center items-baseline gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <span className={`text-4xl sm:text-6xl font-extrabold ${isMaxLevel ? 'text-purple-200' : 'text-rpg-parchment'} font-cinzel text-shadow-glow`}>{level + 1}</span>
                        <span className="text-lg sm:text-2xl font-medieval text-rpg-grey italic">{isMaxLevel ? 'Lenda Viva' : 'nesta jornada'}</span>
                    </div>
                    <p className="text-yellow-300 text-base sm:text-xl font-medieval font-bold border-t border-b border-yellow-400/20 py-1 sm:py-2 inline-block px-4 sm:px-8">
                        {activeClassName}
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
                                        className={`w-full p-4 border border-dashed border-purple-400/30 rounded-lg transition-all group flex items-center justify-center gap-2 ${newSpells.filter(s => s.level === 0).length >= cantripsToLearn
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
                                        className={`w-full p-4 border border-dashed border-purple-400/30 rounded-lg transition-all group flex items-center justify-center gap-2 ${newSpells.filter(s => s.level > 0).length >= spellsToLearn
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
                            {/* Banner de Sugestão */}
                            {suggestedAttributes && suggestedAttributes.attributes.length > 0 && (
                                <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-400/30">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-blue-300 text-sm">💡</span>
                                        <span className="text-blue-200 text-xs font-bold">Sugestão para {activeClassName}</span>
                                    </div>
                                    <p className="text-[10px] text-blue-300 italic">{suggestedAttributes.description}</p>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Melhoria de Atributo</h3>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${pointsRemaining > 0 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-600 text-gray-300'}`}>
                                    {pointsRemaining > 0 ? `${pointsRemaining} Pontos Restantes` : 'Pontos Distribuídos'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {Object.keys(attrChoices).map(attr => {
                                    const classAttrs = CLASS_PRIMARY_ATTRIBUTES[activeClassName];
                                    const isPrimary = classAttrs?.primary.includes(attr as any);
                                    const isSecondary = classAttrs?.secondary.includes(attr as any);

                                    return (
                                        <div key={attr} className={`flex items-center justify-between bg-black/20 p-2 rounded border transition-all ${isPrimary ? 'border-blue-400/50 ring-1 ring-blue-400/30' :
                                            isSecondary ? 'border-blue-500/20' :
                                                'border-blue-500/10'
                                            }`}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-rpg-parchment uppercase">{attr.slice(0, 3)}</span>
                                                    {isPrimary && <span className="text-[8px] text-blue-400">★</span>}
                                                </div>
                                                {isPrimary && <span className="text-[7px] text-blue-400/70">Principal</span>}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <button onClick={() => handleAttrChange(attr, -1)} className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-rpg-slate rounded hover:bg-rpg-dark text-rpg-gold font-bold transition-colors">-</button>
                                                <span className="w-4 text-center font-bold text-blue-300 text-sm sm:text-base">{(currentAttributes[attr] || 10) + attrChoices[attr]} <span className="text-[8px] text-rpg-grey">({attrChoices[attr] > 0 ? '+' + attrChoices[attr] : attrChoices[attr]})</span></span>
                                                <button onClick={() => handleAttrChange(attr, 1)} className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-rpg-slate rounded hover:bg-rpg-dark text-rpg-gold font-bold transition-colors">+</button>
                                            </div>
                                        </div>
                                    );
                                })}
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


                    {/* SEÇÃO DE HP (Vitalidade) */}
                    <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-5 animate-in zoom-in-95 duration-500 delay-100">
                        <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest mb-4 border-l-4 border-red-500 pl-3">Aumento de Vitalidade (PV)</h3>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                            <div className="flex-grow">
                                <label className="block text-[10px] text-red-200/70 uppercase mb-1 font-bold">
                                    Valor Ganho (Dado + CON [{(() => {
                                        const mod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                        return mod >= 0 ? `+${mod}` : mod;
                                    })()}])
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setHpIncrease(prev => Math.max(1, prev - 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-black/40 border border-red-500/30 rounded hover:bg-red-500/20 text-red-200 text-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={hpIncrease <= 1}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={hpIncrease === 0 ? '' : hpIncrease}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;

                                            // Calcular limite máximo (Dado + CON)
                                            const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                            const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                                            const maxHp = dieSize + conMod;

                                            // Se apagar tudo (val = 0), permite temporariamente para facilitar digitação
                                            // Mas se digitar valor maior que Max, bloqueia
                                            if (e.target.value === "") {
                                                setHpIncrease(0);
                                                return;
                                            }

                                            if (val > maxHp) {
                                                // Bloqueia e mantém o anterior ou seta pro máximo
                                                setHpIncrease(maxHp);
                                                return;
                                            }

                                            setHpIncrease(val);
                                        }}
                                        className={`flex-grow w-full bg-black/40 border rounded px-4 py-2 text-2xl font-bold font-medieval outline-none text-center transition-colors ${(() => {
                                            const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                            const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                                            const maxHp = dieSize + conMod;
                                            return hpIncrease > maxHp ? 'border-red-500 text-red-500' : 'border-red-500/30 text-red-100 focus:border-red-500/60';
                                        })()
                                            }`}
                                    />
                                    <button
                                        onClick={() => {
                                            const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                            const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                                            const maxHp = dieSize + conMod;

                                            setHpIncrease(prev => Math.min(maxHp, prev + 1));
                                        }}
                                        className="w-10 h-10 flex items-center justify-center bg-black/40 border border-red-500/30 rounded hover:bg-red-500/20 text-red-200 text-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={(() => {
                                            const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                            const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                                            const maxHp = dieSize + conMod;
                                            return hpIncrease >= maxHp;
                                        })()}
                                    >
                                        +
                                    </button>
                                </div>
                                {(() => {
                                    const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                                    const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                                    const maxHp = dieSize + conMod;

                                    if (hpIncrease > maxHp) {
                                        return (
                                            <p className="text-[10px] text-red-500 mt-1 font-bold text-center animate-pulse">
                                                ⚠️ Valor excede o máximo possível ({maxHp})
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                                <p className="text-[9px] text-red-300/50 mt-1 italic text-center">Recomendado: {progression?.hitDice ? Math.max(1, (parseInt(progression.hitDice.split('d')[1]) / 2) + 1 + Math.floor(((currentAttributes.constitution || 10) - 10) / 2)) : 0}</p>
                            </div>
                            <div className="text-center bg-black/40 p-3 sm:p-4 rounded-lg border border-red-500/20 w-full sm:w-32 flex flex-row sm:flex-col justify-between items-center sm:justify-center">
                                <span className="text-[10px] text-red-300 uppercase block mb-0 sm:mb-1 opacity-70">Dado de Vida</span>
                                <span className="text-2xl font-black text-red-400 font-medieval drop-shadow-md">{progression?.hitDice || 'd8'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {progression ? (
                            <>
                                {/* Habilidades Recebidas Automaticamente */}
                                {progression.features.some(f => !f.isChoice && !f.name.includes("Melhoria no Valor de Atributo")) && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Novas Habilidades Recebidas</h3>
                                        {progression.features.filter(f => !f.isChoice && !f.name.includes("Melhoria no Valor de Atributo")).map((feature, idx) => (
                                            <div key={idx} className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-md group/item relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-emerald-200 font-medieval text-lg">{feature.name}</h4>
                                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-black uppercase tracking-tighter">✓ Automatico</span>
                                                </div>
                                                <p className="text-sm text-rpg-grey leading-relaxed font-sans">{feature.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Escolhas de Classe Necessárias */}
                                {progression.features.some(f => f.isChoice && !f.name.includes("Melhoria no Valor de Atributo")) && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-l-4 border-blue-500 pl-3">Escolhas de Classe Necessárias</h3>
                                        {progression.features.filter(f => f.isChoice && !f.name.includes("Melhoria no Valor de Atributo")).map((feature, idx) => (
                                            <div key={idx} className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-md group/item relative overflow-hidden border-dashed">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-blue-200 font-medieval text-lg">{feature.name}</h4>
                                                    <span className="bg-blue-600/20 text-blue-300 text-[8px] px-2 py-0.5 rounded border border-blue-500/30 font-black uppercase tracking-tighter animate-pulse">Ação Requerida</span>
                                                </div>
                                                <p className="text-sm text-rpg-grey mb-3 leading-relaxed font-sans">{feature.description}</p>
                                                {feature.choiceText && (
                                                    <div className="p-3 bg-blue-900/30 rounded border border-blue-500/20 flex flex-col gap-2">
                                                        <p className="text-[10px] font-bold text-blue-300 uppercase italic">⚠️ {feature.choiceText}</p>
                                                        <p className="text-[9px] text-rpg-grey italic">Nota: Algumas escolhas manuais devem ser registradas na aba "Habilidades" ou consultadas com o Mestre.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
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
                            // Validação final de HP
                            const conMod = Math.floor(((currentAttributes.constitution || 10) - 10) / 2);
                            const dieSize = parseInt(progression?.hitDice?.split('d')[1] || "8");
                            const maxHp = dieSize + conMod;

                            if (hpIncrease > maxHp) {
                                alert(`❌ Valor de HP inválido!\n\nO máximo possível é ${maxHp} (Dado ${dieSize} + CON ${conMod}).\n\nPor favor, corrija o valor antes de continuar.`);
                                return;
                            }

                            if (hpIncrease < 1) {
                                alert("❌ Valor de HP inválido!\n\nO aumento mínimo de vitalidade é 1.");
                                return;
                            }

                            if (!canClaimPower()) {
                                alert("Por favor, complete todas as escolhas obrigatórias antes de prosseguir (pontos de atributo, magias ou subclasse).");
                                return;
                            }
                            onApply({ attributes: attrChoices, hpIncrease, newSpells, subclass: selectedSubclass, className: activeClassName, isNewClass });
                            onClose();
                        }}
                        disabled={!canClaimPower()}
                        className={`w-full sm:w-auto px-8 sm:px-12 py-3 bg-gradient-to-r from-rpg-gold via-yellow-400 to-rpg-gold text-rpg-dark font-black rounded shadow-[0_0_20px_rgba(255,215,0,0.3)] transform transition-all uppercase tracking-widest text-xs sm:text-sm font-cinzel ${!canClaimPower()
                            ? 'opacity-50 cursor-not-allowed grayscale'
                            : 'hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95'
                            }`}
                    >
                        {canClaimPower() ? 'Reivindicar Poder' : 'Escolhas Pendentes...'}
                    </button>
                </div>

                <SpellSelectModal
                    isOpen={spellModalOpen}
                    onClose={() => setSpellModalOpen(false)}
                    filterClass={activeClassName}
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
        </div >
    );
};

export default LevelUpModal;
