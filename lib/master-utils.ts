/**
 * Lista de UIDs que possuem permissão de Mestre (Admin) no sistema.
 * Estes usuários podem gerenciar o Banco de Dados Global e acessar funções administrativas.
 */
export const MASTER_UIDS = [
    'cynl59ZjdlgUJbuzs8lkufCWI0W2', // Mestre Principal
    'WR0168EySccvAQXnvPoozEEpb1u2'  // Segunda conta identificada
];

/**
 * Verifica se um UID pertence a um Mestre.
 */
export function isMaster(uid: string | null | undefined): boolean {
    if (!uid) return false;
    return MASTER_UIDS.includes(uid);
}
