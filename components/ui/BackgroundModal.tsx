"use client";

import { Background, BACKGROUNDS } from '@/lib/backgrounds-data';
import { SKILLS } from '@/lib/character-data';
import { useState } from 'react';

interface BackgroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (background: Background) => void;
    currentBackground?: string;
}

export default function BackgroundModal({
    isOpen,
    onClose,
    onConfirm,
    currentBackground
}: BackgroundModalProps) {
    const [selectedBackground, setSelectedBackground] = useState<Background | null>(
        BACKGROUNDS.find(b => b.name === currentBackground) || null
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden modal-theme-c border-2 rounded-2xl shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-rpg-gold/20 flex justify-between items-center bg-rpg-panel">
                    <h2 className="text-3xl font-bold text-rpg-gold font-cinzel">Selecione seu Antecedente</h2>
                    <button
                        onClick={onClose}
                        className="text-rpg-grey hover:text-rpg-red transition-colors text-3xl"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-rpg-dark">
                    {/* List */}
                    <div className="w-full md:w-1/3 border-r border-rpg-gold/10 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-2">
                            {BACKGROUNDS.map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => setSelectedBackground(bg)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center group ${selectedBackground?.id === bg.id
                                            ? 'bg-rpg-gold/20 border-rpg-gold shadow-glow-gold/10'
                                            : 'bg-rpg-panel border-white/5 hover:border-rpg-gold/30'
                                        }`}
                                >
                                    <span className={`font-medieval text-xl ${selectedBackground?.id === bg.id ? 'text-rpg-gold' : 'text-rpg-parchment group-hover:text-rpg-gold'
                                        }`}>{bg.name}</span>
                                    {selectedBackground?.id === bg.id && <span className="text-rpg-gold">✨</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-rpg-panel/40">
                        {selectedBackground ? (
                            <div className="animate-fade-in space-y-8">
                                <div>
                                    <h3 className="text-5xl font-black font-cinzel text-rpg-gold mb-4">{selectedBackground.name}</h3>
                                    <p className="text-rpg-parchment/70 italic font-medieval text-xl leading-relaxed">
                                        {selectedBackground.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                    {/* Perícias */}
                                    <div>
                                        <h4 className="text-xs font-black text-rpg-gold uppercase tracking-[0.3em] mb-4">Perícias Adquiridas</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedBackground.skills.map(skinKey => {
                                                const skill = SKILLS.find(s => s.key === skinKey);
                                                return (
                                                    <span key={skinKey} className="px-3 py-1 bg-rpg-gold/10 border border-rpg-gold/30 rounded-full text-rpg-gold font-bold text-sm">
                                                        {skill?.displayName || skinKey}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Dinheiro */}
                                    <div>
                                        <h4 className="text-xs font-black text-rpg-gold uppercase tracking-[0.3em] mb-4">Ouro Inicial</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-yellow-500 font-medieval">{selectedBackground.gold}</span>
                                            <span className="text-rpg-parchment/40 font-bold uppercase text-xs">Peças de Ouro (PO)</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black text-rpg-gold uppercase tracking-[0.3em] mb-4">Equipamento Sugerido</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {selectedBackground.equipment.map((item, i) => (
                                            <div key={i} className="bg-black/20 p-3 rounded-lg border border-white/5 flex items-center gap-2">
                                                <span className="text-rpg-gold opacity-50">✦</span>
                                                <span className="text-rpg-parchment/80 font-medieval">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-rpg-gold/20 border-2 border-dashed border-rpg-gold/10 rounded-xl p-12">
                                <span className="text-9xl mb-6 opacity-10">📜</span>
                                <p className="font-cinzel text-2xl tracking-widest text-center">Selecione um antecedente para forjar sua lenda</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-rpg-panel border-t border-rpg-gold/20 flex justify-end">
                    <button
                        disabled={!selectedBackground}
                        onClick={() => selectedBackground && onConfirm(selectedBackground)}
                        className={`px-12 py-4 rounded font-black uppercase tracking-[0.2em] transition-all shadow-glow-gold ${!selectedBackground ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-rpg-gold text-rpg-dark hover:bg-yellow-400 hover:scale-105'
                            }`}
                    >
                        Assumir Histórico
                    </button>
                </div>
            </div>
        </div>
    );
}
