
import { Timestamp } from 'firebase/firestore';
import { ATTRIBUTE_KEYS, SKILLS, AttributeKey } from './character-data';

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
  'animal handling': 'animalhandling', 'adestrar animais': 'animalhandling', 'lidar com animais': 'animalhandling',
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
  'persuasion': 'persuasion', 'persuasão': 'persuasion', 'persuasao': 'persuasion',
  'religion': 'religion', 'religião': 'religion', 'religiao': 'religion',
  'sleight of hand': 'sleightofhand', 'prestidigitação': 'sleightofhand', 'prestidigitacao': 'sleightofhand',
  'stealth': 'stealth', 'furtividade': 'stealth',
  'survival': 'survival', 'sobrevivência': 'survival', 'sobrevivencia': 'survival',
};

const normalizeKey = (key: string): string => {
    if (!key) return '';
    return key.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
}

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
  const spells = data.l?.map((spell: any) => ({
    name: spell.b?.d || 'Magia Desconhecida',
    description: spell.b?.e || 'Sem descrição.',
    level: safeParseInt(spell.b?.c, 0),
    school: spell.b?.f || '',
    castingTime: spell.b?.g || '',
    range: spell.b?.h || '',
    components: spell.b?.i || '',
    duration: spell.b?.j || '',
    prepared: !!spell.a?.d || false,
  })) || [];

  // --- INFORMAÇÕES BÁSICAS ---
  const level = safeParseInt(charData.g, 1);
  const proficiencyBonus = Math.ceil(1 + level / 4);

  // --- Montagem Final do Objeto (à prova de falhas) ---
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
    speed: '9m',
    maxHp: safeParseInt(charData.l, 10),
    currentHp: safeParseInt(charData.j, 10),
    temporaryHp: safeParseInt(charData.t, 0),
    hitDice: data.d?.[0]?.b?.e ? `d${data.d[0].b.e}` : 'd8',
    deathSaves: { successes: 0, failures: 0 },
    attributes,
    savingThrows,
    skills,
    spells, // Adicionado
    equipment: data.i?.map((item: any) => `${item.a.c}x ${item.b.u}`).join('\n') || '',
    features: data.m?.map((f: any) => ({ name: f.b.d || '', description: f.b.e || '' })) || [],
    personalityTraits: charData['5'] || '',
    ideals: charData['0'] || '',
    bonds: charData['1'] || '',
    flaws: charData['8'] || '',
    notes: charData.C || '',
    attacks: [],
    imageUrl: imageUrl || '',
    // spellcasting info será setado com valores padrão da ficha em branco
  };
}
