import React from 'react';

interface StatBlockProps {
    label: string;
    value: any;
    subLabel?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({ label, value, subLabel }) => (
    <div className="p-5 card-glass border-none text-center flex flex-col justify-center items-center group transition-all duration-300 min-h-[120px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rpg-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <h4 className="text-[10px] font-black text-rpg-gold/60 uppercase mb-3 tracking-[0.2em] font-serif leading-tight">{label}</h4>
        <div className="text-4xl font-black text-white font-serif drop-shadow-sm group-hover:text-rpg-gold-light transition-colors">
            {value}
        </div>
        {subLabel && <span className="text-[9px] text-rpg-grey/40 uppercase tracking-widest font-bold mt-1">{subLabel}</span>}
    </div>
);

export default StatBlock;
