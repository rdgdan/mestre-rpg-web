/**
 * Hook customizado para filtrar e gerenciar magias
 * Reutilizável em múltiplos componentes
 */

import { useState, useMemo, useCallback } from 'react';
import { Spell } from '@/types';
import { spellsDatabase } from '@/lib/spells-data';

export interface SpellFilters {
  searchQuery: string;
  levelFilter?: number;
  schoolFilter?: string;
  ritualOnly: boolean;
  concentrationOnly: boolean;
}

export const useSpellFilter = (initialSpells: Spell[] = []) => {
  const [spells, setSpells] = useState<Spell[]>(initialSpells);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [filters, setFilters] = useState<SpellFilters>({
    searchQuery: '',
    ritualOnly: false,
    concentrationOnly: false,
  });

  // Filtrar magias baseado nos critérios
  const filteredSpells = useMemo(() => {
    return spells.filter(spell => {
      const matchesSearch = spell.name
        .toLowerCase()
        .includes(filters.searchQuery.toLowerCase()) ||
        spell.description
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase());

      const matchesLevel =
        filters.levelFilter === undefined ||
        spell.level === filters.levelFilter;

      const matchesSchool =
        !filters.schoolFilter ||
        spell.school === filters.schoolFilter;

      const matchesRitual =
        !filters.ritualOnly || spell.ritual;

      const matchesConcentration =
        !filters.concentrationOnly || spell.concentration;

      return (
        matchesSearch &&
        matchesLevel &&
        matchesSchool &&
        matchesRitual &&
        matchesConcentration
      );
    });
  }, [spells, filters]);

  const updateSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const updateLevelFilter = useCallback((level?: number) => {
    setFilters(prev => ({ ...prev, levelFilter: level }));
  }, []);

  const updateSchoolFilter = useCallback((school?: string) => {
    setFilters(prev => ({ ...prev, schoolFilter: school }));
  }, []);

  const toggleRitualOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, ritualOnly: !prev.ritualOnly }));
  }, []);

  const toggleConcentrationOnly = useCallback(() => {
    setFilters(prev => ({ ...prev, concentrationOnly: !prev.concentrationOnly }));
  }, []);

  return {
    spells,
    setSpells,
    filteredSpells,
    selectedSpell,
    setSelectedSpell,
    filters,
    updateSearch,
    updateLevelFilter,
    updateSchoolFilter,
    toggleRitualOnly,
    toggleConcentrationOnly,
  };
};
