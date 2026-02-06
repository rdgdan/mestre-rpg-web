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
        <label className={`flex items-center justify-between p-3.5 sm:p-3 rounded-md transition-all ${disabled ? 'opacity-70' : 'hover:bg-white/5 cursor-pointer active:scale-[0.98]'}`}>
            <div className="flex items-center gap-4 sm:gap-4">
                <input
                    type="checkbox"
                    disabled={disabled}
                    checked={isProficient}
                    onChange={(e) => onChange(skillKey, e.target.checked)}
                    className="w-6 h-6 sm:w-6 sm:h-6 rounded border-rpg-gold/30 bg-rpg-dark text-rpg-gold focus:ring-rpg-gold/50 cursor-pointer"
                />
                <span className={`text-lg sm:text-lg font-medieval ${isProficient ? 'text-rpg-gold font-bold underline decoration-rpg-gold/20' : 'text-rpg-parchment'}`}>
                    {displayName} <span className="text-xs text-rpg-grey uppercase ml-1.5 opacity-60 italic">({attribute.slice(0, 3)})</span>
                </span>
            </div>
            <div className={`px-3 py-1.5 rounded text-base sm:text-base font-bold font-medieval border shadow-inner ${isProficient ? 'bg-rpg-gold/10 border-rpg-gold/30 text-rpg-gold' : 'bg-black/20 border-white/5 text-rpg-grey'}`}>
                {total >= 0 ? `+${total}` : total}
            </div>
        </label>
    );
};

export default SkillCheckbox;
