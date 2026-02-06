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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Traços de Personalidade</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.personalityTraits}
                        onChange={e => handleFieldChange('personalityTraits', e.target.value)}
                        className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Peculiaridades e maneirismos..."
                    />
                </div>
                <div className="group">
                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Ideais</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.ideals}
                        onChange={e => handleFieldChange('ideals', e.target.value)}
                        className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="No que você acredita?"
                    />
                </div>
                <div className="group">
                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Vínculos</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.bonds}
                        onChange={e => handleFieldChange('bonds', e.target.value)}
                        className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="O que te move?"
                    />
                </div>
            </div>
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Defeitos</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.flaws}
                        onChange={e => handleFieldChange('flaws', e.target.value)}
                        className={`w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Suas fraquezas..."
                    />
                </div>
                <div className="group flex-grow">
                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Anotações & História</label>
                    <textarea
                        disabled={isReadOnly}
                        value={character.notes}
                        onChange={e => handleFieldChange('notes', e.target.value)}
                        className={`w-full h-[400px] bg-rpg-panel/40 border border-rpg-gold/10 rounded-lg p-5 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner custom-scrollbar ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder="Escreva a lenda do seu herói aqui..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalityTab;
