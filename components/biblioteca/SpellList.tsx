/**
 * Componente para listar e pesquisar magias
 */

import { Spell } from '@/types';
import { useMemo } from 'react';

interface SpellListProps {
  spells: Spell[];
  selectedSpellId?: string;
  onSelectSpell: (spell: Spell) => void;
  isLoading?: boolean;
}

export default function SpellList({
  spells,
  selectedSpellId,
  onSelectSpell,
  isLoading = false,
}: SpellListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-rpg-gold text-4xl mb-4">✨</div>
          <p className="text-rpg-grey">Carregando magias...</p>
        </div>
      </div>
    );
  }

  if (spells.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-rpg-grey text-sm">Nenhuma magia encontrada com os filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {spells.map(spell => (
        <button
          key={spell.id || spell.name}
          onClick={() => onSelectSpell(spell)}
          className={`w-full text-left p-3 rounded border transition-all ${
            selectedSpellId === (spell.id || spell.name)
              ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-parchment'
              : 'bg-rpg-slate border-rpg-gold/20 hover:border-rpg-gold/50 text-rpg-grey hover:text-rpg-parchment'
          }`}
        >
          <div className="font-bold text-sm">
            {spell.level === 0 ? '✨' : `${spell.level}`} {spell.name}
          </div>
          <p className="text-[10px] text-rpg-grey/70 mt-1">
            {spell.level === 0 ? 'Truque' : `Nível ${spell.level}`} • {spell.school}
            {spell.ritual && ' • Ritual'}
            {spell.concentration && ' • Concentração'}
          </p>
        </button>
      ))}
    </div>
  );
}
