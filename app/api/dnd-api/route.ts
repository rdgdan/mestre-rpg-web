import { NextRequest, NextResponse } from 'next/server';
import { translateSpells } from '@/lib/spell-translator';

const FIVETOOLS_BASE = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data';

// Lista de arquivos de magias para uma cobertura mais ampla
const SPELL_FILES = [
    'spells-phb.json',
    'spells-dmg.json',
    'spells-xge.json',
    'spells-tce.json',
    'spells-scag.json'
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
        console.log(`Buscando TODOS os ${type} do 5etools (Stable Mirror)...`);

        let items: any[] = [];

        switch (type) {
            case 'spells': {
                const spellPromises = SPELL_FILES.map(file => fetchJson(`${FIVETOOLS_BASE}/spells/${file}`));
                const spellResults = await Promise.all(spellPromises);
                items = spellResults
                    .filter(result => result && result.spell) // Filtra falhas e arquivos sem a propriedade 'spell'
                    .flatMap(result => result.spell);
                break;
            }

            case 'classes':
            case 'monsters': {
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
            }

            case 'races':
            case 'items':
            case 'equipment':
            case 'rules': {
                const singleFileUrl = type === 'rules'
                    ? `${FIVETOOLS_BASE}/variantrules.json`
                    : type === 'equipment'
                        ? `${FIVETOOLS_BASE}/items.json`
                        : `${FIVETOOLS_BASE}/${type}.json`;
                const singleFileData = await fetchJson(singleFileUrl);
                if (singleFileData) {
                    if (type === 'races') items = singleFileData.race || [];
                    if (type === 'items' || type === 'equipment') items = singleFileData.item || singleFileData.baseitem || [];
                    if (type === 'rules') items = singleFileData.variantrule || [];
                }
                break;
            }

            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        // Remove duplicadas pelo nome, caso existam entre diferentes arquivos
        const uniqueItems = Array.from(new Map(items.map(item => [item.name, item])).values());

        // Traduzir magias automaticamente se for tipo 'spells'
        let finalItems = uniqueItems;
        if (type === 'spells') {
            finalItems = translateSpells(uniqueItems);
            console.log(`${finalItems.length} magias traduzidas automaticamente!`);
        }

        console.log(`${finalItems.length} itens únicos do tipo "${type}" carregados.`);

        return NextResponse.json({
            count: finalItems.length,
            items: finalItems,
            source: '5etools-rpgnext'
        });

    } catch (error: any) {
        console.error(`Erro ao processar a requisição para ${type}:`, error);
        return NextResponse.json({
            error: `Erro interno no servidor: ${error.message}`
        }, { status: 500 });
    }
}
