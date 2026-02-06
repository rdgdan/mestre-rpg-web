"use client";

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
            className={`px-6 sm:px-8 py-4 sm:py-5 text-sm sm:text-base font-cinzel font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all relative outline-none whitespace-nowrap snap-start ${isActive
                ? 'text-rpg-gold bg-gradient-to-t from-rpg-gold/20 to-transparent'
                : 'text-rpg-grey hover:text-rpg-parchment'
                }`}
        >
            {tabName}
            {isActive && (
                <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-rpg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)] z-10" />
            )}
        </button>
    );
};

export default TabButton;
