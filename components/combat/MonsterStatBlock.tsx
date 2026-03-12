import React from 'react';
import { MonsterData } from '@/lib/monsters-data';

interface MonsterStatBlockProps {
    monster: MonsterData;
}

const MonsterStatBlock: React.FC<MonsterStatBlockProps> = ({ monster }) => {
    const getModifier = (score?: number) => {
        if (score === undefined) return '+0';
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    // Normalização de Atributos (Pode vir como strength ou force, etc, ou estar em sub-objetos)
    const stats = {
        for: monster.strength || (monster as any).force || (monster as any).str || 10,
        des: monster.dexterity || (monster as any).dex || 10,
        con: monster.constitution || (monster as any).con || 10,
        int: monster.intelligence || (monster as any).int || 10,
        sab: monster.wisdom || (monster as any).wis || 10,
        car: monster.charisma || (monster as any).cha || 10,
    };

    const attributes = [
        { label: 'FOR', score: stats.for },
        { label: 'DES', score: stats.des },
        { label: 'CON', score: stats.con },
        { label: 'INT', score: stats.int },
        { label: 'SAB', score: stats.sab },
        { label: 'CAR', score: stats.car },
    ];

    // Normalização de Ações e Traits
    const allActions = monster.actions || (monster as any).action || [];
    const traits = monster.actions?.filter(a => a.type === 'trait') || (monster as any).traits || (monster as any).special_abilities || [];
    const actions = monster.actions?.filter(a => !a.type || a.type === 'action') || (monster as any).actions || [];

    // Formatação de CR e XP
    const getCR = () => {
        const rawCr = monster.challenge || (monster as any).cr || (monster as any).challenge_rating || (monster as any).challengeRating;
        if (!rawCr) return '—';
        if (typeof rawCr === 'object') return rawCr.cr || rawCr.rating || '—';
        return String(rawCr);
    };

    const getXP = () => {
        const xpValue = monster.xp || (monster as any).experience;
        return xpValue ? String(xpValue) : '';
    };

    return (
        <div className="bg-[#fdf1dc] text-[#7a2008] p-6 font-serif shadow-xl border-t-8 border-b-8 border-[#e69a28] max-w-2xl mx-auto overflow-y-auto max-h-[80vh]">
            {/* Header */}
            <div className="border-b-2 border-[#7a2008] mb-2 pb-1">
                <h2 className="text-3xl font-bold font-cinzel italic tracking-tight">{monster.name}</h2>
                <p className="text-sm italic uppercase text-[#922610]">
                    {typeof monster.type === 'object' ? (monster.type as any).type : (monster.type || 'Monstro')}
                </p>
            </div>

            {/* Basic Stats */}
            <div className="space-y-1 text-[#7a2008] font-bold py-2 border-b border-[#7a2008]/20">
                <p><span className="text-[#922610]">Classe de Armadura:</span> {monster.ac || (monster as any).armor_class || 10}</p>
                <p><span className="text-[#922610]">Pontos de Vida:</span> {monster.hp || (monster as any).hit_points || 10}</p>
                <p><span className="text-[#922610]">Deslocamento:</span> {monster.speed || (monster as any).speed?.walk || '9m'}</p>
            </div>

            {/* Attributes Table */}
            <div className="border-t border-b border-[#7a2008] my-4 py-2 flex justify-between px-2">
                {attributes.map(attr => (
                    <div key={attr.label} className="text-center">
                        <div className="font-bold text-[#922610] text-xs">{attr.label}</div>
                        <div className="text-sm">{attr.score} ({getModifier(attr.score)})</div>
                    </div>
                ))}
            </div>

            {/* Other Stats */}
            <div className="space-y-1 text-sm py-2">
                {(monster.senses || (monster as any).senses_string) && <p><span className="font-bold text-[#922610]">Sentidos:</span> {monster.senses || (monster as any).senses_string}</p>}
                {(monster.languages || (monster as any).languages_string) && <p><span className="font-bold text-[#922610]">Idiomas:</span> {monster.languages || (monster as any).languages_string}</p>}
                <p>
                    <span className="font-bold text-[#922610]">Nível de Desafio:</span> {getCR()} 
                    {getXP() ? ` (${getXP()} XP)` : ''}
                </p>
            </div>

            {/* Special Abilities / Traits */}
            {traits.length > 0 && (
                <div className="mt-2">
                    {traits.map((trait: any, idx: number) => (
                        <div key={idx} className="my-2 text-sm italic">
                            <span className="font-bold not-italic">{trait.name}.</span> {trait.description || trait.desc || ''}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 border-t-2 border-[#7a2008] pt-2">
                <h3 className="text-xl font-bold mb-2 text-[#7a2008] font-cinzel uppercase">Ações</h3>
                {actions.length > 0 ? (
                    actions.map((action: any, idx: number) => (
                        <div key={idx} className="my-3 text-sm">
                            <span className="font-bold italic">{action.name}.</span> {action.description || action.desc || ''}
                        </div>
                    ))
                ) : (
                    <p className="text-xs italic opacity-70">Nenhuma ação específica listada.</p>
                )}
            </div>
        </div>
    );
};

export default MonsterStatBlock;
