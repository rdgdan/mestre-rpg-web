import { NextRequest, NextResponse } from 'next/server';

const FIVETOOLS_BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data';

async function fetchJson(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Aviso: Não foi possível buscar de ${url}. Status: ${response.status}`);
            return null;
        }
        return response.json();
    } catch (e) {
        console.error(`Erro ao buscar ${url}:`, e);
        return null;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // spells, classes, races, backgrounds, items, monsters, rules

    if (!type) {
        return NextResponse.json({ error: 'Tipo é obrigatório' }, { status: 400 });
    }

    try {
        console.log(`Buscando ${type} do 5etools (Full Version)...`);

        let items: any[] = [];

        switch (type) {
            case 'spells':
                const spellData = await fetchJson(`${FIVETOOLS_BASE}/spells/spells-phb.json`);
                items = spellData?.spell || [];
                break;

            case 'classes':
            case 'monsters': {
                const folder = type === 'classes' ? 'class' : 'bestiary';
                const prop = type === 'classes' ? 'class' : 'monster';
                const indexData = await fetchJson(`${FIVETOOLS_BASE}/${folder}/index.json`);

                if (indexData) {
                    const fileKeys = Object.values(indexData) as string[];
                    // Limitar a buscar apenas os primeiros arquivos para não estourar tempo/limite na prévia
                    // No caso de classes são poucos (15), no de monstros são muitos.
                    const filesToFetch = type === 'classes' ? fileKeys : fileKeys.slice(0, 3);

                    const promises = filesToFetch.map(file => fetchJson(`${FIVETOOLS_BASE}/${folder}/${file}`));
                    const results = await Promise.all(promises);
                    items = results
                        .filter(r => r && r[prop])
                        .flatMap(r => r[prop]);
                }
                break;
            }

            case 'races':
                const racesData = await fetchJson(`${FIVETOOLS_BASE}/races.json`);
                items = racesData?.race || [];
                break;

            case 'items':
                const itemsData = await fetchJson(`${FIVETOOLS_BASE}/items.json`);
                items = itemsData?.item || itemsData?.baseitem || [];
                break;

            case 'rules':
                const rulesData = await fetchJson(`${FIVETOOLS_BASE}/variantrules.json`);
                items = rulesData?.variantrule || [];
                break;

            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        // Limitar a 150 itens para a prévia (ajudando a performance do grid)
        const limitedItems = items.slice(0, 150);

        console.log(`${limitedItems.length} itens carregados do tipo "${type}"`);

        return NextResponse.json({
            count: limitedItems.length,
            items: limitedItems,
            source: '5etools'
        });
    } catch (error: any) {
        console.error('Erro ao buscar do 5etools:', error);
        return NextResponse.json({
            error: `Erro ao buscar dados: ${error.message}`
        }, { status: 500 });
    }
}
