
export type MapMode = 'WORLD' | 'CITY' | 'DUNGEON';

export type TerrainType = 
    // World
    | 'water' | 'grass' | 'forest' | 'mountain' | 'sand' | 'dark' | 'snow'
    // City
    | 'street' | 'plaza' | 'house' | 'roof' | 'wall' | 'park'
    // Dungeon
    | 'floor' | 'void' | 'lava' | 'wood-floor';

export type FeatureType = 
    // World Markers
    | 'city' | 'dungeon' | 'ruins' | 'tower' | 'shrine' | 'cave' 
    // City Markers
    | 'tavern' | 'shop' | 'blacksmith' | 'temple' | 'palace' | 'guard'
    // Dungeon Markers
    | 'chest' | 'trap' | 'monster' | 'boss' | 'stairs_down' | 'stairs_up'
    | null;

export interface TileData {
    type: TerrainType;
    feature: FeatureType;
    variation: number; // 0-3 for pattern variation
}

export interface POI {
    id: string;
    name: string;
    description: string;
    type: string;
    grid: string; // "X:23, Y:12"
    x: number;
    y: number;
}

export interface MapData {
    mode: MapMode;
    title: string;
    regionType: string;
    mastersVoice: string;
    sensory: { smell: string; sound: string; climate: string };
    rumors: string[];
    grid: TileData[][]; 
    pois: POI[];
}

const GRID_SIZE = 50;

function randomItem<T>(arr: T[] | readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- DETECTION LOGIC ---

function detectMode(text: string): MapMode {
    const t = text.toLowerCase();
    
    const cityKeywords = ['cidade', 'vila', 'aldeia', 'burgo', 'capital', 'ruas', 'casas', 'porto', 'muralha', 'prédios'];
    const dungeonKeywords = ['masmorra', 'caverna', 'tumba', 'cripta', 'labirinto', 'subterraneo', 'ruina', 'templo', 'esgoto', 'sala', 'corredor'];
    
    if (dungeonKeywords.some(k => t.includes(k))) return 'DUNGEON';
    if (cityKeywords.some(k => t.includes(k))) return 'CITY';
    
    return 'WORLD';
}

// --- GENERATORS ---

function generateDungeonMap(description: string, titleBase: string): MapData {
    // 1. Fill with Void (Solid Rock)
    const grid: TileData[][] = Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => ({ type: 'void', feature: null, variation: 0 }))
    );

    const rooms: {x:number, y:number, w:number, h:number}[] = [];
    const numRooms = 15 + Math.floor(Math.random() * 10);

    // 2. Dig Rooms
    for(let i=0; i<numRooms; i++) {
        const w = 4 + Math.floor(Math.random() * 8);
        const h = 4 + Math.floor(Math.random() * 8);
        const x = Math.floor(Math.random() * (GRID_SIZE - w - 2)) + 1;
        const y = Math.floor(Math.random() * (GRID_SIZE - h - 2)) + 1;
        
        // Simple overlapping check allowed for complex dungeons, or prevent it?
        // Let's allow simple overlap to create complex shapes
        
        for(let ry=y; ry<y+h; ry++) {
            for(let rx=x; rx<x+w; rx++) {
                grid[ry][rx].type = 'floor';
            }
        }
        rooms.push({x, y, w, h});
    }

    // 3. Connect Rooms (Corridors)
    for(let i=0; i<rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i+1];

        const cx1 = Math.floor(r1.x + r1.w/2);
        const cy1 = Math.floor(r1.y + r1.h/2);
        const cx2 = Math.floor(r2.x + r2.w/2);
        const cy2 = Math.floor(r2.y + r2.h/2);

        // Horizontal then Vertical
        if(Math.random() > 0.5) {
             for(let x=Math.min(cx1, cx2); x<=Math.max(cx1, cx2); x++) grid[cy1][x].type = 'floor';
             for(let y=Math.min(cy1, cy2); y<=Math.max(cy1, cy2); y++) grid[y][cx2].type = 'floor';
        } else {
             for(let y=Math.min(cy1, cy2); y<=Math.max(cy1, cy2); y++) grid[y][cx1].type = 'floor';
             for(let x=Math.min(cx1, cx2); x<=Math.max(cx1, cx2); x++) grid[cy2][x].type = 'floor';
        }
    }

    // 4. Features
    rooms.forEach(room => {
        if(Math.random() > 0.6) {
             // Center of room
             const cx = Math.floor(room.x + room.w/2);
             const cy = Math.floor(room.y + room.h/2);
             grid[cy][cx].feature = randomItem(['chest', 'trap', 'monster', 'boss'] as FeatureType[]);
        }
    });

    // Start/End
    const startRoom = rooms[0];
    grid[Math.floor(startRoom.y + startRoom.h/2)][Math.floor(startRoom.x + startRoom.w/2)].feature = 'stairs_up';
    
    const endRoom = rooms[rooms.length-1];
    grid[Math.floor(endRoom.y + endRoom.h/2)][Math.floor(endRoom.x + endRoom.w/2)].feature = 'stairs_down';

    return {
        mode: 'DUNGEON',
        title: `${titleBase} (Subterrâneo)`,
        regionType: 'Masmorra',
        mastersVoice: `O ar é pesado e úmido. ${description}`,
        sensory: {
            smell: "Mofo e sangue antigo",
            sound: "Goteiras e ecos distantes",
            climate: "Frio e úmido"
        },
        rumors: ["Dizem que o chefe guarda uma chave mágica."],
        grid,
        pois: rooms.slice(0, 5).map((r, i) => ({
             id: `room-${i}`,
             name: `Sala ${i+1}`,
             description: "Uma câmara escura.",
             type: 'perigo',
             grid: `X:${r.x} Y:${r.y}`,
             x: r.x + 2,
             y: r.y + 2
        }))
    };
}

