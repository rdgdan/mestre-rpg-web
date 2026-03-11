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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="card-glass border-none p-6 shadow-xl flex flex-col items-center group/action">
                <span className="text-[10px] text-rpg-gold font-black uppercase mb-5 tracking-[0.3em] group-hover/action:text-rpg-gold-light transition-colors">Ações Principais</span>
                <div className="flex flex-wrap justify-center gap-2.5">
                    {actions.map(a => <span key={a as string} className="text-xs bg-black/40 px-4 py-2 rounded-lg text-white font-black uppercase tracking-widest border border-white/5 shadow-lg group-hover/action:bg-white/5 transition-all">{a}</span>)}
                </div>
            </div>
            <div className="card-glass border-none p-6 shadow-xl flex flex-col items-center group/bonus">
                <span className="text-[10px] text-blue-400 font-black uppercase mb-5 tracking-[0.3em] group-hover/bonus:text-blue-300 transition-colors">Ações Bônus</span>
                <div className="flex flex-wrap justify-center gap-2.5">
                    {bonusActions.map(a => <span key={a as string} className="text-xs bg-blue-500/10 px-4 py-2 rounded-lg text-blue-200 font-black uppercase tracking-widest border border-blue-500/20 shadow-lg group-hover/bonus:bg-blue-500/20 transition-all">{a}</span>)}
                </div>
            </div>
            <div className="card-glass border-none p-6 shadow-xl flex flex-col items-center group/reaction">
                <span className="text-[10px] text-red-400 font-black uppercase mb-5 tracking-[0.3em] group-hover/reaction:text-red-300 transition-colors">Reações</span>
                <div className="flex flex-wrap justify-center gap-2.5">
                    {reactions.map(a => <span key={a as string} className="text-xs bg-red-500/10 px-4 py-2 rounded-lg text-red-200 font-black uppercase tracking-widest border border-red-500/20 shadow-lg group-hover/reaction:bg-red-500/20 transition-all">{a}</span>)}
                </div>
            </div>
        </div>
    );
};

export default QuickActions;
