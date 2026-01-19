"use client";

import React, { useState } from 'react';
import { Character } from '@/lib/character-data';
import { SUBCLASSES } from '@/lib/class-features';

export interface SubclassModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: Character;
    onSelect: (subclassName: string) => void;
}

export default function SubclassModal({ isOpen, onClose, character, onSelect }: SubclassModalProps) {
    if (!isOpen) return null;

    const subclassData = SUBCLASSES[character.class] || {};
    const availableSubclasses = Object.keys(subclassData);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-rpg-panel border border-rpg-gold w-full max-w-2xl rounded-xl shadow-[0_0_30px_rgba(218,165,32,0.2)] flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-rpg-gold/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-cinzel text-rpg-gold">Escolha seu Caminho</h2>
                        <p className="text-sm text-rpg-grey font-medieval">Selecione uma subclasse para {character.class}</p>
                    </div>
                    <button onClick={onClose} className="text-rpg-grey hover:text-red-400 text-2xl font-bold">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {availableSubclasses.length === 0 ? (
                        <p className="text-rpg-grey text-center py-10">
                            Nenhuma subclasse oficial encontrada para {character.class} neste sistema.
                            <br/>
                            <span className="text-xs opacity-60">(Você pode adicionar manualmente na biblioteca)</span>
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableSubclasses.map((sub, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelect(sub)}
                                    className="bg-black/30 border border-rpg-gold/20 p-4 rounded-lg hover:bg-rpg-gold/10 hover:border-rpg-gold hover:scale-[1.02] transition-all text-left group"
                                >
                                    <h3 className="font-bold text-rpg-parchment group-hover:text-rpg-gold font-cinzel">{sub}</h3>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
