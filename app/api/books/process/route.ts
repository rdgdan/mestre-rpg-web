import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DnDParser } from '@/lib/dnd-parser';

const pdf = require('pdf-parse');
const { PDFParse } = pdf;

export async function POST(req: NextRequest) {
    try {
        const { filename } = await req.json();

        if (!filename) {
            return NextResponse.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'books', filename);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
        }

        console.log(`Processando PDF: ${filePath}`);

        // Ler arquivo como buffer
        const dataBuffer = fs.readFileSync(filePath);

        // Processar PDF com pdf-parse (usando a classe PDFParse que é a função principal neste pacote)
        const pdfData = await PDFParse(dataBuffer);

        const fullText = pdfData.text || '';
        const numPages = pdfData.numpages || 0;

        console.log(`PDF carregado: ${numPages} páginas`);
        console.log(`Texto extraído: ${fullText.length} caracteres`);

        // Salvar texto extraído para debug (primeiros 5000 caracteres)
        const debugPath = path.join(process.cwd(), 'extracted_text_debug.txt');
        fs.writeFileSync(debugPath, fullText.substring(0, 5000));
        console.log(`Texto de debug salvo em: ${debugPath}`);

        // Extrair mecânicas usando o parser local
        const mechanics = DnDParser.parseText(fullText);
        console.log(`Mecânicas encontradas: ${mechanics.length}`);

        return NextResponse.json({
            count: mechanics.length,
            mechanics: mechanics,
            info: {
                pages: numPages,
                title: filename
            }
        });
    } catch (error: any) {
        console.error('Erro ao processar PDF:', error);
        return NextResponse.json({
            error: `Erro ao processar PDF: ${error.message}`
        }, { status: 500 });
    }
}
