'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BattleMap from '@/components/combat/BattleMap';

export default function ProjectorPage() {
    const params = useParams();
    const id = params.id as string;
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden">
            {/* Overlay de Controle (SumiRá após alguns segundos ou no hover) */}
            <div className="absolute top-4 right-4 z-[10000] opacity-0 hover:opacity-100 transition-opacity">
                <button 
                    onClick={toggleFullscreen}
                    className="bg-rpg-gold/20 hover:bg-rpg-gold/40 text-rpg-gold border border-rpg-gold/30 px-4 py-2 rounded-lg font-cinzel text-xs backdrop-blur-md"
                >
                    {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}
                </button>
            </div>

            {/* O Mapa Interativo */}
            <div className="flex-1 w-full h-full">
                <BattleMap arenaId={id} isMaster={false} />
            </div>

            {/* Crédito Discreto no Canto */}
            <div className="absolute bottom-2 left-2 text-white/5 text-[8px] font-cinzel pointer-events-none uppercase tracking-widest">
                Mestre RPG Web • Battle Map Projector Mode
            </div>
        </div>
    );
}
