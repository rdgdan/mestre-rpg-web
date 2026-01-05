import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://www.dnd5eapi.co/api';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // spells, monsters, equipment, classes

    if (!type) {
        return NextResponse.json({ error: 'Tipo é obrigatório' }, { status: 400 });
    }

    try {
        console.log(`Buscando ${type} da API D&D 5e...`);

        // Buscar lista de itens
        const listResponse = await fetch(`${API_BASE}/${type}`);
        const listData = await listResponse.json();

        const items = [];
        const results = listData.results || [];

        // Limitar a 50 itens para não sobrecarregar
        const itemsToFetch = results.slice(0, 50);

        console.log(`Encontrados ${results.length} itens, buscando detalhes de ${itemsToFetch.length}...`);

        // Buscar detalhes de cada item
        for (const item of itemsToFetch) {
            try {
                const detailResponse = await fetch(`${API_BASE}${item.url}`);
                const detail = await detailResponse.json();
                items.push(detail);
            } catch (error) {
                console.error(`Erro ao buscar ${item.name}:`, error);
            }
        }

        console.log(`${items.length} itens carregados com sucesso`);

        return NextResponse.json({
            count: items.length,
            total: results.length,
            items: items
        });
    } catch (error: any) {
        console.error('Erro ao buscar da API:', error);
        return NextResponse.json({
            error: `Erro ao buscar dados: ${error.message}`
        }, { status: 500 });
    }
}
