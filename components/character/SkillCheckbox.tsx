import React from 'react';

interface SkillCheckboxProps {
    skillKey: string;
    displayName: string;
    attribute: string;
    isProficient: boolean;
    proficiencyBonus: number;
    attributeMod: number;
    onChange: (k: string, v: boolean) => void;
    disabled?: boolean;
}

export const SkillCheckbox: React.FC<SkillCheckboxProps> = ({
    skillKey,
    displayName,
    attribute,
    isProficient,
    proficiencyBonus,
    attributeMod,
    onChange,
    disabled
}) => {
    const total = attributeMod + (isProficient ? proficiencyBonus : 0);
    return (
        <label className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:bg-white/5 cursor-pointer active:scale-[0.98] group'}`}>
            <div className="flex items-center gap-4">
                <input
                    type="checkbox"
                    disabled={disabled}
                    checked={isProficient}
                    onChange={(e) => onChange(skillKey, e.target.checked)}
                    className="w-5 h-5 rounded border-white/10 bg-black/40 text-rpg-gold focus:ring-rpg-gold/20 cursor-pointer"
                />
                <div className="flex flex-col">
                    <span className={`text-lg font-serif transition-colors ${isProficient ? 'text-rpg-gold-light font-black' : 'text-white/70 group-hover:text-white'}`}>
                        {displayName}
                    </span>
                    <span className="text-[10px] text-rpg-grey/40 uppercase tracking-widest font-black italic">{attribute}</span>
                </div>
            </div>
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-lg font-black font-serif border transition-all duration-300 ${isProficient ? 'bg-rpg-gold/10 border-rpg-gold/30 text-rpg-gold shadow-glow-gold/10' : 'bg-black/20 border-white/5 text-rpg-grey/50'}`}>
                {total >= 0 ? `+${total}` : total}
            </div>
        </label>
    );
};

export default SkillCheckbox;
