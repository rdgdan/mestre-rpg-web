import { doc, updateDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MapData } from './map-data';

export interface MapDecal {
    id: string;
    type: string; // 'house', 'wall', 'path', 'tree', etc.
    icon: string;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
}

export interface TokenPosition {
    id: string;
    combatantId: string;
    x: number; // Coordenada X no grid
    y: number; // Coordenada Y no grid
    name: string;
    type: 'hero' | 'monster' | 'npc';
    icon?: string;
}

export interface BattleMapState {
    id: string;
    mapData: string | null; // Agora é uma string JSON para evitar erro de nested arrays
    backgroundImageUrl?: string; // Para mapas customizados (imagem/PDF)
    tokens: TokenPosition[];
    decals: MapDecal[]; // Carimbos e decorações no mapa
    fogOfWar: string[]; 
    viewSettings: {
        zoom: number;
        offsetX: number;
        offsetY: number;
        gridOpacity: number;
        showGrid: boolean;
    };
    backgroundImageSettings?: {
        scale: number;
        x: number;
        y: number;
    };
    lastUpdated: number;
}

/**
 * Inicializa ou recupera o estado do Battle Map para uma Arena específica
 */
export async function getOrCreateBattleMap(arenaId: string, initialMap?: MapData): Promise<BattleMapState> {
    const mapRef = doc(db, 'battle_maps', arenaId);
    const snap = await getDoc(mapRef);

    if (snap.exists()) {
        const data = snap.data();
        return data as BattleMapState;
    }

    const newState: BattleMapState = {
        id: arenaId,
        mapData: initialMap ? JSON.stringify(initialMap) : null,
        backgroundImageUrl: '',
        tokens: [],
        decals: [],
        fogOfWar: [],
        viewSettings: {
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            gridOpacity: 0.2,
            showGrid: true
        },
        backgroundImageSettings: {
            scale: 1,
            x: 0,
            y: 0
        },
        lastUpdated: Date.now()
    };

    await setDoc(mapRef, newState);
    return newState;
}

/**
 * Atualiza a imagem de fundo do mapa
 */
export async function updateBackgroundImage(arenaId: string, url: string) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    await updateDoc(mapRef, {
        backgroundImageUrl: url,
        lastUpdated: Date.now()
    });
}

/**
 * Atualiza a posição de um token no mapa
 */
export async function updateTokenPosition(arenaId: string, tokenId: string, x: number, y: number) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    const snap = await getDoc(mapRef);
    if (!snap.exists()) return;

    const tokens = snap.data().tokens as TokenPosition[];
    const updatedTokens = tokens.map(t => t.id === tokenId ? { ...t, x, y } : t);

    await updateDoc(mapRef, {
        tokens: updatedTokens,
        lastUpdated: Date.now()
    });
}

/**
 * Atualiza a posição de múltiplos tokens no mapa em uma única transação
 */
export async function updateTokensPosition(arenaId: string, updates: { id: string, x: number, y: number }[]) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    const snap = await getDoc(mapRef);
    if (!snap.exists()) return;

    let tokens = snap.data().tokens as TokenPosition[];
    
    // Aplica todas as atualizações na mesma lista
    updates.forEach(update => {
        tokens = tokens.map(t => t.id === update.id ? { ...t, x: update.x, y: update.y } : t);
    });

    await updateDoc(mapRef, {
        tokens,
        lastUpdated: Date.now()
    });
}

/**
 * Revela ou esconde uma área na Névoa de Guerra
 */
export async function toggleFogOfWar(arenaId: string, cell: string, reveal: boolean) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    const snap = await getDoc(mapRef);
    if (!snap.exists()) return;

    const fogOfWar = snap.data().fogOfWar as string[];
    let newFog;
    if (reveal) {
        newFog = Array.from(new Set([...fogOfWar, cell]));
    } else {
        newFog = fogOfWar.filter(c => c !== cell);
    }

    await updateDoc(mapRef, {
        fogOfWar: newFog,
        lastUpdated: Date.now()
    });
}

/**
 * Atualiza as configurações de visualização (Zoom/Pan)
 */
export async function updateViewSettings(arenaId: string, settings: Partial<BattleMapState['viewSettings']>) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    const snap = await getDoc(mapRef);
    if (!snap.exists()) return;

    const currentSettings = snap.data().viewSettings;
    await updateDoc(mapRef, {
        viewSettings: { ...currentSettings, ...settings },
        lastUpdated: Date.now()
    });
}

/**
 * Adiciona ou remove um decal (carimbo) no mapa
 */
export async function updateDecals(arenaId: string, decals: MapDecal[]) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    await updateDoc(mapRef, {
        decals,
        lastUpdated: Date.now()
    });
}

/**
 * Atualiza as configurações de alinhamento da imagem de fundo (escala e deslocamento)
 */
export async function updateImageSettings(arenaId: string, settings: BattleMapState['backgroundImageSettings']) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    await updateDoc(mapRef, {
        backgroundImageSettings: settings,
        lastUpdated: Date.now()
    });
}

/**
 * Hook-like listener para mudanças no mapa (usado no componente React)
 */
export function listenToBattleMap(arenaId: string, callback: (state: BattleMapState) => void) {
    const mapRef = doc(db, 'battle_maps', arenaId);
    return onSnapshot(mapRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as BattleMapState);
        }
    });
}
