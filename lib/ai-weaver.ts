import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedMechanic } from './dnd-parser';

/**
 * Interface para representar uma habilidade gerada pela I.A.
 */
export interface GeneratedFeature {
    name: string;
    description: string;
    level?: number;
}

/**
 * Utilitário para "tecer" conteúdo de RPG usando I.A. (Gemini)
 */
export class AIWeaver {
    private static getApiKey(): string | null {
        return typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
    }

    private static async getModel() {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('API Key do Gemini não configurada.');

        const genAI = new GoogleGenerativeAI(apiKey);
        // Usamos o flash por ser mais rápido e barato para tarefas de extração/geração estruturada
        return genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    /**
     * Gera os dados de uma subclasse completa (níveis 1 a 20)
     */
    static async generateSubclass(className: string, subclassName: string): Promise<Record<number, { features: GeneratedFeature[] }>> {
        const model = await this.getModel();

        const prompt = `
            Você é um mestre de RPG especialista em D&D 5e. 
            Gere as habilidades da subclasse "${subclassName}" para a classe "${className}".
            Use apenas as regras oficiais ou crie algo extremamente equilibrado se for homebrew.
            Retorne um JSON onde as chaves são os níveis (números) e os valores são objetos com uma lista de "features".
            Cada feature deve ter "name" e "description".
            Garanta que os níveis de ganho de habilidade respeitem a classe ${className} (ex: 3, 7, 10, 15, 18 para Guerreiro).
            O texto deve estar em PORTUGUÊS.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    }

    /**
     * Escaneia um texto bruto e extrai habilidades/itens
     */
    static async scanText(text: string): Promise<GeneratedFeature[]> {
        const model = await this.getModel();

        const prompt = `
            Analise o seguinte texto de RPG e extraia todas as habilidades, talentos ou itens mágicos que encontrar.
            Texto: "${text}"
            Retorne um JSON que seja um array de objetos com "name" e "description".
            Limpe o ruído do texto e foque apenas nas regras e descrições úteis.
            O texto final deve estar em PORTUGUÊS.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return JSON.parse(response.text());
    }

    /**
     * Traduz uma mecânica (nome e descrição) para português
     */
    static async translateMechanic(mechanic: ParsedMechanic): Promise<ParsedMechanic> {
        const model = await this.getModel();

        // Preservar o nome original antes da tradução para de-duplicação
        const originalName = mechanic.originalName || mechanic.name;

        const prompt = `
            Você é um tradutor especialista em RPG e D&D 5e. 
            Sua tarefa é traduzir a seguinte mecânica para PORTUGUÊS DO BRASIL.
            IMPORTANTE: Todo o texto de retorno (nome e descrição) DEVE estar em PORTUGUÊS.
            Mantenha os termos técnicos oficiais (ex: Saving Throw -> Teste de Resistência).
            
            Informação Original:
            Nome: "${mechanic.name}"
            Tipo: ${mechanic.type}
            Conteúdo: "${mechanic.content}"

            Retorne um JSON com:
            "name": O nome traduzido para português
            "description": A descrição/conteúdo traduzido para português e bem formatado
        `;

        try {
            console.log(`[AIWeaver] Traduzindo "${mechanic.name}"...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const translated = JSON.parse(response.text());

            console.log(`[AIWeaver] Tradução concluída: "${translated.name}"`);

            return {
                ...mechanic,
                name: translated.name || mechanic.name,
                originalName: originalName, // Sempre preservar o original
                content: translated.description || mechanic.content
            };
        } catch (error) {
            console.error(`[AIWeaver] Erro ao traduzir "${mechanic.name}":`, error);
            return {
                ...mechanic,
                originalName: originalName // Mesmo com erro, preserva o original
            };
        }
    }
}
