import React from 'react';

interface StatBlockProps {
    label: string;
    value: any;
    subLabel?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({ label, value, subLabel }) => (
    <div className="p-4 sm:p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-lg text-center flex flex-col justify-center items-center backdrop-blur-md group hover:border-rpg-gold/30 transition-all min-h-[110px] sm:min-h-[120px] relative overflow-hidden text-balance">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-rpg-gold/20 to-transparent"></div>
        <h4 className="text-[9px] sm:text-[11px] font-bold text-rpg-gold uppercase mb-2 sm:mb-3 tracking-[0.15em] sm:tracking-[0.2em] font-cinzel leading-tight h-5 flex items-center justify-center text-center">{label}</h4>
        <div className="text-3xl sm:text-4xl font-bold text-rpg-parchment font-medieval drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1">
            {value}
        </div>
        {subLabel && <span className="text-[8px] sm:text-[9px] text-rpg-grey uppercase tracking-[0.1em] font-sans opacity-60 font-bold">{subLabel}</span>}
        <div className="w-10 sm:w-12 h-[1px] bg-rpg-gold/20 mt-4 group-hover:w-20 transition-all"></div>
    </div>
);

export default StatBlock;
