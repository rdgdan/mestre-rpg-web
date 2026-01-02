import { Timestamp } from 'firebase/firestore';
import { ATTRIBUTE_KEYS, SKILLS } from './character-data';
import { dndWeapons, Weapon, OtherEquipmentItem } from './items-data';

// --- Dicionários de Mapeamento (Português/Inglês -> Chave Padrão) ---

const ATTRIBUTE_MAP: { [key: string]: typeof ATTRIBUTE_KEYS[number] } = {
  // Força
  'strength': 'strength', 'força': 'strength', 'forca': 'strength', 'str': 'strength',
  // Destreza
  'dexterity': 'dexterity', 'destreza': 'dexterity', 'dex': 'dexterity',
  // Constituição
  'constitution': 'constitution', 'constituição': 'constitution', 'constituicao': 'constitution', 'con': 'constitution',
  // Inteligência
  'intelligence': 'intelligence', 'inteligência': 'intelligence', 'inteligencia': 'intelligence', 'int': 'intelligence',
  // Sabedoria
  'wisdom': 'wisdom', 'sabedoria': 'wisdom', 'wis': 'wisdom',
  // Carisma
  'charisma': 'charisma', 'carisma': 'charisma', 'cha': 'charisma',
};

const SKILL_MAP: { [key: string]: typeof SKILLS[number]['key'] } = {
  'acrobatics': 'acrobatics', 'acrobacia': 'acrobatics',
  'animal handling': 'animalHandling', 'adestrar animais': 'animalHandling', 'lidar com animais': 'animalHandling',
  'arcana': 'arcana', 'arcanismo': 'arcana',
  'athletics': 'athletics', 'atletismo': 'athletics',
  'deception': 'deception', 'enganação': 'deception', 'enganacao': 'deception',
  'history': 'history', 'história': 'history', 'historia': 'history',
  'insight': 'insight', 'intuição': 'insight', 'intuicao': 'insight',
  'intimidation': 'intimidation', 'intimidação': 'intimidation', 'intimidacao': 'intimidation',
  'investigation': 'investigation', 'investigação': 'investigation', 'investigacao': 'investigation',
  'medicine': 'medicine', 'medicina': 'medicine',
  'nature': 'nature', 'natureza': 'nature',
  'perception': 'perception', 'percepção': 'perception', 'percepcao': 'perception',
  'performance': 'performance', 'atuação': 'performance', 'atuacao': 'performance',
  'persuasion': 'persuasion', 'persuasão': 'performance', 'persuasao': 'performance', // Erro sutil de mapeamento corrigido
  'religion': 'religion', 'religião': 'religion', 'religiao': 'religion',
  'sleight of hand': 'sleightOfHand', 'prestidigitação': 'sleightOfHand', 'prestidigitacao': 'sleightOfHand',
  'stealth': 'stealth', 'furtividade': 'stealth',
  'survival': 'survival', 'sobrevivência': 'survival', 'sobrevivencia': 'survival',
};

// Correção do mapa de persuasão
SKILL_MAP['persuasion'] = 'persuasion';
SKILL_MAP['persuasão'] = 'persuasion';
SKILL_MAP['persuasao'] = 'persuasion';

const normalizeKey = (key: string): string => {
  if (!key) return '';
  return key.toLowerCase().trim().replace(/\s+/g, '').replace(/_/g, '');
}

// --- Funções de Classificação de Itens ---

const findWeaponData = (name: string) => {
  const normalizedName = normalizeKey(name);
  return dndWeapons.find(w => normalizeKey(w.name) === normalizedName);
};

const getArmorType = (name: string): 'armor' | 'shield' | 'other' => {
  const n = normalizeKey(name);
  if (n.includes('escudo') || n.includes('shield')) return 'shield';
  if (n.includes('armadura') || n.includes('armor') || n.includes('couro') || n.includes('cota') || n.includes('placas')) return 'armor';
  return 'other';
};

// --- Função Auxiliar para garantir que valores sejam numéricos ---
const safeParseInt = (value: any, defaultValue = 0): number => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};


