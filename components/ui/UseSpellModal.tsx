// Modal para Usar Magia Durante Combate
// Permite selecionar qual magia usar e verifica slots disponíveis

import React, { useState, useMemo } from 'react';
import { Spell } from '@/lib/spells-data';
import { formatSpellSlotsDisplay, canUseSpell } from '@/lib/spell-usage';

interface UseSpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseSpell: (spell: Spell, slotsCost: number) => void;
  spells: Spell[];
  spellSlotsCurrent: Record<number, number>;
  characterClass: string;
  characterLevel: number;
  spellType?: 'cantrip' | 'spell' | null;
}

const UseSpellModal: React.FC<UseSpellModalProps> = ({
  isOpen,
  onClose,
  onUseSpell,
  spells,
  spellSlotsCurrent,
  characterClass,
  characterLevel,
  spellType = null,
}) => {
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);

  const availableSpells = useMemo(() => {
    let filtered = spells.filter(s => canUseSpell(spellSlotsCurrent, s));
    
    // Aplicar filtro por tipo
    if (spellType === 'cantrip') {
      filtered = filtered.filter(s => s.level === 0 || s.level === undefined);
    } else if (spellType === 'spell') {
      filtered = filtered.filter(s => (s.level || 0) > 0);
    }
    
    return filtered;
  }, [spells, spellSlotsCurrent, spellType]);

  const selectedSpell = useMemo(() => {
    return availableSpells.find(s => s.id === selectedSpellId);
  }, [availableSpells, selectedSpellId]);

  const handleUseSpell = () => {
    if (!selectedSpell) return;
    onUseSpell(selectedSpell, 1);
    setSelectedSpellId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-rpg-panel border border-purple-500/30 rounded-lg w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-b from-purple-900/50 to-transparent p-4 border-b border-purple-500/20">
          <h2 className="text-lg font-bold text-purple-300 font-cinzel">
            {spellType === 'cantrip' ? '✨ Selecionar Truque' : spellType === 'spell' ? '🔮 Selecionar Magia' : '🔮 Selecionar Magia'}
          </h2>
          <p className="text-xs text-rpg-grey mt-1">
            {spellType === 'cantrip' ? 'Escolha um truque para conjurar' : 'Escolha uma magia para conjurar'}
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {availableSpells.length === 0 ? (
            <div className="text-center py-8 text-rpg-grey/50">
              <p className="text-sm">❌ Nenhuma magia disponível</p>
              <p className="text-xs mt-2">Todos os seus slots estão esgotados!</p>
            </div>
          ) : (
            availableSpells.map((spell) => {
              const isSelected = selectedSpellId === spell.id;
              const maxSlots = spell.level === 0 ? Infinity : (spellSlotsCurrent[spell.level] || 0);
              const currentSlots = spell.level === 0 ? '∞' : spellSlotsCurrent[spell.level]?.toString() || '0';

              return (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpellId(spell.id)}
                  className={`w-full p-3 rounded border text-left transition-all ${
                    isSelected
                      ? 'bg-purple-600/40 border-purple-400 text-purple-100'
                      : 'bg-black/30 border-purple-500/20 text-rpg-grey hover:border-purple-500/40 hover:bg-purple-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-amber-300">{spell.name}</span>
                    <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded">
                      Nível {spell.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rpg-grey/70">{spell.school || 'Magia'}</span>
                    <span className={spell.level === 0 ? 'text-green-400' : 'text-purple-300'}>
                      {currentSlots} slot{currentSlots !== '1' && currentSlots !== '∞' ? 's' : ''}
                    </span>
                  </div>
                  {spell.concentration && (
                    <p className="text-[10px] text-blue-300 mt-1">⭐ Requer Concentração</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {selectedSpell && (
          <div className="p-4 border-t border-purple-500/20 bg-black/40">
            <h3 className="text-sm font-bold text-amber-300 mb-2">Descrição</h3>
            <p className="text-xs text-rpg-grey leading-relaxed mb-4">{selectedSpell.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              {selectedSpell.castingTime && (
                <div>
                  <span className="text-rpg-grey/70">Tempo:</span>
                  <p className="text-purple-300 font-bold">{selectedSpell.castingTime}</p>
                </div>
              )}
              {selectedSpell.range && (
                <div>
                  <span className="text-rpg-grey/70">Alcance:</span>
                  <p className="text-purple-300 font-bold">{selectedSpell.range}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-gradient-to-t from-rpg-panel to-transparent p-4 border-t border-purple-500/20 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-rpg-slate text-rpg-grey hover:bg-rpg-dark transition-colors text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handleUseSpell}
            disabled={!selectedSpell}
            className={`flex-1 px-4 py-2 rounded font-bold text-sm transition-all ${
              selectedSpell
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Conjurar ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseSpellModal;
