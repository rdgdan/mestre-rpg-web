import React from 'react';

interface TabButtonProps {
    activeTab: string;
    tabName: string;
    onClick: (tab: any) => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ activeTab, tabName, onClick }) => {
    const isActive = activeTab === tabName;
    return (
        <button
            onClick={() => onClick(tabName)}
            className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative outline-none whitespace-nowrap snap-start group/tab ${isActive
                ? 'text-rpg-gold'
                : 'text-rpg-grey/60 hover:text-white'
                }`}
        >
            <span className="relative z-10 transition-transform group-hover/tab:scale-105 inline-block font-cinzel">
                {tabName}
            </span>
            {isActive && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-rpg-gold/10 to-transparent rounded-lg animate-fade-in" />
                    <div className="absolute bottom-1 left-2 right-2 h-[3px] bg-rpg-gold shadow-[0_0_15px_rgba(212,175,55,0.6)] z-10 rounded-full animate-grow-x" />
                </>
            )}
        </button>
    );
};

export default TabButton;
