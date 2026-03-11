import React from 'react';

interface AttributeInputProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    disabled?: boolean;
    breakdown?: Record<string, number>;
    activeTooltip: string | null;
    setActiveTooltip: (label: string | null) => void;
}

export const AttributeInput: React.FC<AttributeInputProps> = ({
    label,
    value,
    onChange,
    disabled,
    breakdown,
    activeTooltip,
    setActiveTooltip
}) => {
    const modifier = Math.floor((value - 10) / 2);
    const isOpen = activeTooltip === label;

    return (
        <div className="flex flex-col items-center p-5 card-glass border-none min-w-[110px] transition-all duration-300 hover:bg-white/5 group relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5"></div>
            <span className="text-[11px] sm:text-xs font-black text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className={`w-16 text-3xl font-black text-center bg-transparent focus:outline-none font-serif ${disabled ? 'text-rpg-grey/50' : 'text-white'}`}
            />
            {disabled && (
                <div className="absolute -top-1 -right-1 group-hover:block hidden bg-rpg-dark border border-rpg-gold/50 text-rpg-gold text-[8px] px-1 rounded shadow-lg z-10">
                    Predefinido (Nv.1)
                </div>
            )}
            {breakdown && Object.keys(breakdown).length > 0 && (
                <div className="absolute top-2 right-2 z-50">
                    <button
                        onMouseEnter={() => setActiveTooltip(label)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(isOpen ? null : label);
                        }}
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border transition-all ${isOpen ? 'bg-rpg-gold text-rpg-dark border-rpg-gold shadow-glow-gold' : 'bg-rpg-gold/20 text-rpg-gold border-rpg-gold/30 hover:bg-rpg-gold/40'}`}
                    >
                        ?
                    </button>
                    {isOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-rpg-panel border-2 border-rpg-gold/50 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] p-3 z-[100] animate-fade-in backdrop-blur-xl ring-1 ring-black/50">
                            <div className="absolute -top-2 right-1.5 w-3 h-3 bg-rpg-panel border-l-2 border-t-2 border-rpg-gold/50 rotate-45"></div>
                            <h5 className="text-[10px] font-black text-rpg-gold uppercase border-b border-rpg-gold/20 pb-1.5 mb-2 flex justify-between items-center">
                                <span>Detalhamento {label}</span>
                                <span className="text-[8px] opacity-50 font-sans tracking-normal">D&D 5e</span>
                            </h5>
                            <div className="space-y-1.5">
                                {Object.entries(breakdown).map(([source, val]) => (
                                    <div key={source} className="flex justify-between text-[10px] text-rpg-parchment font-medium">
                                        <span className="opacity-70">{source}</span>
                                        <span className={`${val >= 0 ? (source === 'Base' ? 'text-rpg-grey' : 'text-green-400') : 'text-red-400'} font-bold`}>
                                            {source === 'Base' ? val : (val >= 0 ? `+${val}` : val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-[11px] font-black text-rpg-gold bg-black/20 -mx-3 -mb-3 p-3 rounded-b-lg">
                                <span className="uppercase tracking-widest">Total</span>
                                <span className="text-sm drop-shadow-glow-gold">{value}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="text-sm text-rpg-gold-light mt-4 font-black font-serif px-6 py-1.5 rounded-full border border-rpg-gold/20 bg-rpg-gold/10 group-hover:bg-rpg-gold/20 transition-all shadow-glow-gold/10">
                {modifier >= 0 ? `+${modifier}` : modifier}
            </div>
        </div>
    );
};

export default AttributeInput;
