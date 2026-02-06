import React from 'react';
import { Character } from '@/lib/character-data';

interface QuickActionsProps {
    character: Character;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ character }) => {
    const isBarbarian = character.class?.toLowerCase().includes('bárbaro') || character.class?.toLowerCase().includes('barbarian');
    const isSpellcaster = character.spellcasting?.ability !== '';
    const hasWeapons = character.inventory?.weapons?.length > 0;

    const actions = [
        hasWeapons && 'Ataque',
        isSpellcaster && 'Lançar Magia',
        'Desvencilhar',
        'Disparar',
        'Ajudar',
    ].filter(Boolean);

    const bonusActions = [
        isBarbarian && 'Entrar em Fúria',
        isSpellcaster && 'Magia (Bônus)',
        'Usar Poção',
    ].filter(Boolean);

    const reactions = [
        'Ataque de Oportunidade',
        isSpellcaster && 'Contrafeitiço/Escudo',
    ].filter(Boolean);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 sm:p-4 rounded-lg flex flex-col items-center">
                <span className="text-xs sm:text-sm text-rpg-gold font-bold uppercase mb-2 tracking-wider">Ações Principais</span>
                <div className="flex flex-wrap justify-center gap-2">
                    {actions.map(a => <span key={a as string} className="text-xs sm:text-sm bg-black/40 px-2.5 py-1.5 rounded text-rpg-grey border border-white/5 font-medium">{a}</span>)}
                </div>
            </div>
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 sm:p-4 rounded-lg flex flex-col items-center text-blue-400">
                <span className="text-xs sm:text-sm font-bold uppercase mb-2 tracking-wider">Ações Bônus</span>
                <div className="flex flex-wrap justify-center gap-2">
                    {bonusActions.map(a => <span key={a as string} className="text-xs sm:text-sm bg-blue-900/30 px-2.5 py-1.5 rounded border border-blue-500/30 font-bold">{a}</span>)}
                </div>
            </div>
            <div className="bg-rpg-panel border border-rpg-gold/20 p-3 sm:p-4 rounded-lg flex flex-col items-center text-red-400 col-span-2 md:col-span-1">
                <span className="text-xs sm:text-sm font-bold uppercase mb-2 tracking-wider">Reações</span>
                <div className="flex flex-wrap justify-center gap-2">
                    {reactions.map(a => <span key={a as string} className="text-xs sm:text-sm bg-red-900/30 px-2.5 py-1.5 rounded border border-red-500/30 font-bold">{a}</span>)}
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
