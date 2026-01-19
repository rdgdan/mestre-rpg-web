'use client';

import { useState } from 'react';
import { Campaign } from '@/types/campaign';
import { Character } from '@/lib/character-data';
import { generateProceduralMap, MapData, POI, TerrainType, FeatureType } from '@/lib/map-data';

interface MapGeneratorProps {
    campaign: Campaign;
    characters: Character[];
}

export default function MapGenerator({ campaign, characters }: MapGeneratorProps) {
    const [description, setDescription] = useState('');
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTile, setSelectedTile] = useState<{x:number, y:number, terrain: string, feature: string | null} | null>(null);

    const generateMap = async () => {
        setIsLoading(true);
        setError(null);
        setSelectedTile(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 600)); 
            const resultData = generateProceduralMap(description);
            setMapData(resultData);
        } catch (err: any) {
            setError(`Erro na Cartografia: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getTerrainColor = (type: TerrainType) => {
        switch (type) {
            // WORLD
            case 'water': return 'bg-blue-500';
            case 'grass': return 'bg-green-600';
            case 'forest': return 'bg-green-800';
            case 'mountain': return 'bg-stone-600';
            case 'sand': return 'bg-amber-200';
            case 'snow': return 'bg-slate-100';
            
            // CITY
            case 'street': return 'bg-stone-400';
            case 'plaza': return 'bg-stone-300';
            case 'roof': return 'bg-amber-700';
            case 'wall': return 'bg-slate-700';
            
            // DUNGEON
            case 'void': return 'bg-black';
            case 'floor': return 'bg-stone-500';
            case 'wood-floor': return 'bg-yellow-900';
            case 'lava': return 'bg-orange-600 animate-pulse';
            
            default: return 'bg-magenta-500';
        }
    };

    const getFeatureIcon = (feature: FeatureType) => {
        if (!feature) return null;
        switch (feature) {
            // World
            case 'city': return '🏰';
            case 'dungeon': return '💀';
            case 'ruins': return '🏚️';
            case 'tower': return '🗼';
            case 'shrine': return '⛩️';
            case 'cave': return '🕳️';
            
            // City
            case 'tavern': return '🍺';
            case 'shop': return '💰';
            case 'blacksmith': return '⚒️';
            case 'temple': return '⛪';
            case 'palace': return '👑';
            case 'guard': return '🛡️';

            // Dungeon
            case 'chest': return '🎁';
            case 'trap': return '⚠️';
            case 'monster': return '👹';
            case 'boss': return '🐉';
            case 'stairs_up': return '🆙';
            case 'stairs_down': return '⬇️';

            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#2b1b17] text-[#e3d5c1] p-4 rounded-lg shadow-lg border border-[#8B4513]">
                <h2 className="text-2xl font-serif mb-4 flex items-center gap-2">
                    🗺️ Cartógrafo Real (Inteligente)
                </h2>
                
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Uma cidade murada... ou Uma masmorra escura..."
                        className="flex-1 bg-[#1a0f0a] border border-[#8B4513] text-[#e3d5c1] p-2 rounded focus:ring-2 focus:ring-[#8B4513] outline-none placeholder-[#e3d5c1]/30"
                    />
                    <button
                        onClick={generateMap}
                        disabled={isLoading}
                        className="px-6 py-2 bg-[#8B4513] hover:bg-[#a05215] text-[#e3d5c1] rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            'Gerar Mapa'
                        )}
                    </button>
                </div>
                <p className="text-xs text-[#e3d5c1]/50 italic">
                    Dica: Tente palavras como "Cidade", "Vila", "Masmorra", "Caverna" para mudar o tipo de mapa.
                </p>
            </div>

            {mapData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[80vh]">
                    {/* MAPA VISUAL */}
                    <div className="md:col-span-2 bg-[#1a0f0a] p-2 rounded-lg shadow-2xl border-2 border-[#8B4513] flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-2 px-2 shrink-0">
                             <h3 className="font-serif text-xl text-[#e3d5c1] ">{mapData.title}</h3>
                             <span className="text-xs font-mono bg-[#8B4513] px-2 py-1 rounded text-white">{mapData.mode} MODE</span>
                        </div>
                        
                        <div className="flex-1 overflow-auto bg-black relative custom-scrollbar flex items-center justify-center">
                           <div 
                                className="aspect-square grid bg-black shadow-inner"
                                style={{ 
                                    gridTemplateColumns: `repeat(${mapData.grid.length}, minmax(0, 1fr))`,
                                    width: '100%',
                                    minWidth: '600px', // Zoom force
                                    maxWidth: '1200px'
                                }}
                           >
                                {mapData.grid.map((row, y) => (
                                    row.map((tile, x) => (
                                        <div 
                                            key={`${x}-${y}`}
                                            onClick={() => setSelectedTile({x, y, terrain: tile.type, feature: tile.feature})}
                                            className={`${getTerrainColor(tile.type)} relative border-[0.1px] border-black/5 hover:border-white/50 cursor-crosshair transition-colors`}
                                            title={`X:${x} Y:${y}`}
                                        >
                                            
                                            {tile.feature && (
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] md:text-sm drop-shadow-md select-none leading-none z-10 pointer-events-none">
                                                    {getFeatureIcon(tile.feature)}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DETALHES DO MAPA */}
                    <div className="bg-[#e3d5c1] text-[#2b1b17] p-6 rounded-lg shadow-xl font-serif h-full overflow-y-auto custom-scrollbar border-l-4 border-[#2b1b17]">
                        <div className="border-b-2 border-[#2b1b17] pb-4 mb-4">
                            <h3 className="text-2xl font-bold mb-2">Informações</h3>
                            <p className="italic text-lg">"{mapData.mastersVoice}"</p>
                        </div>

                        <div className="space-y-6">
                            {selectedTile ? (
                                <div className="bg-white/80 p-4 rounded border-2 border-[#8B4513] shadow-md animate-fade-in">
                                    <h4 className="font-bold flex items-center gap-2 text-lg">
                                        📍 Coordenada <span className="font-mono text-sm bg-black text-white px-2 rounded">{selectedTile.x}, {selectedTile.y}</span>
                                    </h4>
                                    <div className="mt-2 space-y-1">
                                        <p><strong>Terreno:</strong> <span className="capitalize">{selectedTile.terrain}</span></p>
                                        {selectedTile.feature && (
                                            <p className="text-[#8B4513] font-bold">
                                                <strong>Ocupação:</strong> {selectedTile.feature.toUpperCase()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 text-xs opacity-70">
                                        Clique em outro quadrado para inspecionar.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-black/5 rounded italic text-gray-500">
                                    Clique em qualquer quadrado do mapa para ver detalhes do terreno.
                                </div>
                            )}

                            <div className="bg-[#2b1b17] text-[#e3d5c1] p-4 rounded">
                                <h4 className="font-bold border-b border-[#e3d5c1]/30 pb-2 mb-2">
                                    {mapData.mode === 'DUNGEON' ? '⚠️ Perigos' : '📜 Rumores'}
                                </h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    {mapData.rumors.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="bg-[#d4c5b0] p-2 rounded flex justify-between">
                                    <strong>Clima:</strong> <span>{mapData.sensory.climate}</span>
                                </div>
                                <div className="bg-[#d4c5b0] p-2 rounded flex justify-between">
                                    <strong>Cheiro:</strong> <span>{mapData.sensory.smell}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
