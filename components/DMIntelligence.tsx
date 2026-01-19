'use client';

import React, { useState, useMemo } from 'react';
import { Campaign } from '@/types/campaign';
import { Character } from '@/lib/character-data';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { Oracle } from '../lib/oracle-data';

interface DMIntelligenceProps {
    campaign: Campaign;
    characters: Character[];
}

export default function DMIntelligence({ campaign, characters }: DMIntelligenceProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState<{ title: string, text: string, details?: string[] } | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil' | 'Mortal'>('Médio');
    
    // Estados para inputs do Oráculo
    const [sceneType, setSceneType] = useState('urbano');
    const [npcRole, setNpcRole] = useState('comum');
    const [questTheme, setQuestTheme] = useState('combate');

    // 1. Cálculo de APL (Average Party Level)
    const apl = useMemo(() => {
        if (characters.length === 0) return 1;
        const totalLevel = characters.reduce((sum, char) => sum + (char.level || 1), 0);
        return Math.round(totalLevel / characters.length);
    }, [characters]);

    // 2. Sugestão de Encontros baseada em CR (Nível de Desafio)
    const suggestedMonsters = useMemo(() => {
        // Multiplicadores simplificados de dificuldade
        const difficultyMultipliers = {
            'Fácil': 0.5,
            'Médio': 1,
            'Difícil': 1.5,
            'Mortal': 2
        };

        const targetCR = apl * difficultyMultipliers[selectedDifficulty];

        // Filtra monstros próximos ao CR alvo
        return dndMonsters
            .filter(m => {
                const monsterCR = eval(m.challenge.replace('1/8', '0.125').replace('1/4', '0.25').replace('1/2', '0.5'));
                return monsterCR >= targetCR * 0.7 && monsterCR <= targetCR * 1.3;
            })
            .sort(() => 0.5 - Math.random()) // Embaralha
            .slice(0, 4); // Pega 4 sugestões
    }, [apl, selectedDifficulty]);

    // 3. Função do Oráculo Procedural (Substituindo I.A. Generativa)
    const generateNarrative = (type: 'scene' | 'npc' | 'quest') => {
        setIsGenerating(true);
        
        // Simular um pequeno delay para dar sensação de "processamento"
        setTimeout(() => {
            let result;
            const context = campaign?.name || "Campanha";
            switch(type) {
                case 'scene':
                    result = Oracle.generateScene(sceneType, context);
                    break;
                case 'npc':
                    result = Oracle.generateNPC(npcRole, context);
                    break;
                case 'quest':
                    result = Oracle.generateQuest(questTheme, context);
                    break;
                default:
                    result = Oracle.generateScene();
            }

            setAiResponse({
                title: result.title,
                text: result.description,
                details: result.details
            });
            setIsGenerating(false);
        }, 600);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* HELPER DE ENCONTROS */}
            <section className="bg-rpg-panel border border-rpg-gold/20 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-cinzel text-rpg-gold">Helper de Encontros</h2>
                        <p className="text-sm text-rpg-grey font-medieval">Sugestões baseadas no nível médio do grupo (APL: {apl})</p>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        {(['Fácil', 'Médio', 'Difícil', 'Mortal'] as const).map(d => (
                            <button
                                key={d}
                                onClick={() => setSelectedDifficulty(d)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${selectedDifficulty === d ? 'bg-rpg-gold text-rpg-dark' : 'text-rpg-grey hover:text-rpg-parchment'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {suggestedMonsters.map((monster, idx) => (
                        <div key={idx} className="bg-rpg-slate/50 border border-white/5 p-4 rounded-lg hover:border-rpg-gold/30 transition-all group">
                            <span className="text-[10px] uppercase font-bold text-rpg-gold/60">{monster.type}</span>
                            <h4 className="font-bold text-rpg-parchment group-hover:text-rpg-gold transition-colors">{monster.name}</h4>
                            <div className="flex justify-between mt-2 text-xs opacity-70">
                                <span>CR {monster.challenge}</span>
                                <span>HP {monster.hp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ORÁCULO DO MESTRE (PROCEDURAL) */}
            <section className="bg-rpg-panel border border-rpg-gold/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                </div>

                <h2 className="text-2xl font-cinzel text-purple-400 mb-6 border-b border-purple-500/20 pb-2 flex items-center gap-2">
                    <span>🔮</span> Oráculo do Mestre
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Scene Card */}
                    <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                            <span className="text-xl">🏰</span> Ambiente
                        </div>
                        <select 
                            value={sceneType}
                            onChange={(e) => setSceneType(e.target.value)}
                            className="bg-black/40 border border-purple-500/20 rounded px-2 py-1 text-xs text-purple-200 focus:outline-none focus:border-purple-500"
                        >
                            <option className="bg-gray-900 text-purple-200" value="urbano">Urbano</option>
                            <option className="bg-gray-900 text-purple-200" value="selvagem">Selvagem</option>
                            <option className="bg-gray-900 text-purple-200" value="masmorra">Masmorra</option>
                        </select>
                        <button
                            onClick={() => generateNarrative('scene')}
                            disabled={isGenerating}
                            className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 py-2 rounded text-xs font-bold uppercase transition-colors"
                        >
                            Gerar Cena
                        </button>
                    </div>

                    {/* NPC Card */}
                    <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                            <span className="text-xl">👤</span> NPC
                        </div>
                        <select 
                            value={npcRole}
                            onChange={(e) => setNpcRole(e.target.value)}
                            className="bg-black/40 border border-amber-500/20 rounded px-2 py-1 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                        >
                            <option className="bg-gray-900 text-amber-200" value="comum">Comum (Aldeão/Guarda)</option>
                            <option className="bg-gray-900 text-amber-200" value="nobre">Nobre/Clero</option>
                            <option className="bg-gray-900 text-amber-200" value="submundo">Submundo/Criminal</option>
                        </select>
                        <button
                            onClick={() => generateNarrative('npc')}
                            disabled={isGenerating}
                            className="w-full bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 py-2 rounded text-xs font-bold uppercase transition-colors"
                        >
                            Criar NPC
                        </button>
                    </div>

                    {/* Quest Card */}
                    <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-lg flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                            <span className="text-xl">📜</span> Aventura
                        </div>
                        <select 
                            value={questTheme}
                            onChange={(e) => setQuestTheme(e.target.value)}
                            className="bg-black/40 border border-cyan-500/20 rounded px-2 py-1 text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
                        >
                            <option className="bg-gray-900 text-cyan-200" value="combate">Combate / Monstro</option>
                            <option className="bg-gray-900 text-cyan-200" value="investigacao">Investigação / Mistério</option>
                            <option className="bg-gray-900 text-cyan-200" value="diplomacia">Diplomacia / Política</option>
                        </select>
                        <button
                            onClick={() => generateNarrative('quest')}
                            disabled={isGenerating}
                            className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 py-2 rounded text-xs font-bold uppercase transition-colors"
                        >
                            Gerar Gancho
                        </button>
                    </div>
                </div>

                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-8 text-purple-400 animate-pulse">
                        <span className="text-4xl mb-4">🎲</span>
                        <p className="font-medieval text-sm tracking-widest">Lançando os dados do destino...</p>
                    </div>
                )}

                {aiResponse && !isGenerating && (
                    <div className="bg-black/40 border border-purple-500/30 p-6 rounded-xl relative group animate-fade-in">
                        
                        <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                            <h3 className="font-cinzel text-xl text-white flex items-center gap-2">
                                <span className="text-purple-500">❖</span> {aiResponse.title}
                            </h3>
                            <button onClick={() => setAiResponse(null)} className="text-xs text-rpg-grey hover:text-red-400">Fechar</button>
                        </div>

                        <p className="font-medieval text-lg leading-relaxed text-rpg-parchment/90 mb-6">
                            {aiResponse.text}
                        </p>

                        {aiResponse.details && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {aiResponse.details.map((detail, idx) => (
                                    <div key={idx} className="bg-black/30 px-3 py-2 rounded border border-white/5 text-xs text-center text-rpg-grey/80">
                                        {detail}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-4 flex justify-end">
                            <span className="text-[10px] uppercase font-bold text-purple-500/40 font-cinzel tracking-widest">— Oráculo Procedural v1.0</span>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
