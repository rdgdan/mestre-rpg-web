
// components/ui/LevelUpModal.tsx
"use client";

import React from 'react';
import { LevelProgression } from '@/lib/class-features';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (choices: { attributes: Record<string, number>; hpIncrease: number }) => void;
    level: number;
    charClassName: string;
    progression?: LevelProgression;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, onApply, level, charClassName, progression }) => {
    const [attrChoices, setAttrChoices] = React.useState<Record<string, number>>({
        strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0
    });
    const [hpIncrease, setHpIncrease] = React.useState(0);

    if (!isOpen) return null;

    const hasASI = progression?.features.some(f => f.name.includes("Melhoria no Valor de Atributo"));
    const totalPointsSpent = Object.values(attrChoices).reduce((a, b) => a + b, 0);
    const pointsRemaining = 2 - totalPointsSpent;

    const handleAttrChange = (attr: string, delta: number) => {
        if (delta > 0 && pointsRemaining <= 0) return;
        if (delta < 0 && attrChoices[attr] <= 0) return;
        setAttrChoices(prev => ({ ...prev, [attr]: prev[attr] + delta }));
    };

    const isMaxLevel = level === 20;
    const isTierLevel = [5, 11, 17].includes(level);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-2 sm:p-4 animate-in fade-in duration-500">
            <div className={`bg-rpg-panel border-2 ${isMaxLevel ? 'border-purple-500 shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]' : 'border-rpg-gold/50 shadow-[0_0_50px_-10px_rgba(218,165,32,0.5)]'} rounded-lg w-full max-w-lg overflow-hidden relative group max-h-[95vh] flex flex-col`}>
                {/* Efeito de Brilho de Fundo */}
                <div className={`absolute inset-0 ${isMaxLevel ? 'bg-gradient-to-b from-purple-500/10 to-transparent' : 'bg-gradient-to-b from-rpg-gold/10 to-transparent'} pointer-events-none`} />

                {/* Cabeçalho de Celebração */}
                <div className="p-4 sm:p-8 text-center bg-black/40 border-b border-rpg-gold/20 relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 flex justify-center items-center opacity-10">
                        <span className={`text-7xl sm:text-9xl font-black ${isMaxLevel ? 'text-purple-500' : 'text-rpg-gold'} select-none`}>{level}</span>
                    </div>
                    <h2 className={`${isMaxLevel ? 'text-purple-400' : 'text-rpg-gold'} text-[10px] sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-1 sm:mb-2 font-cinzel`}>
                        {isMaxLevel ? 'ALCANÇADO O ÁPICE DO PODER' : isTierLevel ? 'UM NOVO MARCO ALCANÇADO' : 'Novo Nível Alcançado'}
                    </h2>
                    <div className="flex justify-center items-baseline gap-2 sm:gap-4 mb-2 sm:mb-4">
                        <span className={`text-4xl sm:text-6xl font-extrabold ${isMaxLevel ? 'text-purple-200' : 'text-rpg-parchment'} font-cinzel text-shadow-glow`}>{level}</span>
                        <span className="text-lg sm:text-2xl font-medieval text-rpg-grey italic">{isMaxLevel ? 'Lenda Viva' : 'nesta jornada'}</span>
                    </div>
                    <p className="text-rpg-gold-light text-base sm:text-xl font-medieval font-bold border-t border-b border-rpg-gold/10 py-1 sm:py-2 inline-block px-4 sm:px-8">
                        {charClassName}
                    </p>
                </div>

                {/* Conteúdo das Habilidades */}
                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar relative bg-rpg-panel/80 space-y-6 sm:space-y-8 flex-grow">
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
                                            <span className="w-4 text-center font-bold text-blue-300 text-sm sm:text-base">{attrChoices[attr]}</span>
                                            <button onClick={() => handleAttrChange(attr, 1)} className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-rpg-slate rounded hover:bg-rpg-dark text-rpg-gold font-bold transition-colors">+</button>
                                        </div>
                                    </div>
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
                            onApply({ attributes: attrChoices, hpIncrease });
                            onClose();
                        }}
                        className="w-full sm:w-auto px-8 sm:px-12 py-3 bg-gradient-to-r from-rpg-gold via-yellow-400 to-rpg-gold text-rpg-dark font-black rounded shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transform hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs sm:text-sm font-cinzel"
                    >
                        Reivindicar Poder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LevelUpModal;
