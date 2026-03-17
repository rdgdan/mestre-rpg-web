'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleMapState, TokenPosition, MapDecal, listenToBattleMap, updateTokenPosition, toggleFogOfWar, updateDecals, updateViewSettings, updateImageSettings } from '@/lib/map-sync';
import { TerrainType, FeatureType, generateProceduralMap } from '@/lib/map-data';
import { Combatant } from '@/hooks/useCombat';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BattleMapProps {
    arenaId: string;
    isMaster: boolean;
    combatants?: Combatant[];
}

const TILE_SIZE = 60; // Tamanho base de cada célula em pixels

type BattleMapMode = 'NAVIGATE' | 'TOKENS' | 'FOG' | 'STAMPS' | 'CALIBRATE';

export default function BattleMap({ arenaId, isMaster, combatants = [] }: BattleMapProps) {
    const [mapState, setMapState] = useState<BattleMapState | null>(null);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMode, setActiveMode] = useState<BattleMapMode>('NAVIGATE');
    const [activeStamp, setActiveStamp] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Estados para o novo sistema de seleção e teleporte
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectionRect, setSelectionRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

    const STAMPS = [
        { id: 'house', icon: '🏠', label: 'Casa' },
        { id: 'castle', icon: '🏰', label: 'Castelo' },
        { id: 'wall', icon: '🧱', label: 'Muro' },
        { id: 'tree', icon: '🌳', label: 'Árvore' },
        { id: 'rock', icon: '🪨', label: 'Pedra' },
        { id: 'sea', icon: '🌊', label: 'Mar' },
        { id: 'path', icon: '🛤️', label: 'Caminho' },
        { id: 'skull', icon: '💀', label: 'Perigo' },
    ];

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDrawing(false);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    useEffect(() => {
        const unsubscribe = listenToBattleMap(arenaId, (newState) => {
            // Garantir que campos essenciais existam para evitar crashes
            const safeState: BattleMapState = {
                ...newState,
                tokens: (newState.tokens || []).map(t => ({
                    ...t,
                    x: Math.round(t.x),
                    y: Math.round(t.y)
                })),
                decals: newState.decals || [],
                fogOfWar: newState.fogOfWar || [],
                viewSettings: newState.viewSettings || { 
                    zoom: 1, 
                    offsetX: 0, 
                    offsetY: 0, 
                    gridOpacity: 0.2, 
                    showGrid: true 
                },
                backgroundImageSettings: newState.backgroundImageSettings || { scale: 1, x: 0, y: 0 }
            };
            
            setMapState(safeState);
            
            // Sincronizar zoom se for modo projetor (não mestre)
            if (!isMaster) {
                setZoom(safeState.viewSettings.zoom);
                setViewOffset({ x: safeState.viewSettings.offsetX, y: safeState.viewSettings.offsetY });
            }
        });
        return () => unsubscribe();
    }, [arenaId, isMaster]);

    if (!mapState || (!mapState.mapData && !mapState.backgroundImageUrl)) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-rpg-dark/50 gap-6 p-8">
                <div className="text-rpg-gold font-cinzel animate-pulse text-xl">
                    {isUploading ? 'Subindo Mapa para o Reino...' : 'O Mapa está envolto em névoa...'}
                </div>
                {isMaster && (
                    <div className="flex flex-col gap-4 w-full max-w-sm bg-black/40 p-6 rounded-2xl border border-rpg-gold/20 backdrop-blur-sm">
                        <button 
                            disabled={isUploading}
                            onClick={async () => {
                                const newMap = generateProceduralMap("Uma masmorra clássica");
                                const mapRef = doc(db, 'battle_maps', arenaId);
                                await updateDoc(mapRef, { 
                                    mapData: JSON.stringify(newMap), 
                                    backgroundImageUrl: '', 
                                    lastUpdated: Date.now() 
                                });
                            }}
                            className="bg-rpg-gold text-rpg-dark font-bold py-3 rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                        >
                            ⚒️ GERAR MAPA PROCEDURAL
                        </button>
                        
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-rpg-gold/20"></span></div>
                            <div className="relative flex justify-center text-[10px] uppercase font-cinzel text-rpg-grey bg-transparent px-2">OU</div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-rpg-gold/30 rounded-xl p-4 hover:border-rpg-gold/60 transition-all group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform mb-1">📁</span>
                                <span className="text-[10px] text-rpg-gold font-bold uppercase">Subir Imagem Local (PNG/JPG)</span>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setIsUploading(true);
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                
                                                const response = await fetch('/api/upload-map', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                
                                                if (!response.ok) throw new Error('Falha no upload');
                                                
                                                const { url } = await response.json();
                                                
                                                // Sincronizar a URL local no Firestore (para que o projetor na mesma rede veja)
                                                const mapRef = doc(db, 'battle_maps', arenaId);
                                                await updateDoc(mapRef, { 
                                                    backgroundImageUrl: url,
                                                    mapData: null,
                                                    lastUpdated: Date.now()
                                                });
                                            } catch (err) {
                                                console.error(err);
                                                alert("Erro ao salvar imagem localmente.");
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }
                                    }}
                                />
                            </button>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] text-rpg-grey uppercase font-bold text-center">Ou cole um Link (URL)</span>
                                <input 
                                    type="text"
                                    placeholder="https://link-da-imagem.jpg"
                                    className="bg-black/60 border border-rpg-gold/30 rounded p-2 text-xs text-white outline-none focus:border-rpg-gold w-full text-center"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const url = (e.target as HTMLInputElement).value;
                                            if (url) {
                                                const mapRef = doc(db, 'battle_maps', arenaId);
                                                await updateDoc(mapRef, { 
                                                    backgroundImageUrl: url,
                                                    mapData: null,
                                                    lastUpdated: Date.now()
                                                });
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        {isUploading && (
                            <div className="w-full bg-rpg-gold/10 h-1 rounded-full overflow-hidden mt-2">
                                <motion.div 
                                    className="h-full bg-rpg-gold"
                                    animate={{ x: [-100, 200] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                            </div>
                        )}
                    </div>
                )}
                {!isMaster && (
                    <p className="text-rpg-grey text-xs italic">Aguardando o Mestre revelar o campo de batalha.</p>
                )}
            </div>
        );
    }

    // Tentar parsear o mapa se ele existir e for string
    let grid: any[][] = [];
    try {
        if (mapState.mapData) {
            const parsed = typeof mapState.mapData === 'string' ? JSON.parse(mapState.mapData) : mapState.mapData;
            grid = parsed.grid || [];
        }
    } catch (e) {
        console.error("Erro ao processar dados do mapa:", e);
    }

    const getTerrainColor = (type: TerrainType) => {
        switch (type) {
            case 'water': return 'bg-blue-900/40';
            case 'grass': return 'bg-green-900/20';
            case 'forest': return 'bg-emerald-950/40';
            case 'mountain': return 'bg-stone-800/60';
            case 'sand': return 'bg-amber-900/10';
            case 'floor': return 'bg-stone-800/80';
            case 'void': return 'bg-black';
            case 'lava': return 'bg-orange-950/60 animate-pulse';
            case 'wood-floor': return 'bg-orange-950/20';
            default: return 'bg-stone-900';
        }
    };

    const getFeatureIcon = (feature: FeatureType) => {
        if (!feature) return null;
        const icons: Record<string, string> = {
            city: '🏰', dungeon: '💀', ruins: '🏚️', tower: '🗼',
            tavern: '🍺', shop: '💰', blacksmith: '⚒️', temple: '⛪',
            chest: '🎁', trap: '⚠️', monster: '👹', boss: '🐉',
            stairs_up: '🆙', stairs_down: '⬇️'
        };
        return icons[feature] || null;
    };

    const isCellRevealed = (x: number, y: number) => {
        if (!mapState.fogOfWar) return true; // Se não houver fog, tudo é visível
        return mapState.fogOfWar.includes(`${x},${y}`);
    };

    const handleDraw = (gridX: number, gridY: number) => {
        if (!isMaster || activeMode !== 'STAMPS' || !activeStamp || !mapState) return;

        if (activeStamp === 'eraser') {
            const currentDecals = mapState.decals || [];
            const newDecals = currentDecals.filter(d => 
                Math.floor(d.x) !== gridX || 
                Math.floor(d.y) !== gridY
            );
            if (newDecals.length !== currentDecals.length) {
                updateDecals(arenaId, newDecals);
            }
        } else {
            const currentDecals = mapState.decals || [];
            const alreadyExists = currentDecals.some(d => d.x === gridX && d.y === gridY && d.type === activeStamp);
            
            if (!alreadyExists) {
                const newDecal: MapDecal = {
                    id: `decal-${Date.now()}-${gridX}-${gridY}`,
                    type: activeStamp,
                    icon: STAMPS.find(s => s.id === activeStamp)?.icon || '❓',
                    x: gridX,
                    y: gridY
                };
                const otherDecals = currentDecals.filter(d => d.x !== gridX || d.y !== gridY);
                updateDecals(arenaId, [...otherDecals, newDecal]);
            }
        }
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-black select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onMouseDown={(e) => {
                if (!isMaster || (e.target as HTMLElement).closest('.pointer-events-auto')) return;
                
                if (activeMode === 'CALIBRATE') {
                    // Modo de Calibragem: Arrastar a Imagem de Fundo
                    const settings = mapState?.backgroundImageSettings || { scale: 1, x: 0, y: 0 };
                    const startX = e.clientX - settings.x;
                    const startY = e.clientY - settings.y;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        updateImageSettings(arenaId, {
                            ...settings,
                            x: moveEvent.clientX - startX,
                            y: moveEvent.clientY - startY
                        });
                    };

                    const handleMouseUp = () => {
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                } else if (activeMode === 'TOKENS') {
                    // Novo Sistema: Seleção em Massa (Caixa)
                    const rect = containerRef.current.getBoundingClientRect();
                    const startX = (e.clientX - rect.left - viewOffset.x) / zoom;
                    const startY = (e.clientY - rect.top - viewOffset.y) / zoom;
                    
                    setDragStart({ x: startX, y: startY });
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const currentX = (moveEvent.clientX - rect.left - viewOffset.x) / zoom;
                        const currentY = (moveEvent.clientY - rect.top - viewOffset.y) / zoom;
                        
                        setSelectionRect({
                            x: Math.min(startX, currentX),
                            y: Math.min(startY, currentY),
                            w: Math.abs(currentX - startX),
                            h: Math.abs(currentY - startY)
                        });
                    };
                    
                    const handleMouseUp = (upEvent: MouseEvent) => {
                        const currentX = (upEvent.clientX - rect.left - viewOffset.x) / zoom;
                        const currentY = (upEvent.clientY - rect.top - viewOffset.y) / zoom;
                        
                        const isClick = Math.abs(currentX - startX) < 5 && Math.abs(currentY - startY) < 5;
                        const isTokenClick = !!(upEvent.target as HTMLElement).closest('.token-unit');
                        
                        if (isClick) {
                            if (isTokenClick) {
                                // O onClick do token lida com a seleção
                            } else if (selectedIds.length > 0) {
                                // COMANDO DE TELEPORTE COM FORMAÇÃO
                                const gridX = Math.floor(currentX / TILE_SIZE);
                                const gridY = Math.floor(currentY / TILE_SIZE);
                                
                                const selectedTokens = (mapState.tokens || []).filter(t => selectedIds.includes(t.id));
                                if (selectedTokens.length > 0) {
                                    // Identificar o Líder (topo-esquerda da seleção atual)
                                    const leader = selectedTokens.reduce((prev, curr) => 
                                        (curr.y < prev.y || (curr.y === prev.y && curr.x < prev.x)) ? curr : prev
                                    );

                                    // Calcular deslocamento em relação ao líder (usando valores arredondados)
                                    const dx = gridX - Math.round(leader.x);
                                    const dy = gridY - Math.round(leader.y);
                                    
                                    const maxGridX = grid.length > 0 ? grid[0].length : 40;
                                    const maxGridY = grid.length > 0 ? grid.length : 40;

                                    selectedIds.forEach(id => {
                                        const t = mapState.tokens?.find(tok => tok.id === id);
                                        if (t) {
                                            // Nova posição baseada no deslocamento do grupo
                                            let nX = Math.round(t.x) + dx;
                                            let nY = Math.round(t.y) + dy;
                                            
                                            // TRAVA DE SEGURANÇA: Não deixa sair do grid
                                            nX = Math.max(0, Math.min(maxGridX - 1, nX));
                                            nY = Math.max(0, Math.min(maxGridY - 1, nY));

                                            updateTokenPosition(arenaId, id, nX, nY);
                                        }
                                    });
                                    
                                    // LIMPAR SELEÇÃO após o movimento para evitar "pulos" involuntários extras
                                    setSelectedIds([]);
                                }
                            } else {
                                // Clicou no vazio sem nada selecionado -> Limpa seleção
                                setSelectedIds([]);
                            }
                        } else {
                            // Seleção em Massa (Caixa)
                            const box = {
                                x: Math.min(startX, currentX),
                                y: Math.min(startY, currentY),
                                x2: Math.max(startX, currentX),
                                y2: Math.max(startY, currentY)
                            };
                            
                            const inBox = (mapState.tokens || []).filter(token => {
                                const tx = token.x * TILE_SIZE + TILE_SIZE / 2;
                                const ty = token.y * TILE_SIZE + TILE_SIZE / 2;
                                return tx >= box.x && tx <= box.x2 && ty >= box.y && ty <= box.y2;
                            }).map(t => t.id);
                            
                            if (inBox.length > 0) setSelectedIds(inBox);
                        }
                        
                        setDragStart(null);
                        setSelectionRect(null);
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                } else if (activeMode === 'NAVIGATE') {
                    // Modo Navegação: Arrastar a Câmera (Pan)
                    setIsPanning(true);
                    const startX = e.clientX - viewOffset.x;
                    const startY = e.clientY - viewOffset.y;

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        setViewOffset({
                            x: moveEvent.clientX - startX,
                            y: moveEvent.clientY - startY
                        });
                    };

                    const handleMouseUp = () => {
                        setIsPanning(false);
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                }
            }}
        >
            <motion.div
                className="absolute origin-top-left"
                animate={{ 
                    x: viewOffset.x, 
                    y: viewOffset.y,
                    scale: zoom
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
                {/* Camada de Imagem de Fundo (Se houver) */}
                {mapState.backgroundImageUrl && (
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={mapState.backgroundImageUrl} 
                            alt="Map Background" 
                            className="max-w-none origin-top-left"
                            style={{ 
                                opacity: 0.8, // Um pouco de transparência para ver o grid
                                transform: `translate(${mapState.backgroundImageSettings?.x || 0}px, ${mapState.backgroundImageSettings?.y || 0}px) scale(${mapState.backgroundImageSettings?.scale || 1})`
                            }}
                        />
                    </div>
                )}

                {/* Camada de Decals (Carimbos) */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {mapState.decals?.map((decal) => (
                        <div
                            key={decal.id}
                            className={`absolute flex items-center justify-center ${activeStamp ? 'pointer-events-none' : 'pointer-events-auto'} cursor-pointer`}
                            style={{ 
                                left: Math.floor(decal.x / TILE_SIZE) * TILE_SIZE, 
                                top: Math.floor(decal.y / TILE_SIZE) * TILE_SIZE,
                                width: TILE_SIZE,
                                height: TILE_SIZE,
                                fontSize: `${TILE_SIZE * 0.8}px`,
                                backgroundColor: decal.type === 'sea' ? 'rgba(30, 58, 138, 0.4)' : 'transparent',
                                borderRadius: '4px'
                            }}
                            onClick={(e) => {
                                if (isMaster && activeStamp === 'eraser') {
                                    e.stopPropagation(); // Evita colocar stamp por baixo ou mexer na névoa
                                    handleDraw(decal.x, decal.y);
                                }
                            }}
                        >
                            {decal.icon}
                        </div>
                    ))}
                </div>

                {/* O Grid do Mapa (Procedural ou Overlay) */}
                <div 
                    className="grid relative z-10"
                    style={{ 
                        gridTemplateColumns: `repeat(${grid.length > 0 ? grid[0].length : 40}, ${TILE_SIZE}px)`,
                        width: (grid.length > 0 ? grid[0].length : 40) * TILE_SIZE,
                        height: (grid.length > 0 ? grid.length : 40) * TILE_SIZE
                    }}
                    // Removido onClick global para usar eventos individuais por célula
                >
                    {grid.length > 0 ? grid.map((row, y) => (
                        row.map((tile, x) => {
                            const revealed = isCellRevealed(x, y);
                            return (
                                <div
                                    key={`${x}-${y}`}
                                    onMouseDown={() => {
                                        if (isMaster) {
                                            if (activeMode === 'STAMPS' && activeStamp) {
                                                setIsDrawing(true);
                                                handleDraw(x * TILE_SIZE, y * TILE_SIZE);
                                            } else if (activeMode === 'FOG') {
                                                setIsDrawing(true);
                                                toggleFogOfWar(arenaId, `${x},${y}`, !revealed);
                                            }
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if (isDrawing && isMaster) {
                                            if (activeMode === 'STAMPS') {
                                                handleDraw(x * TILE_SIZE, y * TILE_SIZE);
                                            } else if (activeMode === 'FOG') {
                                                toggleFogOfWar(arenaId, `${x},${y}`, !revealed);
                                            }
                                        }
                                    }}
                                    className={`relative w-[${TILE_SIZE}px] h-[${TILE_SIZE}px] border-[0.1px] border-white/5 ${getTerrainColor(tile.type)}`}
                                    style={{ width: TILE_SIZE, height: TILE_SIZE, cursor: activeMode === 'STAMPS' ? 'crosshair' : activeMode === 'FOG' ? 'cell' : 'pointer' }}
                                >
                                    {/* Artefakto/Feature */}
                                    {revealed && tile.feature && (
                                        <div className="absolute inset-0 flex items-center justify-center text-xl drop-shadow-lg">
                                            {getFeatureIcon(tile.feature)}
                                        </div>
                                    )}

                                    {/* Névoa de Guerra (Fog of War) */}
                                    {!revealed && (
                                        <div className={`absolute inset-0 ${isMaster ? 'bg-black/60 backdrop-blur-[1px]' : 'bg-black'} z-10 transition-colors duration-500`}>
                                            {isMaster && (
                                                <div className="w-full h-full flex items-center justify-center opacity-10">
                                                    <span className="text-[8px]">OMISSÃO</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )) : (
                        // Grid genérico se estiver usando apenas imagem de fundo
                        Array.from({ length: 40 * 40 }).map((_, i) => {
                            const x = i % 40;
                            const y = Math.floor(i / 40);
                            const revealed = isCellRevealed(x, y);
                            return (
                                <div
                                    key={`${x}-${y}`}
                                    onMouseDown={() => {
                                        if (isMaster) {
                                            if (activeMode === 'STAMPS' && activeStamp) {
                                                setIsDrawing(true);
                                                handleDraw(x * TILE_SIZE, y * TILE_SIZE);
                                            } else if (activeMode === 'FOG') {
                                                setIsDrawing(true);
                                                toggleFogOfWar(arenaId, `${x},${y}`, !revealed);
                                            }
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if (isDrawing && isMaster) {
                                            if (activeMode === 'STAMPS') {
                                                handleDraw(x * TILE_SIZE, y * TILE_SIZE);
                                            } else if (activeMode === 'FOG') {
                                                toggleFogOfWar(arenaId, `${x},${y}`, !revealed);
                                            }
                                        }
                                    }}
                                    className="relative border-[0.1px] border-white/10"
                                    style={{ width: TILE_SIZE, height: TILE_SIZE, cursor: activeMode === 'STAMPS' ? 'crosshair' : activeMode === 'FOG' ? 'cell' : 'pointer' }}
                                >
                                    {!revealed && (
                                        <div className={`absolute inset-0 ${isMaster ? 'bg-black/80' : 'bg-black'} z-10`} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Camada de Tokens */}
                <div className="absolute inset-0 pointer-events-none z-20">
                    <AnimatePresence>
                        {mapState.tokens?.map((token) => (
                            <motion.div
                                key={token.id}
                                onClick={(e) => {
                                    if (activeMode === 'TOKENS') {
                                        e.stopPropagation();
                                        if (e.shiftKey) {
                                            setSelectedIds(prev => prev.includes(token.id) ? prev.filter(id => id !== token.id) : [...prev, token.id]);
                                        } else {
                                            setSelectedIds([token.id]);
                                        }
                                    }
                                }}
                                animate={{ 
                                    x: Math.round(token.x) * TILE_SIZE, 
                                    y: Math.round(token.y) * TILE_SIZE 
                                }}
                                transition={{ duration: 0.1 }} 
                                className={`absolute flex items-center justify-center pointer-events-auto cursor-pointer token-unit group
                                    ${selectedIds.includes(token.id) ? 'z-30' : 'z-20'}`}
                                style={{ width: TILE_SIZE, height: TILE_SIZE }}
                            >
                                {/* Círculo do Personagem perfeitamente centralizado */}
                                <div className={`w-[50px] h-[50px] rounded-full border-2 flex items-center justify-center shadow-2xl transition-all duration-300
                                    ${selectedIds.includes(token.id) ? 'scale-110 ring-4 ring-rpg-gold/50 border-white shadow-glow-gold' : 'border-current'}
                                    ${token.type === 'hero' ? 'border-rpg-gold bg-blue-900/80 shadow-glow-blue/20' : 'border-rpg-red bg-red-900/80 shadow-glow-red/20'}`}
                                >
                                    <span className="text-white text-xl">{token.icon || (token.type === 'hero' ? '👤' : '👹')}</span>
                                </div>
                                
                                {/* Nome do Combatente */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                                    {token.name}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Caixa de Seleção Visual */}
            {selectionRect && (
                <div 
                    className="absolute border-2 border-rpg-gold bg-rpg-gold/20 pointer-events-none z-[60]"
                    style={{
                        left: selectionRect.x * zoom + viewOffset.x,
                        top: selectionRect.y * zoom + viewOffset.y,
                        width: selectionRect.w * zoom,
                        height: selectionRect.h * zoom
                    }}
                />
            )}

            {/* Toolbar Principal do Mestre (Lateral Esquerda) */}
            {isMaster && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 bg-rpg-dark/95 border border-rpg-gold/20 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
                    <button 
                        onClick={() => setActiveMode('NAVIGATE')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeMode === 'NAVIGATE' ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold' : 'hover:bg-white/10 text-rpg-grey'}`}
                        title="Navegação (Mover Câmera)"
                    >🖱️</button>
                    <button 
                        onClick={() => setActiveMode('TOKENS')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeMode === 'TOKENS' ? 'bg-blue-600 text-white shadow-glow-blue' : 'hover:bg-white/10 text-rpg-grey'}`}
                        title="Tokens (Mover Personagens)"
                    >👤</button>
                    <button 
                        onClick={() => setActiveMode('FOG')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeMode === 'FOG' ? 'bg-purple-600 text-white shadow-glow-purple' : 'hover:bg-white/10 text-rpg-grey'}`}
                        title="Névoa de Guerra (Revelar/Esconder)"
                    >🌫️</button>
                    <button 
                        onClick={() => setActiveMode('STAMPS')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeMode === 'STAMPS' ? 'bg-emerald-600 text-white shadow-glow-emerald' : 'hover:bg-white/10 text-rpg-grey'}`}
                        title="Decals e Carimbos (Desenhar)"
                    >🎨</button>
                    <button 
                        onClick={() => setActiveMode('CALIBRATE')}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${activeMode === 'CALIBRATE' ? 'bg-orange-600 text-white shadow-glow-orange' : 'hover:bg-white/10 text-rpg-grey'}`}
                        title="Ajustar Imagem (Calibragem)"
                    >⚙️</button>
                </div>
            )}

            {/* Sub-Toolbar: Carimbos (Aberto quando STAMPS está ativo) */}
            {isMaster && activeMode === 'STAMPS' && (
                <div className="absolute left-24 top-1/2 -translate-y-1/2 z-50 bg-rpg-dark/95 border border-rpg-gold/20 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-72 animate-fade-right">
                    <div className="text-[10px] text-rpg-gold font-cinzel font-bold text-center uppercase tracking-widest mb-4 border-b border-rpg-gold/10 pb-2">Biblioteca de Objetos</div>
                    <div className="grid grid-cols-4 gap-2 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {STAMPS.map(stamp => (
                            <button
                                key={stamp.id}
                                onClick={() => setActiveStamp(stamp.id)}
                                className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-all ${activeStamp === stamp.id ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold' : 'bg-black/40 border-white/5 hover:border-white/20 text-rpg-grey'}`}
                            >
                                <span className="text-xl mb-1">{stamp.icon}</span>
                                <span className="text-[8px] uppercase font-bold truncate w-full px-1">{stamp.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setActiveStamp('eraser')}
                        className={`w-full py-2 rounded-lg border font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeStamp === 'eraser' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-stone-800 border-white/5 text-rpg-grey shadow-lg'}`}
                    >
                        <span>🧹 Borracha de Carimbo</span>
                    </button>
                </div>
            )}

            {/* Sub-Toolbar: Névoa de Guerra (Aberto quando FOG está ativo) */}
            {isMaster && activeMode === 'FOG' && (
                <div className="absolute left-24 top-1/2 -translate-y-1/2 z-50 bg-rpg-dark/95 border border-purple-500/20 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-64 animate-fade-right">
                    <div className="text-[10px] text-purple-400 font-cinzel font-bold text-center uppercase tracking-widest mb-4 border-b border-purple-500/10 pb-2">Controle de Névoa</div>
                    <div className="flex flex-col gap-2">
                        <button 
                            className="bg-purple-900/40 hover:bg-purple-800/60 text-purple-100 font-bold text-[10px] py-3 rounded uppercase tracking-widest border border-purple-500/30 transition-all"
                            onClick={async () => {
                                if (confirm('Esconder todo o mapa com a névoa?')) {
                                    const mapRef = doc(db, 'battle_maps', arenaId);
                                    await updateDoc(mapRef, { fogOfWar: [], lastUpdated: Date.now() });
                                }
                            }}
                        >🌑 Esconder Tudo</button>
                        <button 
                            className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 font-bold text-[10px] py-3 rounded uppercase tracking-widest border border-emerald-500/30 transition-all"
                            onClick={async () => {
                                if (confirm('Revelar todo o mapa para os jogadores?')) {
                                    const allCells = [];
                                    const { width, height } = JSON.parse(mapState.mapData || '{"width":20,"height":20}');
                                    for(let x=0; x<width; x++) for(let y=0; y<height; y++) allCells.push(`${x},${y}`);
                                    const mapRef = doc(db, 'battle_maps', arenaId);
                                    await updateDoc(mapRef, { fogOfWar: allCells, lastUpdated: Date.now() });
                                }
                            }}
                        >☀️ Revelar Tudo</button>
                    </div>
                </div>
            )}

            {/* Painel Lateral Direito (Configurações e Sinais) */}
            {isMaster && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 bg-rpg-dark/95 border border-rpg-gold/20 p-5 rounded-2xl shadow-2xl backdrop-blur-md w-60">
                    <div className="flex flex-col gap-3">
                        <div className="text-[10px] text-rpg-gold font-cinzel font-bold text-center uppercase tracking-widest mb-1 border-b border-rpg-gold/10 pb-2">Sincronização</div>
                        <button 
                            className="bg-orange-900 hover:bg-orange-800 text-white font-bold text-[10px] py-2.5 rounded uppercase tracking-widest"
                            onClick={() => {
                                updateViewSettings(arenaId, {
                                    ...mapState.viewSettings,
                                    zoom: zoom,
                                    offsetX: viewOffset.x,
                                    offsetY: viewOffset.y
                                });
                            }}
                        >
                            📍 Sincronizar Visão
                        </button>
                        <button 
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-2.5 rounded uppercase tracking-widest"
                            onClick={async () => {
                                const mapRef = doc(db, 'battle_maps', arenaId);
                                const currentTokens = mapState.tokens || [];
                                const newTokens = combatants.map(c => {
                                    const existing = currentTokens.find(t => t.combatantId === c.id);
                                    if (existing) return existing;
                                    return {
                                        id: `token-${c.id}-${Date.now()}`,
                                        combatantId: c.id,
                                        name: c.name,
                                        type: c.type === 'monster' ? 'monster' as const : 'hero' as const,
                                        x: Math.round(5 + Math.random() * 5),
                                        y: Math.round(5 + Math.random() * 5),
                                        icon: c.type === 'monster' ? '👹' : '👤'
                                    };
                                });
                                await updateDoc(mapRef, { tokens: newTokens });
                            }}
                        >
                            👥 Sincronizar Tokens
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <div className="text-[10px] text-rpg-gold font-cinzel font-bold text-center uppercase tracking-widest mb-1 border-b border-rpg-gold/10 pb-2">Utilidades</div>
                        <div className="flex gap-2">
                            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="flex-1 bg-black/40 hover:bg-black/60 text-rpg-gold py-2 rounded font-bold border border-rpg-gold/20 flex items-center justify-center">➖</button>
                            <button onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="flex-1 bg-black/40 hover:bg-black/60 text-rpg-gold py-2 rounded font-bold border border-rpg-gold/20 flex items-center justify-center">➕</button>
                        </div>
                        <button 
                            className="bg-red-900/40 hover:bg-red-800/60 text-red-500 font-bold text-[10px] py-2.5 rounded uppercase tracking-widest border border-red-500/20"
                            onClick={async () => {
                                if (confirm('Tem certeza que deseja limpar o mapa atual?')) {
                                    const mapRef = doc(db, 'battle_maps', arenaId);
                                    await updateDoc(mapRef, { 
                                        mapData: null, 
                                        backgroundImageUrl: '', 
                                        decals: [], 
                                        fogOfWar: [],
                                        lastUpdated: Date.now() 
                                    });
                                }
                            }}
                        >
                            🗑️ Resetar Mapa
                        </button>
                    </div>
                </div>
            )}

            {/* Painel de Calibragem (Específico do modo) */}
            {isMaster && activeMode === 'CALIBRATE' && mapState.backgroundImageUrl && (
                <div className="absolute right-72 top-1/2 -translate-y-1/2 z-50 bg-rpg-dark/95 border border-orange-500/40 p-5 rounded-2xl shadow-2xl backdrop-blur-md w-72 animate-fade-left">
                    <div className="text-[10px] text-orange-400 font-cinzel font-bold text-center uppercase tracking-widest mb-4 border-b border-orange-500/10 pb-2">Calibragem do Mapa</div>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[10px] text-rpg-grey uppercase font-bold">
                                <span>Escala (Tamanho)</span>
                                <span className="text-orange-400">{(mapState.backgroundImageSettings?.scale || 1).toFixed(2)}x</span>
                            </div>
                            <input 
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.01"
                                value={mapState.backgroundImageSettings?.scale || 1}
                                onChange={(e) => {
                                    const settings = mapState.backgroundImageSettings || { scale: 1, x: 0, y: 0 };
                                    updateImageSettings(arenaId, { ...settings, scale: parseFloat(e.target.value) });
                                }}
                                className="w-full accent-orange-500 bg-black/40 rounded-lg h-1 appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-orange-400 font-bold uppercase mb-1">Arraste a imagem</p>
                            <p className="text-[9px] text-rpg-grey leading-tight">Clique e segure para alinhar a posição com o grid</p>
                        </div>

                        <button 
                            onClick={() => updateImageSettings(arenaId, { scale: 1, x: 0, y: 0 })}
                            className="bg-stone-800 hover:bg-stone-700 text-white text-[9px] font-bold py-2 rounded uppercase border border-white/5"
                        >
                            Resetar Alinhamento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