function generateCityMap(description: string, titleBase: string): MapData {
    // 1. Fill base
    const grid: TileData[][] = Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => ({ type: 'grass', feature: null, variation: 0 }))
    );

    const desc = description.toLowerCase();

    // WATER DETECTION (River, Coast, Lake)
    let waterSide = 'NONE'; 
    if (desc.includes('rio')) {
        waterSide = Math.random() > 0.5 ? 'CENTER_H' : 'CENTER_V';
    } else if (/porto|mar|costa|costeiro|costeira|cais|lago|baía|praia|litoral|navio|pesca/.test(desc)) {
        waterSide = randomItem(['LEFT', 'RIGHT', 'BOTTOM', 'TOP']);
    }

    // Fill Water Area & Coastline
    if (waterSide !== 'NONE') {
        const riverWidth = 4;
        const coastSize = Math.floor(GRID_SIZE * 0.25);

        for(let y=0; y<GRID_SIZE; y++) for(let x=0; x<GRID_SIZE; x++) {
            let isWater = false;
            // Coastal logic
            if (waterSide === 'BOTTOM' && y > GRID_SIZE - coastSize) isWater = true;
            if (waterSide === 'TOP' && y < coastSize) isWater = true;
            if (waterSide === 'LEFT' && x < coastSize) isWater = true;
            if (waterSide === 'RIGHT' && x > GRID_SIZE - coastSize) isWater = true;
            
            // River logic
            if (waterSide === 'CENTER_V' && Math.abs(x - GRID_SIZE/2) < riverWidth) isWater = true;
            if (waterSide === 'CENTER_H' && Math.abs(y - GRID_SIZE/2) < riverWidth) isWater = true;

            if (isWater) {
                grid[y][x].type = 'water';
            } 
        }

        // Apply Sand/Beach Buffer & Piers
        const tempGrid = JSON.parse(JSON.stringify(grid));
        for(let y=0; y<GRID_SIZE; y++) for(let x=0; x<GRID_SIZE; x++) {
            if (grid[y][x].type !== 'water') {
                // Check neighbors for water
                let nearWater = false;
                const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
                for(let d of dirs) {
                    const ny = y+d[0], nx = x+d[1];
                    if(ny>=0 && ny<GRID_SIZE && nx>=0 && nx<GRID_SIZE && tempGrid[ny][nx].type === 'water') {
                        nearWater = true;
                    }
                }
                
                if (nearWater) {
                    // Turn to sand (beach) or wood-floor (pier)
                    if (Math.random() > 0.3) {
                        grid[y][x].type = 'sand';
                    } else {
                        // Create Pier extending into water
                        grid[y][x].type = 'wood-floor'; 
                        
                        // Extend pier 3-5 blocks into water
                        let px = x, py = y;
                        let dx = 0, dy = 0;
                        if(waterSide === 'LEFT') dx = -1;
                        if(waterSide === 'RIGHT') dx = 1;
                        if(waterSide === 'TOP') dy = -1;
                        if(waterSide === 'BOTTOM') dy = 1;

                        // For rivers, simple check neighbor
                        if(waterSide.includes('CENTER')) {
                            // Find water dir
                            for(let d of dirs) {
                                if (tempGrid[y+d[0]]?.[x+d[1]]?.type === 'water') { dy=d[0]; dx=d[1]; break; }
                            }
                        }

                        if(dx !== 0 || dy !== 0) {
                            const pierLen = 3 + Math.floor(Math.random()*4);
                            for(let k=1; k<=pierLen; k++) {
                                if(grid[py+dy*k]?.[px+dx*k]) {
                                    grid[py+dy*k][px+dx*k].type = 'wood-floor';
                                }
                            }
                            // Add a ship maybe? (visual feature only available on water?)
                            // grid[py+dy*pierLen][px+dx*pierLen].feature = 'ship'; // (If we had ship feature)
                        }
                    }
                }
            }
        }
    }

    // DETERMINE CITY LAYOUT (Grid, Ring, Organic)
    const layout = randomItem(['GRID', 'ORGANIC']);

    // 2. Generate Streets based on Layout
    const mid = GRID_SIZE/2;

    if (layout === 'GRID') {
        // Grid System
        const blockSize = 6 + Math.floor(Math.random()*4);
        for(let i=0; i<GRID_SIZE; i++) {
             // Main intersection always exists
             // Check if we are overwriting water
             if (grid[Math.floor(mid)][i].type !== 'water') grid[Math.floor(mid)][i].type = 'street';
             if (grid[i][Math.floor(mid)].type !== 'water') grid[i][Math.floor(mid)].type = 'street';

             // Parallel Streets
             if (i % blockSize === 0) {
                 for(let k=0; k<GRID_SIZE; k++) {
                     if(grid[i][k].type !== 'water') grid[i][k].type = 'street'; // Horz
                     if(grid[k][i].type !== 'water') grid[k][i].type = 'street'; // Vert
                 }
             }
        }
    } else {
        // ORGANIC / CHAOTIC
        for(let i=0; i<GRID_SIZE; i++) {
            if(grid[Math.floor(mid)][i].type !== 'water') grid[Math.floor(mid)][i].type = 'street';
            if(grid[i][Math.floor(mid)].type !== 'water') grid[i][Math.floor(mid)].type = 'street';
        }

        const numStreets = 15;
        for(let i=0; i<numStreets; i++) {
            let cx = Math.floor(mid);
            let cy = Math.floor(mid);
            for(let s=0; s<150; s++) {
                const dir = Math.floor(Math.random()*4);
                if(dir===0) cx++; else if(dir===1) cx--; else if(dir===2) cy++; else cy--;
                
                if(cx>1 && cx<GRID_SIZE-1 && cy>1 && cy<GRID_SIZE-1) {
                    if(grid[cy][cx].type !== 'water') grid[cy][cx].type = 'street';
                }
            }
        }
    }
    
    // 3. Fill blocks with Houses
    for(let y=1; y<GRID_SIZE-1; y++) for(let x=1; x<GRID_SIZE-1; x++) {
         if((grid[y][x].type === 'grass' || grid[y][x].type === 'sand') && Math.random() > 0.2) {
             let hasStreet = false;
             // Check 4 neighbors
             if(grid[y+1][x].type==='street' || grid[y+1][x].type==='wood-floor') hasStreet=true;
             if(grid[y-1][x].type==='street' || grid[y-1][x].type==='wood-floor') hasStreet=true;
             if(grid[y][x+1].type==='street' || grid[y][x+1].type==='wood-floor') hasStreet=true;
             if(grid[y][x-1].type==='street' || grid[y][x-1].type==='wood-floor') hasStreet=true;

             if(hasStreet) {
                 grid[y][x].type = 'roof';
             }
         }
    }

    // 4. Place Special Buildings
    const buildings = ['tavern', 'temple', 'blacksmith', 'shop', 'palace'];
    let placed = 0;
    while(placed < 5) {
        let rx = Math.floor(Math.random()*(GRID_SIZE-4))+2;
        let ry = Math.floor(Math.random()*(GRID_SIZE-4))+2;
        if(grid[ry][rx].type === 'roof') {
            grid[ry][rx].feature = randomItem(['tavern', 'temple', 'blacksmith', 'shop'] as FeatureType[]);
            grid[ry][rx].type = 'plaza'; // Clear space for it
            placed++;
        }
    }

    // 5. Walls?
    // If user asked for "walled city", do boundaries. For now, open village.

    return {
        mode: 'CITY',
        title: `Cidade de ${titleBase}`,
        regionType: 'Assentamento Urbano',
        mastersVoice: `As ruas movimentadas de ${titleBase}. ${description}`,
        sensory: {
            smell: "Pão assado e fumaça de chaminé",
            sound: "Vozes de mercadores e cascos de cavalos",
            climate: "Agradável e urbano"
        },
        rumors: ["O ferreiro está forjando algo proibido."],
        grid,
        pois: []
    }
}

