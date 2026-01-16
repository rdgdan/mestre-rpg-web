/**
 * Testes para o hook useSpellFilter
 */

import { renderHook, act } from '@testing-library/react';
import { useSpellFilter } from '@/hooks/useSpellFilter';
import { Spell } from '@/types';

const mockSpells: Spell[] = [
  {
    id: '1',
    name: 'Fireball',
    level: 3,
    school: 'Evocation',
    castingTime: '1 action',
    range: '150 feet',
    components: ['V', 'S', 'M'],
    duration: 'Instantaneous',
    description: 'A bright streak flashes from your pointing finger to a point you choose',
    ritual: false,
    concentration: false,
  },
  {
    id: '2',
    name: 'Magic Missile',
    level: 1,
    school: 'Evocation',
    castingTime: '1 action',
    range: '60 feet',
    components: ['V', 'S'],
    duration: 'Instantaneous',
    description: 'You hurl a mote of glowing energy at a creature',
    ritual: false,
    concentration: false,
  },
  {
    id: '3',
    name: 'Prestidigitation',
    level: 0,
    school: 'Transmutation',
    castingTime: '1 action',
    range: '10 feet',
    components: ['V', 'S'],
    duration: 'Up to 1 hour',
    description: 'This spell is a minor magical trick and a favorite of enchanters',
    ritual: false,
    concentration: false,
  },
];

describe('useSpellFilter', () => {
  it('should initialize with empty spells', () => {
    const { result } = renderHook(() => useSpellFilter());
    expect(result.current.spells).toEqual([]);
    expect(result.current.filteredSpells).toEqual([]);
  });

  it('should filter spells by search query', () => {
    const { result } = renderHook(() => useSpellFilter(mockSpells));

    act(() => {
      result.current.updateSearch('fire');
    });

    expect(result.current.filteredSpells).toHaveLength(1);
    expect(result.current.filteredSpells[0].name).toBe('Fireball');
  });

  it('should filter spells by level', () => {
    const { result } = renderHook(() => useSpellFilter(mockSpells));

    act(() => {
      result.current.updateLevelFilter(0);
    });

    expect(result.current.filteredSpells).toHaveLength(1);
    expect(result.current.filteredSpells[0].level).toBe(0);
  });

  it('should filter spells by school', () => {
    const { result } = renderHook(() => useSpellFilter(mockSpells));

    act(() => {
      result.current.updateSchoolFilter('Transmutation');
    });

    expect(result.current.filteredSpells).toHaveLength(1);
    expect(result.current.filteredSpells[0].school).toBe('Transmutation');
  });

  it('should handle multiple filters together', () => {
    const { result } = renderHook(() => useSpellFilter(mockSpells));

    act(() => {
      result.current.updateLevelFilter(1);
      result.current.updateSchoolFilter('Evocation');
    });

    expect(result.current.filteredSpells).toHaveLength(1);
    expect(result.current.filteredSpells[0].name).toBe('Magic Missile');
  });

  it('should select and deselect spells', () => {
    const { result } = renderHook(() => useSpellFilter(mockSpells));

    act(() => {
      result.current.setSelectedSpell(mockSpells[0]);
    });

    expect(result.current.selectedSpell).toEqual(mockSpells[0]);

    act(() => {
      result.current.setSelectedSpell(null);
    });

    expect(result.current.selectedSpell).toBeNull();
  });
});
