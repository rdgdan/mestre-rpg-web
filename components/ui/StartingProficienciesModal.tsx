import React, { useState } from 'react';
import { CLASS_PROFICIENCIES } from '@/lib/class-proficiencies';
import { ATTRIBUTE_DISPLAY_NAMES } from '@/lib/character-data';

interface StartingProficienciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    className: string;
    onConfirm: (selectedSkills: string[]) => void;
}

// Mapa para nomes mais bonitos (opcional, se não tiver em utils)
const SKILL_NAMES: Record<string, string> = {
    "acrobacia": "Acrobacia",
    "adestrar_animais": "Adestrar Animais",
    "arcanismo": "Arcanismo",
    "atletismo": "Atletismo",
    "atuacao": "Atuação",
    "enganacao": "Enganação",
    "furtividade": "Furtividade",
    "historia": "História",
    "intimidacao": "Intimidação",
    "intuicao": "Intuição",
    "investigacao": "Investigação",
    "medicina": "Medicina",
    "natureza": "Natureza",
    "percepcao": "Percepção",
    "persuasao": "Persuasão",
    "prestidigitacao": "Prestidigitação",
    "religiao": "Religião",
    "sobrevivencia": "Sobrevivência"
};

export const StartingProficienciesModal: React.FC<StartingProficienciesModalProps> = ({ isOpen, onClose, className, onConfirm }) => {
    const [selected, setSelected] = useState<string[]>([]);

    const profData = className ? CLASS_PROFICIENCIES[className] : null;
    const { choose, from } = profData?.skills || { choose: 0, from: [] };
    const savingThrows = profData?.savingThrows || [];
    const remaining = choose - selected.length;

    // Auto-selecionar se o número de opções for igual ao número de escolhas
    React.useEffect(() => {
        if (from && from.length > 0 && from.length <= choose && selected.length === 0) {
            setSelected(from);
        }
    }, [from, choose, selected.length]);

    if (!isOpen || !profData) return null;

    const toggleSkill = (skill: string) => {
        if (selected.includes(skill)) {
            setSelected(selected.filter(s => s !== skill));
        } else {
            if (selected.length < choose) {
                setSelected([...selected, skill]);
            }
        }
    };

    const handleConfirm = () => {
        if (selected.length === choose) {
            onConfirm(selected);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="modal-theme-c border-2 rounded-lg max-w-lg w-full shadow-[0_0_50px_-10px_rgba(255,120,72,0.3)]">
                <div className="p-6 border-b border-rpg-gold/20 bg-black/20">
                    <h3 className="text-xl font-bold font-cinzel text-rpg-gold uppercase tracking-widest text-center">
                        Proficiências: {className}
                    </h3>
                    <p className="text-xs text-rpg-grey text-center mt-2 font-medieval">
                        Sua classe define suas aptidões iniciais.
                    </p>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Salvaguardas Automáticas */}
                    {savingThrows.length > 0 && (
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg">
                            <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                🛡️ Salvaguardas Recebidas
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {savingThrows.map(save => (
                                    <span key={save} className="px-3 py-1 bg-blue-600/20 text-blue-200 border border-blue-500/30 rounded text-xs font-bold uppercase">
                                        {ATTRIBUTE_DISPLAY_NAMES[save] || save}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-white/5 pt-4">
                        <h4 className="text-[10px] font-black text-rpg-gold uppercase tracking-widest mb-3 flex justify-between items-center">
                            <span>Perícias para Escolher</span>
                            <span className="text-rpg-parchment bg-rpg-gold/20 px-2 py-0.5 rounded">Faltam {remaining}</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {from.map(skill => {
                                const isSelected = selected.includes(skill);
                                const isDisabled = !isSelected && remaining === 0;

                                return (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        disabled={isDisabled}
                                        className={`flex items-center justify-between p-3 rounded border transition-all ${isSelected
                                            ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold shadow-glow-gold/10'
                                            : isDisabled
                                                ? 'bg-black/20 border-white/5 text-rpg-grey/30 cursor-not-allowed'
                                                : 'bg-black/20 border-white/10 text-rpg-grey hover:border-rpg-gold/50 hover:text-rpg-parchment'
                                            }`}
                                    >
                                        <span className="font-bold text-sm uppercase tracking-wide">{SKILL_NAMES[skill] || skill}</span>
                                        {isSelected && <span className="text-xs font-black">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-rpg-gold/20 bg-black/20 flex justify-between items-center">
                    <div className="text-xs text-rpg-grey">
                        {remaining > 0 ? (
                            <span>Escolha mais <span className="text-rpg-gold font-bold">{remaining}</span>...</span>
                        ) : (
                            <span className="text-green-400 font-bold">Pronto para confirmar!</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded text-rpg-red hover:bg-rpg-red/10 transition-colors uppercase text-xs font-bold tracking-wider"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={remaining > 0}
                            className={`px-6 py-2 rounded bg-rpg-gold text-rpg-dark font-bold uppercase text-xs tracking-wider transition-all ${remaining > 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-yellow-400 shadow-glow-gold/20'
                                }`}
                        >
                            Confirmar Escolhas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
