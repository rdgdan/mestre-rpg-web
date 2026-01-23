
import React, { useState, useEffect } from 'react';
import { AttributeKey, ATTRIBUTE_KEYS, ATTRIBUTE_DISPLAY_NAMES } from '../../lib/character-data';
import { RACE_BONUSES } from '../../lib/race-bonuses';
import { CLASS_ATTRIBUTE_PRIORITIES } from '../../lib/class-attributes';

interface StartingAttributesModalProps {
    isOpen: boolean;
    onClose: () => void;
    race: string;
    className?: string; // Classe opcional para sugestão
    onConfirm: (attributes: Record<AttributeKey, number>) => void;
}

const POINT_BUY_TOTAL = 27;
const MIN_SCORE = 8;
const MAX_SCORE = 15;
const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8];

const SCORE_COSTS: Record<number, number> = {
    8: 0,
    9: 1,
    10: 2,
    11: 3,
    12: 4,
    13: 5,
    14: 7,
    15: 9
};

export const StartingAttributesModal: React.FC<StartingAttributesModalProps> = ({ isOpen, onClose, race, className, onConfirm }) => {
    // Inicializa com sugestão baseada na classe ou tudo 8
    const [attributes, setAttributes] = useState<Record<AttributeKey, number>>(() => {
        const initial = {} as Record<AttributeKey, number>;

        if (className && CLASS_ATTRIBUTE_PRIORITIES[className]) {
            const priorities = CLASS_ATTRIBUTE_PRIORITIES[className];
            // Mapeia os valores do Standard Array para os atributos na ordem de prioridade
            priorities.forEach((attr, index) => {
                if (index < STANDARD_ARRAY_VALUES.length) {
                    initial[attr] = STANDARD_ARRAY_VALUES[index];
                } else {
                    initial[attr] = 8; // Fallback
                }
            });

            // Garante que qualquer atributo não listado na prioridade seja 8 (segurança)
            ATTRIBUTE_KEYS.forEach(k => {
                if (!initial[k]) initial[k] = 8;
            });
        } else {
            // Se não tiver classe, inicia tudo com 8
            ATTRIBUTE_KEYS.forEach(k => initial[k] = 8);
        }
        return initial;
    });

    // Reset quando o modal abre ou a classe muda
    useEffect(() => {
        if (isOpen && className) {
            const initial = {} as Record<AttributeKey, number>;
            if (CLASS_ATTRIBUTE_PRIORITIES[className]) {
                const priorities = CLASS_ATTRIBUTE_PRIORITIES[className];
                priorities.forEach((attr, index) => {
                    if (index < STANDARD_ARRAY_VALUES.length) {
                        initial[attr] = STANDARD_ARRAY_VALUES[index];
                    } else {
                        initial[attr] = 8;
                    }
                });
            } else {
                ATTRIBUTE_KEYS.forEach(k => initial[k] = 8);
            }
            // Merge seguro para garantir todas as chaves
            ATTRIBUTE_KEYS.forEach(k => {
                if (!initial[k]) initial[k] = 8;
            });
            setAttributes(initial);
        }
    }, [isOpen, className]);

    const bonuses = race ? (RACE_BONUSES[race] || {}) : {};

    if (!isOpen) return null;

    const calculateUsedPoints = () => {
        return Object.values(attributes).reduce((total, score) => total + (SCORE_COSTS[score] || 0), 0);
    };

    const usedPoints = calculateUsedPoints();
    const remainingPoints = POINT_BUY_TOTAL - usedPoints;

    const handleIncrement = (key: AttributeKey) => {
        const current = attributes[key];
        if (current >= MAX_SCORE) return;

        const nextScore = current + 1;
        // Custo para subir de X para X+1
        const costDiff = (SCORE_COSTS[nextScore] || 0) - (SCORE_COSTS[current] || 0);

        if (remainingPoints >= costDiff) {
            setAttributes(prev => ({ ...prev, [key]: nextScore }));
        }
    };

    const handleDecrement = (key: AttributeKey) => {
        const current = attributes[key];
        if (current <= MIN_SCORE) return;
        setAttributes(prev => ({ ...prev, [key]: current - 1 }));
    };

    const handleConfirm = () => {
        const finalAttributes = {} as Record<AttributeKey, number>;
        ATTRIBUTE_KEYS.forEach(key => {
            finalAttributes[key] = (attributes[key] || 8) + (bonuses[key] || 0);
        });
        onConfirm(finalAttributes);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in font-sans">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rpg-gold to-transparent"></div>

                <div className="p-6 border-b border-rpg-gold/10 bg-rpg-gold/5 flex flex-col items-center">
                    <h3 className="text-3xl font-bold font-cinzel text-rpg-gold uppercase tracking-widest text-center mb-2">Construção de Atributos</h3>

                    {className && (
                        <div className="text-rpg-parchment/60 text-xs mb-2">
                            Sugestão automática para <strong className="text-rpg-gold">{className}</strong> carregada
                        </div>
                    )}

                    <p className="text-rpg-grey text-sm uppercase tracking-wider mb-4">Método: <strong className="text-rpg-parchment">Compra de Pontos (Point Buy)</strong></p>

                    <div className="bg-black/40 px-6 py-3 rounded-full border border-rpg-gold/20 flex items-center gap-4">
                        <span className="text-xs uppercase font-bold text-rpg-gold/70">Pontos Disponíveis</span>
                        <span className={`text-3xl font-black font-medieval ${remainingPoints === 0 ? 'text-green-400' : remainingPoints > 0 ? 'text-rpg-gold' : 'text-red-400'} transition-colors`}>
                            {remainingPoints} <span className="text-lg text-rpg-grey/50">/ {POINT_BUY_TOTAL}</span>
                        </span>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-grow bg-rpg-dark/40 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ATTRIBUTE_KEYS.map(key => {
                            const val = attributes[key];
                            const bonus = bonuses[key] || 0;
                            const total = val + bonus;
                            const cost = SCORE_COSTS[val];
                            // Custo do próximo ponto
                            const nextCostVal = val < MAX_SCORE ? (SCORE_COSTS[val + 1] - cost) : 0;

                            return (
                                <div key={key} className="bg-rpg-panel/80 border border-rpg-gold/10 rounded-xl p-5 flex flex-col shadow-lg group hover:border-rpg-gold/30 transition-all relative overflow-hidden">
                                    {/* Background Decor */}
                                    <div className="absolute -right-4 -top-4 text-9xl text-black/20 font-medieval pointer-events-none select-none">{ATTRIBUTE_DISPLAY_NAMES[key].charAt(0)}</div>

                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <span className="text-sm font-black text-rpg-gold uppercase tracking-wider font-cinzel border-b border-rpg-gold/20 pb-1">{ATTRIBUTE_DISPLAY_NAMES[key]}</span>
                                        <span className="text-[10px] text-rpg-grey uppercase font-bold bg-black/30 px-2 py-1 rounded">Custo Total: {cost}pt</span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mb-4 relative z-10 bg-black/20 p-2 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDecrement(key)}
                                                disabled={val <= MIN_SCORE}
                                                className="w-8 h-8 flex items-center justify-center rounded bg-rpg-slate hover:bg-rpg-red/20 text-rpg-parchment hover:text-red-400 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xl"
                                            >
                                                -
                                            </button>
                                            <div className="flex flex-col items-center w-12">
                                                <span className="text-xs text-rpg-grey uppercase">Base</span>
                                                <span className="text-2xl font-bold font-medieval text-white">{val}</span>
                                            </div>
                                            <button
                                                onClick={() => handleIncrement(key)}
                                                disabled={val >= MAX_SCORE || remainingPoints < nextCostVal}
                                                className="w-8 h-8 flex items-center justify-center rounded bg-rpg-slate hover:bg-rpg-gold/20 text-rpg-parchment hover:text-rpg-gold border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xl"
                                                title={val >= MAX_SCORE ? "Máximo atingido" : `Custa ${nextCostVal} pontos`}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="h-8 w-px bg-white/10"></div>

                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-rpg-grey uppercase">Raça</span>
                                            <span className={`text-xl font-bold font-medieval ${bonus > 0 ? 'text-green-400' : 'text-rpg-grey/50'}`}>
                                                {bonus > 0 ? `+${bonus}` : '+0'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t border-rpg-gold/10 pt-3 flex justify-between items-end relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-rpg-grey uppercase mb-0.5">Modificador</span>
                                            <span className={`text-sm font-bold bg-black/40 px-2 py-0.5 rounded text-center ${Math.floor((total - 10) / 2) >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                                                {Math.floor((total - 10) / 2) >= 0 ? '+' : ''}{Math.floor((total - 10) / 2)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-rpg-gold/70 uppercase mb-0.5 tracking-wider">Total</div>
                                            <div className="text-4xl font-black font-medieval text-rpg-parchment drop-shadow-md leading-none">
                                                {total}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 bg-rpg-gold/5 border-t border-rpg-gold/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-rpg-grey text-xs italic flex items-center gap-2">
                        {remainingPoints === 0
                            ? <span className="text-green-400 font-bold flex items-center gap-1">✅ Pontos distribuídos com perfeição!</span>
                            : <span className="text-yellow-500 font-bold flex items-center gap-1">⚠️ Você ainda tem {remainingPoints} pontos para gastar.</span>
                        }
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-2 border border-rpg-red/30 text-rpg-red hover:bg-rpg-red/10 rounded transition-all uppercase text-xs font-bold tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 sm:flex-none px-10 py-3 rounded font-cinzel font-bold uppercase tracking-[0.2em] transition-all shadow-lg bg-rpg-gold text-rpg-dark hover:scale-105 hover:bg-yellow-400`}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
