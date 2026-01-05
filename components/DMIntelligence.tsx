'use client';

import React, { useState, useMemo } from 'react';
import { Campaign } from '@/types/campaign';
import { Character } from '@/lib/character-data';
import { dndMonsters, MonsterData } from '@/lib/monsters-data';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DMIntelligenceProps {
    campaign: Campaign;
    characters: Character[];
}

export default function DMIntelligence({ campaign, characters }: DMIntelligenceProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil' | 'Mortal'>('Médio');

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

    // 3. Função para Gerar Descrição Épica
    const generateNarrative = async (type: string) => {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert("Por favor, configure sua API Key no Oráculo primeiro.");
            return;
        }

        setIsGenerating(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `
                Você é um Mestre de RPG veterano narrando para a campanha "${campaign.name}".
                Contexto da Campanha: "${campaign.description || "Aventura de fantasia"}".
                Personagens no grupo: ${characters.map(c => `${c.name} (${c.race} ${c.class})`).join(', ')}.
                
                Gere uma descrição épica e imersiva para o tipo: "${type}".
                Mantenha um tom cinematográfico, foque nos sentidos (cheiro, som, visão) e seja breve (max 3 parágrafos).
                Não use nomes específicos de monstros a menos que eu peça, foque na atmosfera.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            setAiResponse(response.text());
        } catch (error) {
            console.error("Erro na I.A.:", error);
            setAiResponse("O Oráculo falhou em canalizar a visão... Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
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

            {/* NARRATIVA ÉPICA */}
            <section className="bg-rpg-panel border border-rpg-gold/20 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-cinzel text-rpg-gold mb-6 border-b border-rpg-gold/10 pb-2">Narrativa Épica</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => generateNarrative('Início de um combate tenso')}
                        disabled={isGenerating}
                        className="bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 p-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-2"
                    >
                        <span>⚔️</span> Início de Luta
                    </button>
                    <button
                        onClick={() => generateNarrative('Um golpe final cinematográfico')}
                        disabled={isGenerating}
                        className="bg-orange-900/20 border border-orange-500/30 hover:bg-orange-900/40 text-orange-400 p-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-2"
                    >
                        <span>💀</span> Golpe Final
                    </button>
                    <button
                        onClick={() => generateNarrative('Ambiente misterioso e detalhado')}
                        disabled={isGenerating}
                        className="bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-blue-400 p-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-2"
                    >
                        <span>🌫️</span> Descrever Local
                    </button>
                    <button
                        onClick={() => generateNarrative('Um momento de descanso ou acampamento')}
                        disabled={isGenerating}
                        className="bg-green-900/20 border border-green-500/30 hover:bg-green-900/40 text-green-400 p-3 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-2"
                    >
                        <span>🔥</span> Descanso
                    </button>
                </div>

                {aiResponse && (
                    <div className="bg-black/40 border border-rpg-gold/20 p-6 rounded-xl font-medieval text-lg italic leading-relaxed text-rpg-parchment/90 relative group animate-fade-in">
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button onClick={() => setAiResponse('')} className="text-xs text-rpg-grey hover:text-red-400">Limpar</button>
                            <button onClick={() => navigator.clipboard.writeText(aiResponse)} className="text-xs text-rpg-grey hover:text-rpg-gold">Copiar</button>
                        </div>
                        {aiResponse}
                        <div className="mt-4 flex justify-end">
                            <span className="text-[10px] uppercase font-bold text-rpg-gold/40 font-cinzel tracking-widest">— O Oráculo</span>
                        </div>
                    </div>
                )}

                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-12 text-rpg-gold animate-pulse">
                        <span className="text-4xl mb-4">🔮</span>
                        <p className="font-cinzel text-sm tracking-widest">Canalizando a sabedoria do Oráculo...</p>
                    </div>
                )}
            </section>
        </div>
    );
}
