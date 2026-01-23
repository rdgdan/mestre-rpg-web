/**
 * Serviço de Cache Global para o Firestore
 * Evita múltiplas consultas para as mesmas coleções durante a sessão.
 */

class FirestoreCacheService {
    private cache: Map<string, any[]> = new Map();

    /**
     * Recupera dados do cache para uma chave específica
     */
    get(key: string): any[] | null {
        if (this.cache.has(key)) {
            console.log(`[CacheService] Recuperando do cache: ${key}`);
            return this.cache.get(key) || null;
        }
        return null;
    }

    /**
     * Armazena dados no cache
     */
    set(key: string, data: any[]): void {
        console.log(`[CacheService] Armazenando no cache: ${key}`);
        this.cache.set(key, data);
    }

    /**
     * Invalida o cache para uma chave específica ou padrões
     */
    invalidate(key: string): void {
        console.log(`[CacheService] Invalidando cache: ${key}`);
        this.cache.delete(key);

        // Se invalidar qualquer sub-categoria de itens, invalida o cache base e as outras sub-categorias
        const itemKeys = ['itens', 'armas', 'armaduras', 'escudos'];
        if (itemKeys.includes(key)) {
            itemKeys.forEach(k => this.cache.delete(k));
            console.log(`[CacheService] Invalidação em cascata para: ${itemKeys.join(', ')}`);
        }
    }

    /**
     * Limpa todo o cache
     */
    clear(): void {
        console.log('[CacheService] Limpando todo o cache');
        this.cache.clear();
    }
}

// Exporta como singleton
export const firestoreCache = new FirestoreCacheService();