function generateWorldMap(description: string, titleBase: string): MapData {
    // 1. Setup Grid
     const grid: TileData[][] = Array(GRID_SIZE).fill(null).map(() => 
        Array(GRID_SIZE).fill(null).map(() => ({ type: 'water', feature: null, variation: Math.floor(Math.random() * 4) }))
    );

    // 2. Select Theme & Generate Terrain (Cellular Automata / Growth)
    const themes = ['ocean', 'archipelago', 'continent', 'valley', 'desert', 'tundra'];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    
    if (theme === 'ocean' || theme === 'archipelago') {
        const numIslands = theme === 'ocean' ? 3 : 12;
        
        for(let k=0; k<numIslands; k++) {
            let cx = Math.floor(Math.random() * (GRID_SIZE-4)) + 2;
            let cy = Math.floor(Math.random() * (GRID_SIZE-4)) + 2;
            
            grid[cy][cx].type = 'mountain';
            const islandSize = 100 + Math.floor(Math.random() * 200); 

            for(let r=0; r<islandSize; r++) { 
                if(Math.random() > 0.5) cx += Math.floor(Math.random()*3)-1;
                else cy += Math.floor(Math.random()*3)-1;
                
                if(cx >=1 && cx < GRID_SIZE-1 && cy >=1 && cy < GRID_SIZE-1) {
                    if(grid[cy][cx].type === 'water') {
                        grid[cy][cx].type = Math.random() > 0.4 ? 'grass' : 'sand';
                    } else if (grid[cy][cx].type === 'grass' && Math.random() > 0.7) {
                        grid[cy][cx].type = 'forest';
                    }
                } else {
                    cx = Math.floor(GRID_SIZE/2);
                    cy = Math.floor(GRID_SIZE/2);
                }
            }
        }
    } else if (theme === 'desert') {
        for(let y=0; y<GRID_SIZE; y++) for(let x=0; x<GRID_SIZE; x++) grid[y][x].type = 'sand';
        const numOutcrops = 8;
        for(let i=0; i<numOutcrops; i++) {
             let mx = Math.floor(Math.random()*GRID_SIZE);
             let my = Math.floor(Math.random()*GRID_SIZE);
             const size = 10 + Math.floor(Math.random() * 30);
             for(let j=0; j<size; j++) {
                 if(mx>=0 && mx<GRID_SIZE && my>=0 && my<GRID_SIZE) grid[my][mx].type = 'mountain';
                 mx += Math.floor(Math.random()*3)-1;
                 my += Math.floor(Math.random()*3)-1;
             }
        }
    } else {
        // Continent/Valley/Tundra
        for(let y=0; y<GRID_SIZE; y++) for(let x=0; x<GRID_SIZE; x++) {
             const noise = Math.random();
             grid[y][x].type = theme === 'tundra' ? (noise > 0.45 ? 'snow' : 'water') : (noise > 0.55 ? 'grass' : 'water');
        }
        for(let p=0; p<5; p++) {
            const tempGrid = JSON.parse(JSON.stringify(grid));
            for(let y=1; y<GRID_SIZE-1; y++) for(let x=1; x<GRID_SIZE-1; x++) {
                let waterCount = 0;
                let groundCount = 0;
                for(let ny=y-1; ny<=y+1; ny++) for(let nx=x-1; nx<=x+1; nx++) {
                    if(grid[ny][nx].type === 'water') waterCount++;
                    else groundCount++;
                }
                if(waterCount > 5) tempGrid[y][x].type = 'water';
                else if(groundCount > 5) tempGrid[y][x].type = (theme === 'tundra' ? 'snow' : 'grass');
            }
            for(let y=1; y<GRID_SIZE-1; y++) for(let x=1; x<GRID_SIZE-1; x++) grid[y][x].type = tempGrid[y][x].type;
        }
        for(let y=0; y<GRID_SIZE; y++) for(let x=0; x<GRID_SIZE; x++) {
             if(grid[y][x].type !== 'water') {
                 const n = Math.random();
                 const isTundra = theme === 'tundra';
                 if(n > 0.8) grid[y][x].type = 'mountain';
                 else if(n > 0.6) grid[y][x].type = 'forest';
             }
        }
    }

    // Features
    const numFeatures = 15;
    for(let i=0; i<numFeatures; i++) {
        let fx = Math.floor(Math.random() * GRID_SIZE);
        let fy = Math.floor(Math.random() * GRID_SIZE);
        if(grid[fy][fx].feature) continue;
        if (grid[fy][fx].type !== 'water') {
            grid[fy][fx].feature = randomItem(['city', 'tower', 'ruins', 'dungeon', 'shrine', 'cave'] as FeatureType[]);
        }
    }
    
    return {
        mode: 'WORLD',
        title: titleBase,
        regionType: 'Mundo Aberto',
        mastersVoice: `Um vasto território selvagem. ${description}`,
        sensory: { smell: "Natureza selvagem", sound: "Vento e animais", climate: "Variável" },
        rumors: ["Exploradores nunca retornam daqui."],
        grid,
        pois: []
    }
}


export function generateProceduralMap(description: string): MapData {
    const mode = detectMode(description);
    
    // Generate Name (Fantasy Style)
    const syllables = ['Ar', 'Bor', 'Cal', 'Dan', 'El', 'Fey', 'Gor', 'Hal', 'Ian', 'Jar', 'Kor', 'Lor', 'Mor', 'Nia', 'Or', 'Pan', 'Quar', 'Ras', 'Sil', 'Tan', 'Ur', 'Val', 'Wol', 'Xan', 'Yr', 'Zen'];
    const endings = ['gard', 'ia', 'land', 'terra', 'heim', 'grad', 'ford', 'port', 'mont', 'vale', 'dor', 'th'];
    
    const name = randomItem(syllables) + randomItem(syllables).toLowerCase() + (Math.random() > 0.5 ? randomItem(endings) : '');

    if (mode === 'DUNGEON') return generateDungeonMap(description, name);
    if (mode === 'CITY') return generateCityMap(description, name);
    return generateWorldMap(description, name);
}
