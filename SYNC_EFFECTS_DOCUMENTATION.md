/**
 * SINCRONIZAÇÃO BIDIRECIONAL DE EFEITOS
 * 
 * Sistema que mantém efeitos sincronizados entre Combat Tracker e Character Sheet
 */

/**
 * FLUXO 1: Mestre aplica efeito no combate → Sincroniza com ficha do personagem
 * 
 * 1. Mestre abre modal de efeitos do combate
 * 2. Clica em "Aplicar" para um efeito (ex: Fúria para Bárbaro)
 * 3. applyClassEffectToCombatant() é chamada
 * 4. Efeito é adicionado ao statusEffects do combatente
 * 5. Se o combatente tem externalId (vinculado a personagem):
 *    → Busca o documento do personagem no Firestore
 *    → Adiciona o ID do efeito ao array activeEffects
 *    → Salva a mudança
 * 6. Jogador vê o efeito aparecer na sua ficha em tempo real
 */

/**
 * FLUXO 2: Jogador clica em efeito na ficha → Sincroniza com combate
 * 
 * 1. Jogador abre sua ficha de personagem
 * 2. Clica em um efeito ativo (ex: Inspiração Bárdica)
 * 3. toggleActiveEffect() é chamada
 * 4. Efeito é adicionado/removido do array activeEffects localmente
 * 5. Procura por combates que contenham este personagem
 * 6. Se encontrado, sincroniza o efeito no combate:
 *    → Encontra o combatente com externalId do personagem
 *    → Adiciona/remove o efeito em statusEffects
 *    → Salva a mudança
 * 7. Mestre vê a mudança no combate em tempo real
 */

/**
 * FLUXO 3: Listener em tempo real mantém sincronização contínua
 * 
 * 1. Combat Tracker inicializa um useEffect
 * 2. Para cada personagem jogador no combate:
 *    → Cria um listener onSnapshot para a ficha
 *    → Monitora o campo activeEffects
 * 3. Quando a ficha muda:
 *    → O listener detecta a mudança
 *    → Sincroniza automaticamente os efeitos no combate
 *    → Não precisa de botão - é automático!
 * 4. O listener é limpo quando o combate termina
 */

/**
 * ESTRUTURA DE DADOS
 * 
 * Combate (encounters):
 * {
 *   combatants: [
 *     {
 *       id: "combatant-1",
 *       externalId: "character-123",  // Vinculação com personagem
 *       statusEffects: [
 *         { id: "rage", name: "Fúria", duration: 10 },
 *         { id: "bless", name: "Bênção", duration: 10 }
 *       ]
 *     }
 *   ]
 * }
 * 
 * Ficha (personagens):
 * {
 *   activeEffects: ["rage", "bless"]  // Apenas IDs dos efeitos ativos
 * }
 */

/**
 * CASOS DE USO
 */

// Caso 1: Bárbaro em Fúria
// 1. Mestre: clica "Aplicar Fúria" no combate
// 2. Ficha do Bárbaro: exibe "Fúria" ativa com estilo red-900/30
// 3. Se Bárbaro remove a fúria na ficha → desaparece no combate

// Caso 2: Clérigo aplica Bênção
// 1. Mestre: clica "Aplicar Bênção" no aliado
// 2. Ficha do aliado: exibe "Bênção" ativa com estilo green-900/20
// 3. Contador visual mostra efeitos ativos

// Caso 3: Mago concentra em magia
// 1. Jogador: clica em "Concentrando" na ficha
// 2. Combate: exibe efeito "Concentrando" no seu combatente
// 3. Se perder concentração → desaparece de ambos os lugares

/**
 * FUNCIONALIDADES FUTURAS
 * 
 * - Sincronizar condições globais (atordoado, envenenado, etc)
 * - Histórico de efeitos aplicados
 * - Notificações quando efeito é aplicado/removido
 * - Duração visual com timer countdown
 * - Efeitos que expiram automaticamente após X turnos
 */
