/**
 * Sistema Centralizado de Efeitos e Condições
 * Sincroniza automaticamente entre Combat Tracker e Character Sheet
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Condition {
    id: string;
    name: string;
    icon: string;
    description?: string;
    isGlobal: boolean; // true = disponível para todos
    type: 'condition' | 'effect';
}

export interface ClassEffect {
    id: string;
    name: string;
    description?: string;
    duration: number;
    category: 'benefit' | 'debuff';
}

// ============================================
// CATEGORIZAÇÃO DE EFEITOS
// ============================================
export const BENEFIT_IDS = [
    'rage', 'reckless', 'inspiration', 'counter-charm', 'bless', 'sanctuary',
    'shield-faith', 'wild-shape', 'barkskin', 'action-surge', 'second-wind',
    'indomitable', 'evasion', 'uncanny-dodge', 'flurry', 'patient-defense',
    'lay-hands', 'divine-smite', 'aura-protection', 'hunters-mark', 'favored-foe',
    'metamagic', 'tides-chaos', 'invocation', 'arcane-recovery', 'spell-mastery',
    'sneak-attack', 'armor-agathys', 'multiattack', 'mirror-image', 'invisivel'
];

// ============================================
// CONDIÇÕES COMUNS (Globais para todos)
// ============================================
export const COMMON_CONDITIONS: Condition[] = [
    // Condições de Status
    { id: 'caido', name: 'Caído', icon: '🦵', isGlobal: true, type: 'condition', description: 'Movimento custa o dobro. Ataques corpo a corpo contra têm vantagem. Ataques à distância têm desvantagem.' },
    { id: 'envenenado', name: 'Envenenado', icon: '🧪', isGlobal: true, type: 'condition', description: 'Desvantagem em jogadas de ataque e testes de atributo.' },
    { id: 'atordoado', name: 'Atordoado', icon: '💫', isGlobal: true, type: 'condition', description: 'Incapacitado, falha em salvaguardas de Força e Destreza, ataques contra têm vantagem.' },
    { id: 'amedrontado', name: 'Amedrontado', icon: '😨', isGlobal: true, type: 'condition', description: 'Desvantagem em testes e ataques enquanto a fonte do medo estiver visível.' },
    { id: 'agarrado', name: 'Agarrado', icon: '🤝', isGlobal: true, type: 'condition', description: 'Deslocamento se torna 0.' },
    { id: 'incapacitado', name: 'Incapacitado', icon: '🚫', isGlobal: true, type: 'condition', description: 'Não pode realizar ações ou reações.' },
    { id: 'invisivel', name: 'Invisível', icon: '👻', isGlobal: true, type: 'condition', description: 'Impossível de ser visto sem ajuda magia. Ataques contra têm desvantagem. Seus ataques têm vantagem.' },
    { id: 'paralisado', name: 'Paralisado', icon: '⛓️', isGlobal: true, type: 'condition', description: 'Incapacitado, falha em salvaguardas de Força e Destreza. Ataques contra têm vantagem e são críticos se a 1,5m.' },
    { id: 'petrificado', name: 'Petrificado', icon: '🗿', isGlobal: true, type: 'condition', description: 'Transformado em substância inanimada sólida. Peso aumenta 10x. Não envelhece.' },
    { id: 'preso', name: 'Preso', icon: '🕸️', isGlobal: true, type: 'condition', description: 'Deslocamento 0. Ataques contra têm vantagem. Seus ataques e salvaguardas de Destreza têm desvantagem.' },
    { id: 'inconsciente', name: 'Inconsciente', icon: '😴', isGlobal: true, type: 'condition', description: 'Incapacitado, larga o que estiver segurando, falha em salvaguardas de Força e Destreza. Ataques contra têm vantagem e são críticos se a 1,5m.' },

    // Malefícios Adicionais
    { id: 'cego', name: 'Cego', icon: '🙈', isGlobal: true, type: 'condition', description: 'Falha em testes de visão. Ataques contra têm vantagem. Seus ataques têm desvantagem.' },
    { id: 'surdo', name: 'Surdo', icon: '🔇', isGlobal: true, type: 'condition', description: 'Falha em testes de audição.' },
    { id: 'aterrorizado', name: 'Aterrorizado', icon: '😱', isGlobal: true, type: 'condition' },
    { id: 'exaurido', name: 'Exaurido', icon: '😵', isGlobal: true, type: 'condition' },
    { id: 'cansado', name: 'Cansado', icon: '😓', isGlobal: true, type: 'condition' },
    { id: 'queimado', name: 'Queimado', icon: '🔥', isGlobal: true, type: 'condition' },
    { id: 'enfraquecido', name: 'Enfraquecido', icon: '💪', isGlobal: true, type: 'condition' },
    { id: 'fome', name: 'Com Fome', icon: '🍖', isGlobal: true, type: 'condition' },
    { id: 'sangrando', name: 'Sangrando', icon: '🩸', isGlobal: true, type: 'condition' },
    { id: 'ebrio', name: 'Bêbado', icon: '🍷', isGlobal: true, type: 'condition' },
    { id: 'amaldicoado', name: 'Amaldiçoado', icon: '💀', isGlobal: true, type: 'condition' },
];

// ============================================
// EFEITOS DE CLASSE (específicos por classe)
// ============================================
export const CLASS_EFFECTS: Record<string, ClassEffect[]> = {
    'Bárbaro': [
        { id: 'rage', name: 'Fúria', duration: 10, category: 'benefit', description: 'Vantagem em testes de Força, bônus de dano, resistência a danos físicos.' },
        { id: 'reckless', name: 'Ataque Temerário', duration: 1, category: 'benefit' },
    ],
    'Bardo': [
        { id: 'inspiration', name: 'Inspiração Bárdica', duration: 10, category: 'benefit', description: 'Adiciona um dado de bônus em um teste, ataque ou salvaguarda.' },
        { id: 'counter-charm', name: 'Contra-encanto', duration: 1, category: 'benefit' },
        { id: 'enfeiticado', name: 'Enfeitiçado', duration: 10, category: 'benefit' },
    ],
    'Clérigo': [
        { id: 'bless', name: 'Bênção', duration: 10, category: 'benefit', description: 'Adiciona 1d4 em ataques e salvaguardas.' },
        { id: 'sanctuary', name: 'Santuário', duration: 1, category: 'benefit' },
        { id: 'shield-faith', name: 'Escudo da Fé', duration: 10, category: 'benefit', description: 'CA +2.' },
        { id: 'curse', name: 'Maldição Divina', duration: 5, category: 'debuff', description: 'Subtrai 1d4 de ataques e salvaguardas.' },
    ],
    'Druida': [
        { id: 'wild-shape', name: 'Forma Selvagem', duration: 10, category: 'benefit' },
        { id: 'barkskin', name: 'Pele de Árvore', duration: 10, category: 'benefit' },
        { id: 'entangle', name: 'Enredar', duration: 5, category: 'debuff' },
    ],
    'Guerreiro': [
        { id: 'action-surge', name: 'Surto de Ação', duration: 1, category: 'benefit' },
        { id: 'second-wind', name: 'Retomada de Fôlego', duration: 1, category: 'benefit' },
        { id: 'indomitable', name: 'Indomável', duration: 1, category: 'benefit' },
        { id: 'knocked-down', name: 'Derribado', duration: 2, category: 'debuff' },
    ],
    'Ladino': [
        { id: 'evasion', name: 'Evasão', duration: 1, category: 'benefit' },
        { id: 'uncanny-dodge', name: 'Esquiva Sobrenatural', duration: 1, category: 'benefit' },
        { id: 'sneak-attack', name: 'Ataque Furtivo', duration: 1, category: 'benefit' },
    ],
    'Monge': [
        { id: 'flurry', name: 'Rajada de Golpes', duration: 1, category: 'benefit' },
        { id: 'patient-defense', name: 'Defesa Paciente', duration: 1, category: 'benefit' },
        { id: 'stunning-strike', name: 'Ataque Atordoante', duration: 1, category: 'debuff' },
        { id: 'paralyzed-ki', name: 'Ki Bloqueado', duration: 3, category: 'debuff' },
    ],
    'Paladino': [
        { id: 'lay-hands', name: 'Mãos Curadoras', duration: 1, category: 'benefit' },
        { id: 'divine-smite', name: 'Destruição Divina', duration: 1, category: 'benefit' },
        { id: 'aura-protection', name: 'Aura de Proteção', duration: 10, category: 'benefit' },
        { id: 'wrathful-smite', name: 'Golpe de Ira Divina', duration: 1, category: 'debuff' },
    ],
    'Patrulheiro': [
        { id: 'hunters-mark', name: 'Marca do Caçador', duration: 10, category: 'benefit', description: 'Dano extra de 1d6 ao acertar o alvo marcado.' },
        { id: 'favored-foe', name: 'Inimigo Favorito', duration: 10, category: 'benefit' },
        { id: 'multiattack', name: 'Múltiplos Ataques', duration: 1, category: 'benefit' },
    ],
    'Feiticeiro': [
        { id: 'metamagic', name: 'Metamagia', duration: 1, category: 'benefit' },
        { id: 'tides-chaos', name: 'Marés do Caos', duration: 1, category: 'benefit' },
        { id: 'wild-surge', name: 'Surto Selvagem', duration: 1, category: 'debuff' },
    ],
    'Bruxo': [
        { id: 'hex', name: 'Maldição', duration: 10, category: 'debuff' },
        { id: 'invocation', name: 'Invocação Mística', duration: 10, category: 'benefit' },
        { id: 'armor-agathys', name: 'Armadura de Agathys', duration: 10, category: 'benefit' },
    ],
    'Mago': [
        { id: 'arcane-recovery', name: 'Recuperação Arcana', duration: 1, category: 'benefit' },
        { id: 'spell-mastery', name: 'Mestria em Magia', duration: 1, category: 'benefit' },
        { id: 'mirror-image', name: 'Imagem Espelhada', duration: 5, category: 'benefit' },
        { id: 'hypnotic-pattern', name: 'Padrão Hipnótico', duration: 3, category: 'debuff' },
    ],
};

// ============================================
// MAPEAMENTO: ID → ESTILO CSS DA FICHA
// ============================================
export const EFFECT_STYLES: Record<string, { bgClass: string; borderClass: string; iconBg: string }> = {
    // Fúria do Bárbaro - Vermelho Intenso
    'rage': {
        bgClass: 'bg-red-900/30',
        borderClass: 'border-red-600 shadow-glow-red/20',
        iconBg: 'text-red-500',
    },
    // Bênção - Verde Sagrado
    'bless': {
        bgClass: 'bg-green-900/20',
        borderClass: 'border-green-600 shadow-glow-green/20',
        iconBg: 'text-green-400',
    },
    // Inspiração Bárdica - Azul Musical
    'inspiration': {
        bgClass: 'bg-blue-900/20',
        borderClass: 'border-blue-600 shadow-glow-blue/20',
        iconBg: 'text-blue-400',
    },
    // Forma Selvagem - Verde Floresta
    'wild-shape': {
        bgClass: 'bg-emerald-900/20',
        borderClass: 'border-emerald-600',
        iconBg: 'text-emerald-400',
    },
    // Maldição - Roxo Sombrio
    'hex': {
        bgClass: 'bg-purple-900/20',
        borderClass: 'border-purple-600',
        iconBg: 'text-purple-400',
    },
    // Ataque Atordoante - Amarelo Eletrificante
    'stunning-strike': {
        bgClass: 'bg-yellow-900/20',
        borderClass: 'border-yellow-600',
        iconBg: 'text-yellow-400',
    },
    // Escudo da Fé - Azul Claro
    'shield-faith': {
        bgClass: 'bg-cyan-900/20',
        borderClass: 'border-cyan-600',
        iconBg: 'text-cyan-400',
    },
    // Malefícios Específicos
    'curse': {
        bgClass: 'bg-purple-900/20',
        borderClass: 'border-purple-600',
        iconBg: 'text-purple-400',
    },
    'enredar': {
        bgClass: 'bg-amber-900/20',
        borderClass: 'border-amber-600',
        iconBg: 'text-amber-400',
    },
    'knocked-down': {
        bgClass: 'bg-orange-900/20',
        borderClass: 'border-orange-600',
        iconBg: 'text-orange-400',
    },
    'paralyzed-ki': {
        bgClass: 'bg-indigo-900/20',
        borderClass: 'border-indigo-600',
        iconBg: 'text-indigo-400',
    },
    'wrathful-smite': {
        bgClass: 'bg-red-900/20',
        borderClass: 'border-red-600',
        iconBg: 'text-red-400',
    },
    'wild-surge': {
        bgClass: 'bg-violet-900/20',
        borderClass: 'border-violet-600',
        iconBg: 'text-violet-400',
    },
    'hypnotic-pattern': {
        bgClass: 'bg-fuchsia-900/20',
        borderClass: 'border-fuchsia-600',
        iconBg: 'text-fuchsia-400',
    },
    // Benefícios Adicionais
    'sneak-attack': {
        bgClass: 'bg-slate-900/20',
        borderClass: 'border-slate-600',
        iconBg: 'text-slate-400',
    },
    'mirror-image': {
        bgClass: 'bg-sky-900/20',
        borderClass: 'border-sky-600',
        iconBg: 'text-sky-400',
    },
    'armor-agathys': {
        bgClass: 'bg-teal-900/20',
        borderClass: 'border-teal-600',
        iconBg: 'text-teal-400',
    },
    'multiattack': {
        bgClass: 'bg-lime-900/20',
        borderClass: 'border-lime-600',
        iconBg: 'text-lime-400',
    },
    // Efeitos Globais Benéficos - Verde Padrão
    'default-benefit': {
        bgClass: 'bg-green-900/10',
        borderClass: 'border-green-500/30',
        iconBg: 'text-green-400',
    },
    // Malefícios Globais - Vermelho Padrão
    'default-debuff': {
        bgClass: 'bg-red-900/10',
        borderClass: 'border-red-500/30',
        iconBg: 'text-red-400',
    },
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Obtém o estilo CSS para um efeito específico
 */
