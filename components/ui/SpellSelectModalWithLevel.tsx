import React, { useState, useEffect } from 'react';
import { fetchGlobalSpells, searchSpells, Spell } from '@/lib/spells-data';
import { getMaxSpellSlots } from '@/lib/spell-slots';

interface SpellSelectModalWithLevelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (spell: Spell) => void;
  onCreate: () => void;
  filterClass?: string;
  characterLevel?: number;
  characterClass?: string;
}

const SpellSelectModalWithLevel: React.FC<SpellSelectModalWithLevelProps> = ({
  isOpen,
  onClose,
  onSelect,
  onCreate,
  filterClass,
  characterLevel = 1,
  characterClass
}) => {
  const [search, setSearch] = useState('');
  const [globalSpells, setGlobalSpells] = useState<Spell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchGlobalSpells().then(spells => {
        setGlobalSpells(spells);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // Filtrar magias com base em nível (truques inclusos)
  const availableLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const filtered = searchSpells(search, {
    class: filterClass,
    level: selectedLevel
  }, [...globalSpells]).filter(spell => {
    // Se filtro de nível está ativo, filtra por nível
    if (selectedLevel !== undefined) {
      return spell.level === selectedLevel;
    }
    // Se tem classe de filtro, apenas mostra níveis permitidos
    if (filterClass) {
      const maxSlots = getMaxSpellSlots(filterClass, characterLevel, spell.level);
      return maxSlots > 0;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/10 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-rpg-gold mb-4 font-cinzel">✨ Adicionar Magia ao Grimório</h2>

          {/* Filtros */}
          <div className="space-y-3 sm:space-y-0 sm:flex gap-3">
            {/* Busca */}
            <input
              type="text"
              className="flex-1 p-2 sm:p-3 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment text-sm placeholder-rpg-grey/50 focus:border-rpg-gold focus:outline-none"
              placeholder="Buscar magia..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />

            {/* Filtro de Nível */}
            <select
              value={selectedLevel ?? ''}
              onChange={e => setSelectedLevel(e.target.value === '' ? undefined : Number(e.target.value))}
              className="p-2 sm:p-3 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment text-sm focus:border-rpg-gold focus:outline-none font-cinzel font-bold uppercase tracking-wider"
            >
              <option value="">Todos os Níveis</option>
              <option value="0">🌟 Truques</option>
              {availableLevels.filter(l => l > 0).map(level => (
                <option key={level} value={level}>Nível {level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin text-rpg-gold text-4xl mb-4">✨</div>
                <p className="text-rpg-grey">Carregando magias...</p>
              </div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(spell => (
                <button
                  key={spell.id}
                  onClick={() => {
                    onSelect(spell);
                    onClose();
                  }}
                  className="w-full p-3 sm:p-4 bg-rpg-slate/80 border border-rpg-gold/20 hover:border-rpg-gold/50 rounded-lg text-left transition-all hover:bg-rpg-slate active:scale-95"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-rpg-parchment font-medieval text-base sm:text-lg truncate">{spell.name}</div>
                      <div className="text-xs sm:text-sm text-rpg-grey mt-1">{spell.school}</div>
                    </div>
                    <span className="text-xs text-purple-300 uppercase tracking-widest font-bold whitespace-nowrap ml-2">
                      {spell.level === 0 ? '🌟 TRUQUE' : `Nível ${spell.level}`}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-rpg-grey/80 line-clamp-2 mt-2">{spell.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-rpg-grey italic text-sm">Nenhuma magia encontrada com os filtros aplicados.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-rpg-panel border-t border-rpg-gold/10 p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={onCreate}
            className="px-4 py-2 sm:py-3 rounded bg-rpg-slate text-rpg-parchment border border-rpg-gold/20 hover:border-rpg-gold/40 font-bold text-sm transition-all order-2 sm:order-1"
          >
            ✏️ Criar Magia Customizada
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 sm:py-3 rounded bg-rpg-dark text-rpg-grey border border-rpg-gold/20 hover:border-rpg-gold/40 font-bold text-sm transition-all order-1 sm:order-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpellSelectModalWithLevel;
