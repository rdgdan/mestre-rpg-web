import React from 'react';
import { Character } from '@/lib/character-data';

interface PersonalityTabProps {
    character: Character;
    isReadOnly: boolean;
    handleFieldChange: (field: string, value: any) => void;
}

export const PersonalityTab: React.FC<PersonalityTabProps> = ({
    character,
    isReadOnly,
    handleFieldChange
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in group/personality">
            <div className="space-y-6">
                <div className="card-glass border-none p-6 shadow-xl space-y-4 group/item">
                    <label className="block text-rpg-gold font-black font-cinzel uppercase text-[10px] tracking-[0.3em] group-hover/item:text-rpg-gold-light transition-colors">Traços de Personalidade</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.personalityTraits}
                        onChange={e => handleFieldChange('personalityTraits', e.target.value)}
                        className={`w-full h-32 bg-black/20 border border-white/5 rounded-xl p-4 text-white font-serif leading-relaxed resize-none transition-all focus:border-rpg-gold/30 outline-none placeholder:text-rpg-grey/20 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
                        placeholder="Peculiaridades e maneirismos..."
                    />
                </div>
                <div className="card-glass border-none p-6 shadow-xl space-y-4 group/item">
                    <label className="block text-rpg-gold font-black font-cinzel uppercase text-[10px] tracking-[0.3em] group-hover/item:text-rpg-gold-light transition-colors">Ideais</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.ideals}
                        onChange={e => handleFieldChange('ideals', e.target.value)}
                        className={`w-full h-32 bg-black/20 border border-white/5 rounded-xl p-4 text-white font-serif leading-relaxed resize-none transition-all focus:border-rpg-gold/30 outline-none placeholder:text-rpg-grey/20 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
                        placeholder="No que você acredita?"
                    />
                </div>
                <div className="card-glass border-none p-6 shadow-xl space-y-4 group/item">
                    <label className="block text-rpg-gold font-black font-cinzel uppercase text-[10px] tracking-[0.3em] group-hover/item:text-rpg-gold-light transition-colors">Vínculos</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.bonds}
                        onChange={e => handleFieldChange('bonds', e.target.value)}
                        className={`w-full h-32 bg-black/20 border border-white/5 rounded-xl p-4 text-white font-serif leading-relaxed resize-none transition-all focus:border-rpg-gold/30 outline-none placeholder:text-rpg-grey/20 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
                        placeholder="O que te move?"
                    />
                </div>
            </div>
            <div className="space-y-6 flex flex-col">
                <div className="card-glass border-none p-6 shadow-xl space-y-4 group/item">
                    <label className="block text-rpg-gold font-black font-cinzel uppercase text-[10px] tracking-[0.3em] group-hover/item:text-rpg-gold-light transition-colors">Defeitos</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.flaws}
                        onChange={e => handleFieldChange('flaws', e.target.value)}
                        className={`w-full h-32 bg-black/20 border border-white/5 rounded-xl p-4 text-white font-serif leading-relaxed resize-none transition-all focus:border-rpg-gold/30 outline-none placeholder:text-rpg-grey/20 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
                        placeholder="Suas fraquezas..."
                    />
                </div>
                <div className="card-glass border-none p-6 shadow-xl space-y-4 group/item flex-grow flex flex-col">
                    <label className="block text-rpg-gold font-black font-cinzel uppercase text-[10px] tracking-[0.3em] group-hover/item:text-rpg-gold-light transition-colors">Anotações & História</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.notes}
                        onChange={e => handleFieldChange('notes', e.target.value)}
                        className={`w-full flex-grow bg-black/20 border border-white/5 rounded-xl p-6 text-white font-serif leading-relaxed resize-none transition-all focus:border-rpg-gold/30 outline-none placeholder:text-rpg-grey/20 custom-scrollbar ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/30'}`}
                        placeholder="Escreva a lenda do seu herói aqui..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalityTab;
