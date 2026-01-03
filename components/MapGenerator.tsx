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
    x: number;
    y: number;
}

interface Geography {
    type: 'montanha' | 'floresta' | 'mar' | 'lago' | 'rio' | 'colina' | 'navio' | 'monstro' | 'cachoeira' | 'torre' | 'farol' | 'recife' | 'caverna' | 'rosa_dos_ventos';
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    label?: string;
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
                Você é um MESTRE ILUSTRADOR DE MAPAS. Crie um GRANDE ATLAS ILUSTRADO DE RPG (Estilo Hand-Drawn / Watercolor).
                
                REFERÊNCIA ESTÉTICA: Mapas feitos à mão, rascunhados, com aquarela e tinta nanquim.
                PEDIDO: "${description}"

                REGRAS DE OURO (CARTOGRAFIA ILUSTRADA):
                1. DENSIDADE MASSIVA: Gere entre 80 e 120 elementos em "geography".
                2. COMPOSIÇÃO: Crie "massas de terra" (agrupando montanhas e florestas) e "oceanos" (agrupando ondas, recifes e navios).
                3. NOVOS ELEMENTOS:
                   - Marítimos: 'navio' (⛵), 'monstro' (🦑), 'recife' (🪸), 'farol' (🚨).
                   - Geográficos: 'cachoeira' (🌊), 'caverna' (🕳️), 'torre' (🏰), 'montanha' (🏔️).
                4. RÓTULOS (POIs): O mapa deve ter nomes escritos de forma artística.
                5. CLAREZA: Use o campo "mastersVoice" para um relato rico e detalhado para o mestre.

