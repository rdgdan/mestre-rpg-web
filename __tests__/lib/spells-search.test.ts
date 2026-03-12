import { searchSpells } from '../../lib/spells-data';
import { Spell } from '../../types';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {}
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn()
}));

const mockSpells: Spell[] = [
  {
    id: '1',
    name: 'Aljava Veloz',
    level: 5,
    school: 'Evocation',
    castingTime: '1 action',
    range: 'Self',
    components: 'V, S',
    duration: 'Concentration, up to 1 minute',
    description: 'Ranger spell',
    ritual: false,
    concentration: true,
    classes: ['Guardião']
  },
  {
    id: '2',
    name: 'Rajada Mística',
    level: 0,
    school: 'Evocation',
    castingTime: '1 action',
    range: '120 feet',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Warlock cantrip',
    ritual: false,
    concentration: false,
    classes: ['Bruxo']
  },
  {
    id: '3',
    name: 'Chicote de Espinhos',
    level: 0,
    school: 'Transmutation',
    castingTime: '1 action',
    range: '30 feet',
    components: 'V, S, M',
    duration: 'Instantaneous',
    description: 'Druid cantrip',
    ritual: false,
    concentration: false,
    classes: ['Druida']
  },
  {
    id: '4',
    name: 'Magia Customizada',
    level: 1,
    school: 'CUSTOM',
    castingTime: '1 action',
    range: 'Touch',
    components: 'V',
    duration: '1 minute',
    description: 'Homebrew',
    ritual: false,
    concentration: false,
    classes: ['Mago']
  },
  {
    id: '5',
    name: 'Sem Classe',
    level: 1,
    school: 'Abjuration',
    castingTime: '1 action',
    range: 'Self',
    components: 'V',
    duration: '1 minute',
    description: 'No classes defined',
    ritual: false,
    concentration: false,
    classes: []
  },
  {
    id: '6',
    name: 'Patrulheiro Antigo',
    level: 1,
    school: 'Divination',
    castingTime: '1 action',
    range: 'Self',
    components: 'V',
    duration: '1 minute',
    description: 'Old format',
    ritual: false,
    concentration: false,
    classes: ['Patrulheiro']
  }
];

describe('searchSpells logic', () => {
  it('should filter by source: Global (books)', () => {
    const results = searchSpells('', { source: 'global' }, mockSpells);
    expect(results.some(s => s.name === 'Aljava Veloz')).toBe(true);
    expect(results.some(s => s.name === 'Magia Customizada')).toBe(false);
  });

  it('should filter by source: Custom (homebrew)', () => {
    const results = searchSpells('', { source: 'custom' }, mockSpells);
    expect(results.some(s => s.name === 'Magia Customizada')).toBe(true);
    expect(results.some(s => s.name === 'Aljava Veloz')).toBe(false);
  });

  it('should filter strictly by class (empty classes should not show up)', () => {
    const results = searchSpells('', { class: 'Mago' }, mockSpells);
    expect(results.some(s => s.name === 'Magia Customizada')).toBe(true);
    expect(results.some(s => s.name === 'Sem Classe')).toBe(false);
  });

  it('should handle Guardião equivalent classes (Patrulheiro)', () => {
    const results = searchSpells('', { class: 'Guardião' }, mockSpells);
    expect(results.some(s => s.name === 'Aljava Veloz')).toBe(true);
    expect(results.some(s => s.name === 'Patrulheiro Antigo')).toBe(true);
  });

  it('should allow Guardião to see Druid cantrips (level 0)', () => {
    const results = searchSpells('', { class: 'Guardião', level: 0 }, mockSpells);
    expect(results.some(s => s.name === 'Chicote de Espinhos')).toBe(true);
  });

  it('should NOT allow Guardião to see Druid spells of level > 0', () => {
    const results = searchSpells('', { class: 'Guardião', level: 1 }, mockSpells);
    // Assuming there were druid spells of level 1, they would not show up unless also ranger
    expect(results.some(s => s.name === 'Chicote de Espinhos')).toBe(false);
  });
});