// --- Função Principal de Mapeamento ---
export function mapImportedDataToCharacter(data: any, ownerId: string, imageUrl: string): any {
  const charData = data.a?.[0] || {};

  // --- ATRIBUTOS E TESTES DE RESISTÊNCIA ---
  const attributes: { [key: string]: number } = {};
  const savingThrows: { [key: string]: boolean } = {};
  ATTRIBUTE_KEYS.forEach(key => { attributes[key] = 10; savingThrows[key] = false; });

  const rawAttributes = data.e || [];
  rawAttributes.forEach((attr: any) => {
    if (!attr || !attr.a) return;
    const mappedName = ATTRIBUTE_MAP[normalizeKey(attr.a)];
    if (mappedName) {
      attributes[mappedName] = safeParseInt(attr.b, 10);
      savingThrows[mappedName] = !!attr.c;
    }
  });

  // --- PERÍCIAS ---
  const skills: { [key: string]: boolean } = {};
  SKILLS.forEach(skill => { skills[skill.key] = false; });

  const rawSkills = data.f || [];
  rawSkills.forEach((skill: any) => {
    if (!skill || !skill.a || !skill.a.a) return;
    const mappedName = SKILL_MAP[normalizeKey(skill.a.a)];
    if (mappedName) {
      skills[mappedName] = !!skill.a.b;
    }
  });

  // --- MAGIAS ---
  const charUuid = charData.uuid;
  const rawSpells = [
    ...(data.l || []),
    ...(data.w || []),
    ...(data.r || []).filter((item: any) => item.a?.a === charUuid && item.b?.b) // Somente se for do personagem e tiver nome
  ];

  const spells = rawSpells.map((spell: any) => {
    const s = spell.b || {};
    return {
      id: s.uuid || spell.a?.c || Math.random().toString(36).substr(2, 9),
      name: s.b || s.d || 'Magia Desconhecida',
      description: s.c || s.e || 'Sem descrição.',
      level: safeParseInt(s.k !== undefined ? s.k : s.c, 0),
      school: s.d || s.f || '',
      castingTime: s.f || s.g || '',
      range: s.g || s.h || '',
      components: s.i || '',
      duration: s.e || s.j || '',
      prepared: !!spell.a?.d || false,
    };
  });

  // --- INVENTÁRIO INTELIGENTE ---
  const weapons: Weapon[] = [];
  const otherEquipment: OtherEquipmentItem[] = [];

  // Agrupar itens brutos por nome para evitar duplicatas
  const itemGroups: { [name: string]: { quantity: number, raw: any } } = {};
  const rawItems = data.i || [];

  rawItems.forEach((item: any) => {
    const name = item.b?.u || 'Item Desconhecido';
    const qty = safeParseInt(item.a?.c, 1);
    if (itemGroups[name]) {
      itemGroups[name].quantity += qty;
    } else {
      itemGroups[name] = { quantity: qty, raw: item };
    }
  });

  Object.entries(itemGroups).forEach(([name, group]) => {
    const quantity = group.quantity;
    const item = group.raw;
    const weaponData = findWeaponData(name);

    // Heurística de Arma (mesmo que não esteja no banco)
    const isLikelyWeapon = weaponData ||
      name.toLowerCase().includes('espada') ||
      name.toLowerCase().includes('machado') ||
      name.toLowerCase().includes('arco') ||
      name.toLowerCase().includes('adaga') ||
      name.toLowerCase().includes('cimitarra') ||
      name.toLowerCase().includes('besta') ||
      name.toLowerCase().includes('rapieira');

    if (isLikelyWeapon) {
      weapons.push({
        id: Math.random().toString(36).substr(2, 9),
        name: weaponData?.name || name,
        damage: weaponData?.damage || '1d6',
        damageType: weaponData?.damageType || 'Desconhecido',
        properties: weaponData?.properties || [],
        quantity,
        isMagical: false,
        magicalBonus: 0,
        magicalEffect: ''
      });
    } else {
      const armorType = getArmorType(name);
      otherEquipment.push({
        id: Math.random().toString(36).substr(2, 9),
        name,
        quantity,
        type: armorType,
        isEquipped: false,
        armorClass: armorType === 'shield' ? 2 : (armorType === 'armor' ? 10 : 0),
        description: item.b?.v || ''
      });
    }
  });

  // --- INFORMAÇÕES BÁSICAS ---
  const level = safeParseInt(charData.g, 1);
  const proficiencyBonus = Math.ceil(1 + level / 4);

  // --- Montagem Final do Objeto ---
  return {
    ownerId,
    createdAt: Timestamp.now(),
    name: charData.a || 'Personagem Importado',
    race: data.c?.find((r: any) => r.uuid === charData.b)?.b || '',
    class: data.d?.[0]?.b?.b || '',
    level,
    background: charData['3'] || '',
    alignment: data.b?.find((aln: any) => aln.uuid === charData.c)?.b || '',
    experience: safeParseInt(charData.d, 0),
    inspiration: safeParseInt(charData.k, 0),
    proficiencyBonus,
    armorClass: safeParseInt(charData.p, 10),
    initiative: 0,
    speed: safeParseInt(charData.H, 9), // Ajustado para pegar o valor numérico H se existir
    maxHp: safeParseInt(charData.l, 10),
    currentHp: safeParseInt(charData.j, 10),
    temporaryHp: safeParseInt(charData.t, 0),
    hitDice: data.d?.[0]?.b?.e ? `d${data.d[0].b.e}` : 'd8',
    deathSaves: { successes: 0, failures: 0 },
    attributes,
    savingThrows,
    skills,
    spells,
    inventory: {
      weapons,
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      otherEquipment
    },
    features: data.m?.map((f: any) => ({ name: f.b.d || '', description: f.b.e || '' })) || [],
    personalityTraits: charData['5'] || '',
    ideals: charData['0'] || '',
    bonds: charData['1'] || '',
    flaws: charData['8'] || '',
    notes: charData.C || '',
    imageUrl: imageUrl || '',
  };
}