                JSON VÁLIDO:
                {
                  "title": "Nome da Região",
                  "regionType": "Arquipélago, Península, Continental...",
                  "mastersVoice": "Relato imersivo detalhado para o mestre",
                  "sensory": { "smell": "...", "sound": "...", "climate": "..." },
                  "rumors": ["...", "..."],
                  "pois": [{ "id": "1", "name": "Nome do Local", "x": 35, "y": 60, "type": "cidade", "description": "..." }],
                  "geography": [{ "type": "navio", "x": 15, "y": 20, "scale": 1.2, "rotation": 5 }]
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
        <div className="flex flex-col gap-4 sm:gap-8 p-3 sm:p-10 bg-[#e0d0b0] border-[8px] sm:border-[16px] border-[#2b1b17] rounded-sm shadow-[0_50px_100px_rgba(0,0,0,0.7)] relative overflow-hidden font-cinzel select-none min-h-screen sm:min-h-0"
            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")' }}>

            {/* Sombras e Texturas de Manuscrito */}
            <div className="absolute inset-0 pointer-events-none opacity-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] bg-[radial-gradient(circle_at_center,rgba(139,69,19,0.05)_0%,transparent_100%)]"></div>

            <div className="relative z-10 space-y-6 sm:space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-[#2b1b17]/20 pb-6 sm:pb-10">
                    <div className="w-full md:w-auto">
                        <h2 className="text-4xl sm:text-6xl font-black text-[#2b1b17] tracking-tight uppercase leading-none drop-shadow-sm">
                            {mapData?.title || 'Grande Atlas'}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="h-1 lg:w-20 w-10 bg-[#2b1b17]/30"></span>
                            <p className="text-[#2b1b17]/70 italic text-lg sm:text-2xl font-medieval tracking-[0.2em]">Obras do Mestre Ilustrador</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o reino (ex: Arquipélago da Morte)..."
                            className="bg-[#f5e6ca]/60 border-b-4 border-[#2b1b17]/40 p-3 text-[#2b1b17] placeholder-[#2b1b17]/40 focus:outline-none focus:border-[#2b1b17] transition-all w-full sm:w-80 lg:w-96 text-lg sm:text-2xl font-medieval"
                        />
                        <button
                            onClick={generateMap}
                            disabled={isLoading}
                            className="bg-[#2b1b17] text-[#e0d0b0] px-8 py-3 hover:brightness-125 transition-all font-bold tracking-[0.2em] uppercase text-sm sm:text-base shadow-xl active:scale-95"
                        >
                            {isLoading ? 'Ilustrando...' : 'Traçar'}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="text-red-900 text-center font-bold p-6 bg-red-950/10 border-2 border-red-950/20 rounded shadow-inner font-medieval text-lg sm:text-xl">
                        🚨 {error}
                    </div>
                )}

                {mapData && (
                    <div className="flex flex-col gap-8 sm:gap-14 animate-fade-in">
                        {/* O MANUSCRITO ILUSTRADO */}
                        <div className="relative aspect-[16/10] sm:aspect-[16/8] bg-[#d2bf99] border-[6px] sm:border-[10px] border-[#2b1b17]/80 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden group">

                            {/* Overlay de Aquarela (Watercolor effect) */}
                            <div className="absolute inset-0 bg-[#8b4513]/5 mix-blend-multiply opacity-20 pointer-events-none"></div>
                            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"></div>

                            {/* Camada Geográfica Densa (O Mundo) */}
                            {mapData.geography.map((geo, i) => (
                                <div
                                    key={`geo-${i}`}
                                    className={`absolute transition-all duration-1000 select-none grayscale contrast-125 brightness-75 hover:brightness-100
                                               ${geo.type === 'rosa_dos_ventos' ? 'text-7xl sm:text-[12rem] opacity-30 z-10' : 'text-4xl sm:text-7xl opacity-40 hover:opacity-60'}`}
                                    style={{
                                        left: `${geo.x}%`,
                                        top: `${geo.y}%`,
                                        transform: `scale(${geo.scale || 1}) rotate(${geo.rotation || 0}deg) translate(-50%, -50%)`,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {getGeographyEmoji(geo.type)}
                                </div>
                            ))}

                            {/* Rótulos Artísticos (POIs) */}
                            {mapData.pois.map((poi) => (
                                <button
                                    key={poi.id}
                                    onClick={() => setSelectedPoi(poi)}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 group/label transition-all z-40
                                               ${selectedPoi?.id === poi.id ? 'scale-110 sm:scale-150 z-50 text-[#2b1b17] font-black' : 'text-[#2b1b17]/80 hover:text-[#2b1b17]'}`}
                                    style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                                >
                                    <div className="relative">
                                        <div className="w-1.5 h-1.5 bg-[#2b1b17]/60 rounded-full mx-auto mb-1"></div>
                                        <span className="text-sm sm:text-2xl font-medieval tracking-tighter block whitespace-nowrap bg-[#f0e2b0]/50 px-2 rounded-sm shadow-md border-b-2 border-[#2b1b17]/10 backdrop-blur-[1px]">
                                            {poi.name}
                                        </span>
                                        <div className="h-0.5 bg-[#2b1b17]/40 w-0 group-hover/label:w-full transition-all duration-500 mx-auto"></div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* ÁREA NARRATIVA (CORRIGIDA) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-14 pb-10 sm:pb-20">
                            <div className="lg:col-span-2 space-y-6 sm:space-y-10">
                                <div className="p-8 sm:p-14 border-l-[12px] sm:border-l-[20px] border-[#2b1b17] bg-[#fdfaf5]/40 relative shadow-2xl rounded-r-lg min-h-[250px] sm:min-h-[400px]">
                                    <div className="absolute top-4 right-6 text-5xl sm:text-7xl opacity-5 pointer-events-none italic font-black">Atlas Ilustrado</div>
                                    <h4 className="text-xs sm:text-lg font-bold tracking-[0.5em] text-[#2b1b17]/50 uppercase mb-6 sm:mb-10">Crônicas do Cartógrafo</h4>

                                    <div className="max-h-[300px] sm:max-h-none overflow-y-auto sm:overflow-visible pr-4 custom-scrollbar">
                                        <p className="text-2xl sm:text-4xl font-medieval text-[#2b1b17] leading-relaxed italic first-letter:text-6xl sm:first-letter:text-8xl first-letter:font-cinzel first-letter:float-left first-letter:mr-4 first-letter:mt-1">
                                            "{selectedPoi ? selectedPoi.description : mapData.mastersVoice}"
                                        </p>
                                    </div>

                                    {selectedPoi && (
                                        <button
                                            onClick={() => setSelectedPoi(null)}
                                            className="mt-8 sm:mt-16 text-sm sm:text-base underline opacity-50 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest text-[#2b1b17]"
                                        >
                                            ← Retornar à Visão Geral
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 sm:gap-10">
                                <div className="bg-[#2b1b17] text-[#e0d0b0] p-8 sm:p-12 space-y-8 sm:space-y-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-sm border-t-8 border-[#e0d0b0]/10">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase opacity-40 mb-4 sm:mb-8 border-b border-[#e0d0b0]/20 pb-4">Ambiente do Registro</h4>
                                        <div className="space-y-4">
                                            <p className="font-medieval text-xl sm:text-3xl italic leading-tight text-white/90">👃 {mapData.sensory.smell}</p>
                                            <p className="font-medieval text-xl sm:text-3xl italic leading-tight text-white/90">👂 {mapData.sensory.sound}</p>
                                            <p className="font-medieval text-xl sm:text-3xl italic leading-tight text-white/90">🌡️ {mapData.sensory.climate}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 sm:space-y-8">
                                        <h4 className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase opacity-40 border-b border-[#e0d0b0]/20 pb-4">Boataria e Segredos</h4>
                                        <ul className="space-y-6 sm:space-y-8">
                                            {mapData.rumors.map((r, i) => (
                                                <li key={i} className="font-medieval italic text-lg sm:text-2xl opacity-80 border-l-4 border-[#e0d0b0]/30 pl-6 leading-tight hover:opacity-100 transition-opacity">
                                                    "{r}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-6 border-4 border-[#2b1b17]/20 rounded-sm text-center opacity-40">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.5em] text-[#2b1b17]">Referência de Roleplay Narrativo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
