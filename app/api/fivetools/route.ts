import { NextRequest, NextResponse } from 'next/server';

const FIVETOOLS_BASE = 'https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // spells, classes, races, backgrounds, items

    if (!type) {
        return NextResponse.json({ error: 'Tipo é obrigatório' }, { status: 400 });
    }

    try {
        console.log(`Buscando ${type} do 5etools...`);

        let url = '';
        switch (type) {
            case 'spells':
                url = `${FIVETOOLS_BASE}/spells/spells-phb.json`;
                break;
            case 'classes':
                url = `${FIVETOOLS_BASE}/class/index.json`;
                break;
            case 'races':
                url = `${FIVETOOLS_BASE}/races.json`;
                break;
            case 'items':
                url = `${FIVETOOLS_BASE}/items.json`;
                break;
            case 'monsters':
                url = `${FIVETOOLS_BASE}/bestiary/index.json`;
                break;
            default:
                return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Erro ao buscar do 5etools: Status ${response.status}`);
            return NextResponse.json({ error: `Erro ao buscar dados do 5etools` }, { status: response.status });
        }
        const data = await response.json();

        // Extrair itens do formato 5etools
        let items = [];
        if (type === 'spells') {
            items = data.spell || [];
        } else if (type === 'classes') {
            items = data.class || [];
        } else if (type === 'races') {
            items = data.race || [];
        } else if (type === 'items') {
            items = data.item || data.baseitem || [];
        } else if (type === 'monsters') {
            items = data.monster || [];
        }

        // Limitar a 100 itens
        items = items.slice(0, 100);

        console.log(`${items.length} itens carregados do 5etools`);

        return NextResponse.json({
            count: items.length,
            items: items,
            source: '5etools'
        });
    } catch (error: any) {
        console.error('Erro ao buscar do 5etools:', error);
        return NextResponse.json({
            error: `Erro ao buscar dados: ${error.message}`
        }, { status: 500 });
    }
}
