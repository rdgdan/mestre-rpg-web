import React, { useState } from 'react';
import { CLASS_STARTING_EQUIPMENT, EquipmentOption } from '@/lib/starting-equipment';

interface StartingEquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    className: string;
    onConfirm: (selectedItems: any[]) => void;
}

export const StartingEquipmentModal: React.FC<StartingEquipmentModalProps> = ({ isOpen, onClose, className, onConfirm }) => {
    const [selections, setSelections] = useState<Record<number, number>>({}); // Index da Opção -> Index da Escolha dentro da opção

    if (!isOpen) return null;

    const equipmentData = CLASS_STARTING_EQUIPMENT[className];

    // Se a classe não tiver equipamento definido ou não for encontrada, fecha ou mostra erro.
    // Por enquanto, apenas não renderiza.
    if (!equipmentData) {
        return null;
    }

    const { options, defaultItems } = equipmentData;

    const handleSelect = (optionIndex: number, choiceIndex: number) => {
        setSelections(prev => ({ ...prev, [optionIndex]: choiceIndex }));
    };

    const isAllSelected = options.every((_, idx) => selections[idx] !== undefined);

    const handleConfirm = () => {
        if (!isAllSelected) return;

        const selectedChoices = options.map((optionGroup, idx) => {
            const choiceIdx = selections[idx];
            // optionGroup é EquipmentOption[] (ex: [ {label: "A"}, {label: "B"} ])
            // choiceIdx é qual opção foi escolhida (0 ou 1)
            const selectedOption = optionGroup[choiceIdx];
            return selectedOption.choices;
        }).flat();

        // Expandir "pacotes" (arrays de escolhas que na verdade são itens individuais neste modelo simplificado)
        // No modelo atual, opt.choices[i] é UM objeto item. Se quiséssemos dar um 'pacote' como a opção "Arco + 20 flechas", 
        // precisaríamos que a structure suportasse isso.
        // O starting-equipment.ts definido anteriormente tem structure: choices: Array<{ name, qty, type }>
        // Então cada escolha é UM item.
        // Espere! No arquivo starting-equipment.ts, para "Arco e Flechas", eu fiz:
        // { label: "Arco...", choices: [{ name: "Arco", ... }, { name: "Flechas", ... }] } <-- NÃO!
        // No ARQUIVO ANTERIOR a estrutura choices é Array<{ name... }>.
        // Então choices[0] é o item 1.
        // Ah, eu defini choices como Array<Item>.
        // Mas a UI precisa escolher ENTRE opçoes.
        // A structure é: options: EquipmentOption[][]
        // EquipmentOption { label, choices: Item[] } NO.
        // Vamos checar a definição em starting-equipment.ts:
        /*
        export interface EquipmentOption {
            label: string;
            choices: Array<{ ... }>;
        }
        */
        // Isso significa que uma 'EquipmentOption' representa "A" ou "B".
        // Onde "A" é o label, e choices são os ITENS que você ganha se escolher "A".
        // REVISÃO:
        // Em "Guerreiro":
        // options: [
        //    [
        //       { label: "Cota de Malha", choices: [{ name: "Cota", ... }] },
        //       { label: "Couro + Arco", choices: [{ name: "Couro", ... }, { name: "Arco", ... }] }
        //    ]
        // ]
        // ENTÃO: options é EquipmentOption[][]. O primeiro nível é cada "linha" de escolha (escolha 1, escolha 2...).
        // O segundo nível (EquipmentOption[]) são as OPÇÕES DENTRO daquela escolha (Opção A vs Opção B).
        // E dentro de EquipmentOption, 'choices' são os itens que compõem aquela opção.

        // LOGO:
        // O usuário vê options.map((choiceGroup, groupIdx))
        // Dentro de cada group, ele vê choiceGroup.map((option, optionIdx))
        // Ele seleciona UMA option por group.

        const finalItems: any[] = [];

        // Adicionar itens padrão
        finalItems.push(...defaultItems);

        // Adicionar itens escolhidos
        Object.entries(selections).forEach(([groupIdxStr, optionIdx]) => {
            const groupIdx = parseInt(groupIdxStr);
            const selectedOption = options[groupIdx][optionIdx];
            finalItems.push(...selectedOption.choices);
        });

        onConfirm(finalItems);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full shadow-[0_0_50px_-10px_rgba(234,179,8,0.3)] max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-rpg-gold/20 bg-black/20">
                    <h3 className="text-xl font-bold font-cinzel text-rpg-gold uppercase tracking-widest text-center">
                        Equipamento Inicial: {className}
                    </h3>
                    <p className="text-xs text-rpg-grey text-center mt-2 font-medieval">
                        Selecione seu equipamento para começar sua jornada.
                    </p>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-grow">

                    {/* Itens Padrão */}
                    {defaultItems.length > 0 && (
                        <div className="bg-black/20 p-4 rounded border border-white/5">
                            <h4 className="text-rpg-parchment font-bold text-sm uppercase mb-3 border-b border-white/10 pb-1">Itens Incluídos</h4>
                            <ul className="space-y-1">
                                {defaultItems.map((item, idx) => (
                                    <li key={idx} className="text-rpg-grey text-sm flex items-center gap-2">
                                        <span className="text-rpg-gold">•</span>
                                        {item.quantity}x {item.name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Escolhas */}
                    {options.map((choiceGroup, groupIdx) => (
                        <div key={groupIdx} className="space-y-2">
                            <h4 className="text-rpg-gold/80 font-bold text-xs uppercase tracking-wider">Escolha {groupIdx + 1}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {choiceGroup.map((option, optIdx) => {
                                    const isSelected = selections[groupIdx] === optIdx;
                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => handleSelect(groupIdx, optIdx)}
                                            className={`p-3 rounded border text-left transition-all ${isSelected
                                                ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold shadow-glow-gold/10'
                                                : 'bg-black/20 border-white/10 text-rpg-grey hover:border-rpg-gold/30 hover:text-rpg-parchment'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm">{option.label}</span>
                                                {isSelected && <span className="text-xs font-black">✓</span>}
                                            </div>
                                            {/* Listar sub-itens se houver mais de um ou se o nome for diferente da label */}
                                            {option.choices.length > 0 && (
                                                <div className="mt-1 text-[10px] opacity-70">
                                                    Contém: {option.choices.map(c => `${c.quantity}x ${c.name}`).join(', ')}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-rpg-gold/20 bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-rpg-red hover:bg-rpg-red/10 transition-colors uppercase text-xs font-bold tracking-wider"
                    >
                        Pular Equipamento
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isAllSelected}
                        className={`px-6 py-2 rounded bg-rpg-gold text-rpg-dark font-bold uppercase text-xs tracking-wider transition-all ${!isAllSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-yellow-400 shadow-glow-gold/20'
                            }`}
                    >
                        Confirmar Equipamento
                    </button>
                </div>
            </div>
        </div>
    );
};
