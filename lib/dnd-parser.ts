/**
 * Utilitário para extrair mecânicas de RPG de texto bruto usando Regex.
 * Focado em D&D 5e.
 */

export interface ParsedMechanic {
    type: 'spell' | 'item' | 'monster' | 'rule';
    name: string;
    content: string;
    raw: string;
    metadata?: any;
}

export class DnDParser {
    /**
     * Tenta identificar blocos de conteúdo no texto bruto
     */
    static parseText(text: string): ParsedMechanic[] {
        const results: ParsedMechanic[] = [];

        // Limpar o texto
        text = text.replace(/\s+/g, ' ').trim();

        // 1. Tentar encontrar magias (padrão mais comum)
        // Procura por: NOME DA MAGIA seguido de nível/escola
        const spellPattern = /([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s'-]{2,40})\s*(?:Truque|Nível\s*\d|Level\s*\d|\d+º\s*Nível|\d+th\s*Level)\s*(?:de\s*)?(?:Abjuração|Adivinhação|Conjuração|Encantamento|Evocação|Ilusão|Necromancia|Transmutação|Abjuration|Divination|Conjuration|Enchantment|Evocation|Illusion|Necromancy|Transmutation)/gi;

        let match;
        while ((match = spellPattern.exec(text)) !== null) {
            const name = match[1].trim();
            const startPos = match.index;
            const endPos = Math.min(startPos + 1000, text.length);
            const content = text.substring(startPos, endPos);

            results.push({
                type: 'spell',
                name,
                content,
                raw: content
            });
        }

        // 2. Procurar por monstros (CA, PV, ND)
        const monsterPattern = /([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s'-]{2,40})\s*(?:Classe de Armadura|CA|Armor Class|AC)\s*:?\s*\d+/gi;

        while ((match = monsterPattern.exec(text)) !== null) {
            const name = match[1].trim();
            const startPos = match.index;
            const endPos = Math.min(startPos + 1500, text.length);
            const content = text.substring(startPos, endPos);

            // Evitar duplicatas
            if (!results.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                results.push({
                    type: 'monster',
                    name,
                    content,
                    raw: content
                });
            }
        }

        // 3. Procurar por itens mágicos
        const itemPattern = /([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú\s'-]{2,40})\s*(?:Item mágico|Magic item|Raridade|Rarity)\s*:?\s*(?:Comum|Incomum|Raro|Muito raro|Lendário|Common|Uncommon|Rare|Very rare|Legendary)/gi;

        while ((match = itemPattern.exec(text)) !== null) {
            const name = match[1].trim();
            const startPos = match.index;
            const endPos = Math.min(startPos + 800, text.length);
            const content = text.substring(startPos, endPos);

            if (!results.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                results.push({
                    type: 'item',
                    name,
                    content,
                    raw: content
                });
            }
        }

        // 4. Se não encontrou nada, tentar abordagem mais genérica
        if (results.length === 0) {
            // Dividir por linhas em branco duplas ou títulos em maiúsculas
            const sections = text.split(/\n\n+|(?=[A-ZÀ-Ú]{3,})/);

            for (const section of sections) {
                const trimmed = section.trim();
                if (trimmed.length < 50) continue; // Muito curto

                // Pegar primeira linha como nome
                const lines = trimmed.split('\n');
                const name = lines[0].substring(0, 50).trim();

                if (name.length > 3) {
                    results.push({
                        type: 'rule',
                        name,
                        content: trimmed.substring(0, 500),
                        raw: trimmed
                    });
                }
            }
        }

        return results;
    }
}
