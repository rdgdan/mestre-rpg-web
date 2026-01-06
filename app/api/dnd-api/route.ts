import { NextRequest, NextResponse } from 'next/server';

const FIVETOOLS_BASE = 'https://raw.githubusercontent.com/rpgnext/5etools-mirror-rpgnext/master/data';

// Lista de arquivos de magias para uma cobertura mais ampla
const SPELL_FILES = [
    'spells-phb.json', // Player's Handbook
    'spells-dmg.json', // Dungeon Master's Guide
    'spells-xge.json', // Xanathar's Guide to Everything
    'spells-tce.json', // Tasha's Cauldron of Everything
];

// Função para buscar e processar um único arquivo JSON
async function fetchJson(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        console.warn(`Aviso: Não foi possível buscar de ${url}. Status: ${response.status}`);
        return null; // Retorna nulo para ser filtrado depois
    }
    return response.json();
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // spells, classes, races, backgrounds, items, monsters

    if (!type) {
        return NextResponse.json({ error: 'Tipo é obrigatório' }, { status: 400 });
    }

    try {
        console.log(`Buscando TODOS os ${type} em português do 5etools (RPGNext)...`);

        let items: any[] = [];

        switch (type) {
            case 'spells':
                const spellPromises = SPELL_FILES.map(file => fetchJson(`${FIVETOOLS_BASE}/spells/${file}`));
                const spellResults = await Promise.all(spellPromises);
                items = spellResults
                    .filter(result => result && result.spell) // Filtra falhas e arquivos sem a propriedade 'spell'
                    .flatMap(result => result.spell);
                break;

            case 'classes':
            case 'monsters':
                const indexUrl = `${FIVETOOLS_BASE}/${type === 'classes' ? 'class' : 'bestiary'}/index.json`;
                const indexData = await fetchJson(indexUrl);
                if (indexData) {
                    const fileKeys = Object.values(indexData) as string[];
                    const filePromises = fileKeys.map(file => fetchJson(`${FIVETOOLS_BASE}/${type === 'classes' ? 'class' : 'bestiary'}/${file}`));
                    const fileResults = await Promise.all(filePromises);
                    const propName = type === 'classes' ? 'class' : 'monster';
                    items = fileResults
                        .filter(result => result && result[propName])
                        .flatMap(result => result[propName]);
                }
                break;

            case 'races':
            case 'items':
                const singleFileUrl = `${FIVETOOLS_BASE}/${type}.json`;
                const singleFileData = await fetchJson(singleFileUrl);
                if (singleFileData) {
                    if (type === 'races') items = singleFileData.race || [];
                    if (type === 'items') items = singleFileData.item || singleFileData.baseitem || [];
                }
                break;

            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }
        
        // Remove duplicadas pelo nome, caso existam entre diferentes arquivos
        const uniqueItems = Array.from(new Map(items.map(item => [item.name, item])).values());

        console.log(`${uniqueItems.length} itens únicos do tipo "${type}" carregados em português.`);

        return NextResponse.json({
            count: uniqueItems.length,
            items: uniqueItems,
            source: '5etools-rpgnext'
        });

    } catch (error: any) {
        console.error(`Erro ao processar a requisição para ${type}:`, error);
        return NextResponse.json({
            error: `Erro interno no servidor: ${error.message}`
        }, { status: 500 });
    }
}
