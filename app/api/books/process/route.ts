import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DnDParser } from '@/lib/dnd-parser';

const PDFParser = require('pdf2json');

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

        // Processar PDF com pdf2json
        const pdfParser = new PDFParser();

        let fullText = '';
        let numPages = 0;

        const pdfData = await new Promise<any>((resolve, reject) => {
            pdfParser.on('pdfParser_dataError', (errData: any) => {
                console.error('Erro ao parsear PDF:', errData.parserError);
                reject(new Error(errData.parserError));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                resolve(pdfData);
            });

            pdfParser.loadPDF(filePath);
        });

        // Extrair texto de todas as páginas com melhor reconstrução
        numPages = pdfData.Pages?.length || 0;
        console.log(`PDF carregado: ${numPages} páginas`);

        for (const page of pdfData.Pages || []) {
            let pageText = '';
            const textItems: Array<{ text: string, x: number, y: number }> = [];

            // Coletar todos os textos com suas posições
            for (const text of page.Texts || []) {
                for (const run of text.R || []) {
                    const decodedText = decodeURIComponent(run.T || '');
                    textItems.push({
                        text: decodedText,
                        x: text.x || 0,
                        y: text.y || 0
                    });
                }
            }

            // Ordenar por posição Y (vertical) e depois X (horizontal)
            textItems.sort((a, b) => {
                const yDiff = a.y - b.y;
                if (Math.abs(yDiff) > 0.5) return yDiff;
                return a.x - b.x;
            });

            // Reconstruir texto com espaços apropriados
            let lastY = -1;
            for (const item of textItems) {
                // Nova linha se Y mudou significativamente
                if (lastY >= 0 && Math.abs(item.y - lastY) > 0.5) {
                    pageText += '\n';
                } else if (pageText.length > 0 && !pageText.endsWith(' ')) {
                    pageText += ' ';
                }
                pageText += item.text;
                lastY = item.y;
            }

            fullText += pageText + '\n\n';
        }

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
