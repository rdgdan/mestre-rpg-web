'use client';

import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Campaign } from '@/types/campaign';
import { Character } from '@/lib/character-data';

interface POI {
    id: string;
    name: string;
    description: string;
    type: 'cidade' | 'vila' | 'taverna' | 'templo' | 'ruina' | 'porto' | 'segredo' | 'perigo';
    grid: string; // Ex: "A5", "C10"
}

interface Geography {
    type: 'montanha' | 'floresta' | 'mar' | 'lago' | 'rio' | 'colina' | 'navio' | 'monstro' | 'cachoeira' | 'torre' | 'farol' | 'recife' | 'caverna' | 'rosa_dos_ventos';
    grid: string; // Ex: "A5"
    rotation?: number;
    scale?: number;
}

interface MapData {
    title: string;
    regionType: string;
    mastersVoice: string;
    sensory: { smell: string; sound: string; climate: string };
    rumors: string[];
    pois: POI[];
    geography: Geography[];
}

interface MapGeneratorProps {
    campaign: Campaign;
    characters: Character[];
}

export default function MapGenerator({ campaign, characters }: MapGeneratorProps) {
    const [description, setDescription] = useState('');
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

    // Converte coordenadas de Grid (A5) para porcentagem (x, y)
    const gridToPos = (grid: string) => {
        const col = grid.charAt(0).toUpperCase().charCodeAt(0) - 65; // A=0, J=9
        const row = parseInt(grid.slice(1)) - 1; // 1=0, 10=9
        return {
            x: (col * 10) + 5,
            y: (row * 10) + 5
        };
    };

    const generateMap = async () => {
        if (!description.trim()) return;

        const apiKey = localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            setError('Chave do Gemini não encontrada.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSelectedPoi(null);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);

            const modelsToTry = [
                'gemini-2.0-flash',
                'gemini-2.0-flash-lite-preview',
                'gemini-exp-1206',
                'gemini-2.5-flash-preview-tts',
                'gemini-2.5-pro-preview-tts',
                'gemma-3-27b-it',
                'gemma-3-12b-it',
                'gemma-3-4b-it',
                'gemma-3-1b-it',
                'gemini-1.5-flash',
                'gemini-1.5-flash-8b',
                'gemini-1.5-pro',
                'gemini-flash-latest',
                'gemini-2.0-pro-exp-02-05',
                'gemini-1.5-pro-latest',
                'gemini-pro'
            ];

            const prompt = `
                Você é um MESTRE CARTÓGRAFO REALISTA. Crie um ATLAS ILUSTRADO ANTIGO (Estilo Nanquim / Ink-wash).
                
                SISTEMA DE COORDENADAS: O mapa usa um grid 10x10. 
                - Colunas: A até J.
                - Linhas: 1 até 10.
                - Exemplo: "A1" é o topo-esquerdo, "J10" é o fundo-direito.

                INSTRUCÃO: "${description}"

                REGRAS TÉCNICAS:
                1. DENSIDADE GEOGRÁFICA: Gere entre 60 e 90 elementos em "geography". Use as coordenadas do GRID.
                2. ESTILO: Evite emojis coloridos e brilhantes na descrição mental, pense em símbolos de tinta preta.
                3. NOVOS ELEMENTOS: 'navio', 'monstro', 'recife', 'farol', 'cachoeira', 'caverna', 'torre', 'montanha', 'floresta'.
                4. POSICIONAMENTO LÓGICO: Use o grid para criar massas contínuas (ex: Floresta em A5, A6, B5, B6).

                JSON VÁLIDO:
                {
                  "title": "Nome da Região",
                  "regionType": "Arquipélago...",
                  "mastersVoice": "Relato imersivo para o mestre",
                  "sensory": { "smell": "...", "sound": "...", "climate": "..." },
                  "rumors": ["...", "..."],
                  "pois": [{ "id": "1", "name": "Local", "grid": "D4", "type": "cidade", "description": "..." }],
                  "geography": [{ "type": "montanha", "grid": "B2", "scale": 1.1, "rotation": 0 }]
                }
            `;

            let resultData: MapData | null = null;
            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        resultData = JSON.parse(jsonMatch[0]);
                        break;
                    }
                } catch (innerErr: any) { lastError = innerErr; }
            }

            if (!resultData) throw new Error(lastError?.message || "O Atlas não pôde ser traçado. Tente novamente.");
            setMapData(resultData);
        } catch (err: any) {
            setError(`Erro na Cartografia: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getGeographyEmoji = (type: Geography['type']) => {
        switch (type) {
            case 'montanha': return '🏔️';
            case 'floresta': return '🌲';
            case 'mar': return '🌊';
            case 'lago': return '💧';
            case 'rio': return '🛶';
            case 'colina': return '⛰️';
            case 'navio': return '⛵';
            case 'monstro': return '🦑';
            case 'cachoeira': return '🫧';
            case 'torre': return '🏰';
            case 'farol': return '🚨';
            case 'recife': return '🪸';
            case 'caverna': return '🕳️';
            case 'rosa_dos_ventos': return '🧭';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col gap-4 p-3 sm:p-6 bg-[#e0d0b0] border-[4px] sm:border-[8px] border-[#2b1b17] rounded-sm shadow-[0_25px_50px_rgba(0,0,0,0.5)] relative overflow-hidden font-cinzel select-none"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")' }}>

            <div className="absolute inset-0 pointer-events-none opacity-40 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>

            <div className="relative z-10 space-y-4 sm:space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#2b1b17]/20 pb-4">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#2b1b17] tracking-tighter uppercase leading-none">
                            {mapData?.title || 'Grande Atlas'}
                        </h2>
                        <p className="text-[#2b1b17]/60 italic text-sm sm:text-base font-medieval mt-1">Crônicas Geográficas</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o reino..."
                            className="bg-[#f5e6ca]/60 border-b-2 border-[#2b1b17]/40 p-2 text-[#2b1b17] placeholder-[#2b1b17]/30 focus:outline-none focus:border-[#2b1b17] transition-all w-full sm:w-64 text-sm sm:text-base font-medieval"
                        />
                        <button
                            onClick={generateMap}
                            disabled={isLoading}
                            className="bg-[#2b1b17] text-[#e0d0b0] px-6 py-2 hover:brightness-125 transition-all font-bold uppercase text-xs sm:text-sm shadow-lg active:scale-95"
                        >
                            {isLoading ? 'Traçando...' : 'Traçar'}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="text-red-900 text-center font-bold p-3 bg-red-950/10 border border-red-950/20 rounded font-medieval text-sm">
                        🚨 {error}
                    </div>
                )}

                {mapData && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        {/* O MAPA COM GRID */}
                        <div className="relative aspect-[16/10] bg-[#d2bf99] border-[4px] border-[#2b1b17]/80 shadow-xl overflow-hidden group rounded-sm">

                            {/* Grid Visual (A-J, 1-10) */}
                            <div className="absolute inset-0 pointer-events-none border border-[#2b1b17]/10">
                                {[...Array(11)].map((_, i) => (
                                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-[#2b1b17]/5" style={{ left: `${i * 10}%` }}></div>
                                ))}
                                {[...Array(11)].map((_, i) => (
                                    <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-[#2b1b17]/5" style={{ top: `${i * 10}%` }}></div>
                                ))}
                                {/* Rótulos do Grid */}
                                <div className="absolute top-0 left-0 right-0 flex justify-around text-[8px] sm:text-[10px] text-[#2b1b17]/30 font-bold p-0.5">
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(l => <span key={l}>{l}</span>)}
                                </div>
                                <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-around text-[8px] sm:text-[10px] text-[#2b1b17]/30 font-bold p-0.5">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <span key={n}>{n}</span>)}
                                </div>
                            </div>

                            {/* Camada Geográfica (Nanquim) */}
                            {mapData.geography.map((geo, i) => {
                                const pos = gridToPos(geo.grid);
                                return (
                                    <div
                                        key={`geo-${i}`}
                                        className="absolute transition-all duration-1000 select-none grayscale contrast-[1.8] brightness-[0.6] sepia-[0.3] opacity-60 hover:opacity-100 text-3xl sm:text-5xl"
                                        style={{
                                            left: `${pos.x}%`,
                                            top: `${pos.y}%`,
                                            transform: `scale(${geo.scale || 1}) rotate(${geo.rotation || 0}deg) translate(-50%, -50%)`,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        {getGeographyEmoji(geo.type)}
                                    </div>
                                );
                            })}

                            {/* Rótulos dos POIs */}
                            {mapData.pois.map((poi) => {
                                const pos = gridToPos(poi.grid);
                                return (
                                    <button
                                        key={poi.id}
                                        onClick={() => setSelectedPoi(poi)}
                                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 group/label transition-all z-40
                                                   ${selectedPoi?.id === poi.id ? 'scale-110 z-50 text-[#2b1b17] font-black' : 'text-[#2b1b17]/90 hover:text-[#2b1b17]'}`}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                    >
                                        <div className="relative">
                                            <div className="w-1 h-1 bg-[#2b1b17] rounded-full mx-auto mb-0.5"></div>
                                            <span className="text-[10px] sm:text-base font-medieval tracking-tight block whitespace-nowrap bg-[#f0e2b0]/60 px-1.5 rounded-sm shadow border border-[#2b1b17]/10 backdrop-blur-[1px]">
                                                {poi.name}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ÁREA NARRATIVA (ESCALA REDUZIDA) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="p-6 sm:p-8 border-l-[8px] border-[#2b1b17] bg-[#fdfaf5]/40 relative shadow-lg rounded-r-lg min-h-[200px]">
                                    <h4 className="text-[10px] font-bold tracking-[0.3em] text-[#2b1b17]/50 uppercase mb-4">Crônicas do Cartógrafo</h4>

                                    <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        <p className="text-lg sm:text-xl font-medieval text-[#2b1b17] leading-tight italic first-letter:text-4xl first-letter:mr-2">
                                            &quot;{selectedPoi ? selectedPoi.description : mapData.mastersVoice}&quot;
                                        </p>
                                    </div>

                                    {selectedPoi && (
                                        <button
                                            onClick={() => setSelectedPoi(null)}
                                            className="mt-4 text-[10px] underline opacity-50 hover:opacity-100 font-bold uppercase tracking-widest text-[#2b1b17]"
                                        >
                                            ← Visão Geral
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="bg-[#2b1b17] text-[#e0d0b0] p-6 space-y-6 shadow-xl rounded-sm">
                                    <div>
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mb-3 border-b border-[#e0d0b0]/10 pb-2">Atmosfera</h4>
                                        <div className="space-y-2 text-sm sm:text-base">
                                            <p className="font-medieval italic">👃 {mapData.sensory.smell}</p>
                                            <p className="font-medieval italic">👂 {mapData.sensory.sound}</p>
                                            <p className="font-medieval italic">🌡️ {mapData.sensory.climate}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 border-b border-[#e0d0b0]/10 pb-2 mb-3">Boatos</h4>
                                        <ul className="space-y-3">
                                            {mapData.rumors.map((r, i) => (
                                                <li key={i} className="font-medieval italic text-xs sm:text-sm opacity-80 border-l-2 border-[#e0d0b0]/20 pl-3">
                                                    &quot;{r}&quot;
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
