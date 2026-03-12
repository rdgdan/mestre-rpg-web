/**
 * Tipos globais para o projeto
 * Evita uso de 'as any' em todo o codebase
 */

// ============ PERSONAGEM ============
export interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  experience: number;

  // Atributos
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  // Recursos
  resources: {
    maxHp: number;
    currentHp: number;
    maxMana?: number;
    currentMana?: number;
    temporaryHp: number;
  };

  // Defesa
  ac: number;
  initiative: number;
  speed: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;

  // Skills
  skills?: Record<string, number>;

  // Proficiências
  savingThrows?: Record<string, number>;
  proficiencies?: string[];
  languages?: string[];

  // Equipamento
  inventory: {
    currency: {
      copper?: number;
      silver?: number;
      electrum?: number;
      gold?: number;
      platinum?: number;
    };
    weapons: Weapon[];
    otherEquipment: Equipment[];
  };

  // Magias
  spells?: Spell[];
  spellSlots?: Record<number, number>;

  // Talentos/Features
  features?: Feature[];
  traits?: Trait[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  image?: string;
}

// ============ ARMAS ============
export interface Weapon {
  id?: string;
  name: string;
  type: 'melee' | 'ranged';
  dice: string; // Ex: "1d8", "2d6"
  damageType: string; // Ex: "slashing", "piercing", "bludgeoning"
  weight: number;
  properties?: string[];
  bonus?: number;
  description?: string;
  origin?: 'code' | 'database' | 'custom';
}

// ============ EQUIPAMENTO ============
export interface Equipment {
  id?: string;
  name: string;
  type: string;
  weight: number;
  value?: number;
  description?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  origin?: 'code' | 'database' | 'custom';
}

// ============ MAGIA ============
export interface Spell {
  id?: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string | string[];
  duration: string;
  description: string;
  classes?: string[];
  ritual?: boolean;
  concentration?: boolean;
  source?: string;
  damage?: string;
  prepared?: boolean;
  subclass?: string;
  sourceClass?: string;
}

// ============ FEATURE/TALENTO ============
export interface Feature {
  id?: string;
  name: string;
  description: string;
  level: number;
  class?: string;
  prerequisite?: string;
  origin?: 'code' | 'database' | 'custom';
}

// ============ TRAIT ============
export interface Trait {
  id?: string;
  name: string;
  description: string;
  type: 'background' | 'class' | 'race' | 'custom';
}

// ============ MAGIA (BASE) ============
export interface SpellBase {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string | string[];
  duration: string;
  description: string;
  classes?: string[];
  ritual?: boolean;
  concentration?: boolean;
}

// ============ CAMPANHA ============
export interface Campaign {
  id: string;
  masterId: string;
  name: string;
  description: string;
  imageUrl?: string;
  characters: string[]; // IDs de personagens
  npcs: NPC[];
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'archived';
}

// ============ NPC ============
export interface NPC {
  id: string;
  name: string;
  race: string;
  role: 'ally' | 'neutral' | 'enemy' | 'specialist';
  description: string;
  hp: number;
  ac: number;
  challenge: string;
  xp: number;
}

// ============ SESSÃO ============
export interface Session {
  id: string;
  campaignId: string;
  date: Date;
  title: string;
  notes: string;
  recording?: string;
}

// ============ COMBATE ============
export interface Combat {
  id: string;
  campaignId?: string;
  combatants: Combatant[];
  round: number;
  currentTurnIndex: number;
  status: 'preparation' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  type: 'character' | 'npc' | 'monster';
  characterId?: string;
}

// ============ USUÁRIO ============
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ ITEM/MECANICA ============
export interface Mechanic {
  id: string;
  name: string;
  description: string;
  type: 'rule' | 'condition' | 'effect' | 'action';
  source?: string;
  tags?: string[];
}

// ============ ERRO ============
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}