export function getEffectStyle(effectId: string) {
    return EFFECT_STYLES[effectId] || EFFECT_STYLES['default-benefit'];
}

/**
 * Obtém todos os efeitos de uma classe
 */
export function getClassEffects(className: string): ClassEffect[] {
    return CLASS_EFFECTS[className] || [];
}

/**
 * Filtra efeitos por categoria
 */
export function filterEffectsByCategory(
    effects: ClassEffect[],
    category: 'benefit' | 'debuff' | 'all'
): ClassEffect[] {
    if (category === 'all') return effects;
    return effects.filter(e => e.category === category);
}

/**
 * Obtém todas as condições globais
 */
export function getGlobalConditions(): Condition[] {
    return COMMON_CONDITIONS.filter(c => c.isGlobal);
}

/**
 * Separa condições em benefícios e malefícios
 */
export function getCategorizedGlobalConditions() {
    const allConditions = getGlobalConditions();

    // Condições que são consideradas benefícios
    const benefitIds = ['invisivel'];

    // Todas as outras são malefícios
    const benefits = allConditions.filter(c => benefitIds.includes(c.id));
    const debuffs = allConditions.filter(c => !benefitIds.includes(c.id));

    return { benefits, debuffs, all: allConditions };
}

/**
 * Sincroniza um efeito aplicado no combate para a ficha do personagem
 */
export async function syncEffectToCharacter(
    characterId: string,
    effectId: string,
    effectName: string,
    isApplying: boolean
) {
    // Esta função será chamada do combat tracker para atualizar a ficha
    try {
        const charRef = doc(db, 'personagens', characterId);
        const activeEffects = await updateDoc(charRef, {
            activeEffects: isApplying
                ? (await doc(db, 'personagens', characterId))
                : undefined
        });
        console.log(`[SYNC] Efeito "${effectName}" (${isApplying ? 'aplicado' : 'removido'}) → Personagem ${characterId}`);
    } catch (err) {
        console.error('Erro ao sincronizar efeito:', err);
    }
}

/**
 * Sincroniza um efeito da ficha para o combate (listener para mudanças)
 */
export async function syncEffectToCombat(
    combatId: string,
    characterId: string,
    effectId: string,
    effectName: string,
    isApplying: boolean
) {
    try {
        const combatRef = doc(db, 'confrontos', combatId);
        console.log(`[SYNC] Efeito "${effectName}" (${isApplying ? 'aplicado' : 'removido'}) → Combate ${combatId}`);
        // A sincronização será feita via listener em tempo real no componente
    } catch (err) {
        console.error('Erro ao sincronizar efeito com combate:', err);
    }
}
