import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Garantir que a pasta de uploads existe
        const uploadDir = path.join(process.cwd(), 'public', 'map-uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        // Nome do arquivo seguro
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, buffer);

        // URL pública relativa
        const fileUrl = `/map-uploads/${fileName}`;

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Erro no upload local:', error);
        return NextResponse.json({ error: 'Falha ao salvar arquivo localmente' }, { status: 500 });
    }
}
