import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const booksPath = path.join(process.cwd(), 'books');

        if (!fs.existsSync(booksPath)) {
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(booksPath);
        const pdfs = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        return NextResponse.json(pdfs);
    } catch (error) {
        console.error('Erro ao listar livros:', error);
        return NextResponse.json({ error: 'Erro ao listar livros' }, { status: 500 });
    }
}
