import React from 'react';
import { MonsterData } from '@/lib/monsters-data';

interface MonsterStatBlockProps {
    monster: MonsterData;
}

const MonsterStatBlock: React.FC<MonsterStatBlockProps> = ({ monster }) => {
    const getModifier = (score?: number) => {
        if (score === undefined) return '';
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const attributes = [
        { label: 'FOR', score: monster.strength },
        { label: 'DES', score: monster.dexterity },
        { label: 'CON', score: monster.constitution },
        { label: 'INT', score: monster.intelligence },
        { label: 'SAB', score: monster.wisdom },
        { label: 'CAR', score: monster.charisma },
    ];

    return (
        <div className="bg-[#fdf1dc] text-[#7a2008] p-6 font-serif shadow-xl border-t-8 border-b-8 border-[#e69a28] max-w-2xl mx-auto">
            {/* Header */}
            <div className="border-b-2 border-[#7a2008] mb-2 pb-1">
                <h2 className="text-3xl font-bold font-cinzel italic tracking-tight">{monster.name}</h2>
                <p className="text-sm italic">{monster.type}</p>
            </div>

            {/* Basic Stats */}
            <div className="space-y-1 text-[#7a2008] font-bold py-2">
                <p><span className="text-[#922610]">Classe de Armadura:</span> {monster.ac}</p>
                <p><span className="text-[#922610]">Pontos de Vida:</span> {monster.hp}</p>
                <p><span className="text-[#922610]">Deslocamento:</span> {monster.speed || '9m'}</p>
            </div>

            {/* Attributes Table */}
            <div className="border-t border-b border-[#7a2008] my-4 py-2 flex justify-between px-2">
                {attributes.map(attr => (
                    <div key={attr.label} className="text-center">
                        <div className="font-bold text-[#922610]">{attr.label}</div>
                        <div>{attr.score ?? 10} ({getModifier(attr.score ?? 10)})</div>
                    </div>
                ))}
            </div>

            {/* Other Stats */}
            <div className="space-y-1 text-sm py-2">
                {monster.senses && <p><span className="font-bold text-[#922610]">Sentidos:</span> {monster.senses}</p>}
                {monster.languages && <p><span className="font-bold text-[#922610]">Idiomas:</span> {monster.languages}</p>}
                <p><span className="font-bold text-[#922610]">Nível de Desafio:</span> {monster.challenge} ({monster.xp} XP)</p>
            </div>

            {/* Traits */}
            {monster.actions?.filter(a => a.type === 'trait').map((trait, idx) => (
                <div key={idx} className="my-3 text-sm italic">
                    <span className="font-bold not-italic">{trait.name}.</span> {trait.description}
                </div>
            ))}

            {/* Actions */}
            <div className="mt-4">
                <h3 className="text-xl font-bold border-b border-[#7a2008] mb-2 text-[#7a2008] font-cinzel uppercase">Ações</h3>
                {monster.actions?.filter(a => !a.type || a.type === 'action').map((action, idx) => (
                    <div key={idx} className="my-3 text-sm">
                        <span className="font-bold italic">{action.name}.</span> {action.description}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonsterStatBlock;
