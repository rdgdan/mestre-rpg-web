// Modal para Usar Magia Durante Combate
// Permite selecionar qual magia usar e verifica slots disponíveis

import React, { useState, useMemo } from 'react';
import { Spell } from '@/lib/spells-data';
import { formatSpellSlotsDisplay, canUseSpell, requiresPreparation } from '@/lib/spell-usage';

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

  const isPreparationClass = useMemo(() => requiresPreparation(characterClass), [characterClass]);

  const availableSpells = useMemo(() => {
    // Filtrar apenas por tipo, mostrando todas as magias aprendidas
    let filtered = spells;

    if (spellType === 'cantrip') {
      filtered = filtered.filter(s => s.level === 0 || s.level === undefined);
    } else if (spellType === 'spell') {
      filtered = filtered.filter(s => (s.level || 0) > 0);
    }

    return filtered;
  }, [spells, spellType]);

  const selectedSpell = useMemo(() => {
    return availableSpells.find(s => s.id === selectedSpellId);
  }, [availableSpells, selectedSpellId]);

  // Verificar se tem slots para a magia selecionada
  const hasSlotsForSelected = useMemo(() => {
    if (!selectedSpell) return false;
    if (selectedSpell.level === 0) return true;

    const level = selectedSpell.level || 1;
    const normalSlots = spellSlotsCurrent[level] || 0;
    const pactSlots = spellSlotsCurrent[100] || 0;

    return normalSlots > 0 || pactSlots >= level; // Pacto cobre qualquer nível igual ou menor
  }, [selectedSpell, spellSlotsCurrent]);

  // Verificar se pode conjurar (slots + preparação se necessário)
  const canCastSelected = useMemo(() => {
    if (!selectedSpell) return false;
    if (selectedSpell.level === 0) return true;

    // Se a classe exige preparação e a magia não está preparada, não pode conjurar
    if (isPreparationClass && !selectedSpell.prepared) return false;

    return hasSlotsForSelected;
  }, [selectedSpell, isPreparationClass, hasSlotsForSelected]);

  const handleUseSpell = () => {
    if (!selectedSpell || !canCastSelected) return;
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
              <p className="text-sm">❌ Nenhuma magia aprendida</p>
              <p className="text-xs mt-2">Você ainda não aprendeu magias deste tipo!</p>
            </div>
          ) : (
            availableSpells.map((spell) => {
              const isSelected = selectedSpellId === spell.id;

              const level = spell.level || 1;
              const normalSlots = spellSlotsCurrent[level] || 0;
              const pactSlots = spellSlotsCurrent[100] || 0;

              const hasNormal = normalSlots > 0;
              // Verifica se a magia está preparada (se necessário)
              const isPrepared = spell.level === 0 || !isPreparationClass || spell.prepared;

              // Verifica disponibilidade localmente para o item da lista
              const hasSlots = level === 0 || hasNormal || pactSlots >= level;
              const canCast = isPrepared && hasSlots;

              const currentSlotsDisplay = level === 0
                ? '∞'
                : hasNormal
                  ? normalSlots.toString()
                  : pactSlots.toString();

              const isPact = !hasNormal && pactSlots > 0;

              return (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpellId(spell.id)}
                  className={`w-full p-3 rounded border text-left transition-all ${isSelected
                    ? 'bg-purple-600/40 border-purple-400 text-purple-100'
                    : 'bg-black/30 text-rpg-grey hover:bg-purple-900/10'
                    } ${!canCast && !isSelected ? 'opacity-50 grayscale border-gray-800' : 'border-purple-500/20'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm ${hasSlots ? 'text-amber-300' : 'text-gray-500'}`}>{spell.name}</span>
                    <span className="text-[10px] bg-purple-900/60 px-2 py-0.5 rounded">
                      Nível {spell.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-rpg-grey/70">{spell.school || 'Magia'}</span>
                    <span className={canCast ? (spell.level === 0 ? 'text-green-400' : 'text-purple-300') : 'text-red-500 font-bold'}>
                      {hasSlots ? (
                        <>
                          {currentSlotsDisplay} slot{currentSlotsDisplay !== '1' && currentSlotsDisplay !== '∞' ? 's' : ''} {isPact && '(Pacto)'}
                          {!isPrepared && <span className="ml-2 text-red-400 font-bold">[NÃO PREPARADA]</span>}
                        </>
                      ) : 'Sem Slots'}
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

            {/* Função Helper para Renderizar Propriedades sem Quebrar */}
            {(() => {
              const renderSpellProperty = (prop: any) => {
                if (!prop) return '-';
                if (typeof prop === 'string') return prop;
                if (typeof prop === 'object') {
                  // Tenta extrair valores comuns ou retorna JSON stringificado seguro
                  return prop.distance
                    ? `${prop.distance} ${prop.type || ''}`
                    : (prop.type || JSON.stringify(prop));
                }
                return String(prop);
              };

              return (
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  {selectedSpell.castingTime && (
                    <div>
                      <span className="text-rpg-grey/70">Tempo:</span>
                      <p className="text-purple-300 font-bold">{renderSpellProperty(selectedSpell.castingTime)}</p>
                    </div>
                  )}
                  {selectedSpell.range && (
                    <div>
                      <span className="text-rpg-grey/70">Alcance:</span>
                      <p className="text-purple-300 font-bold">{renderSpellProperty(selectedSpell.range)}</p>
                    </div>
                  )}
                </div>
              );
            })()}
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
            disabled={!selectedSpell || !canCastSelected}
            className={`flex-1 px-4 py-2 rounded font-bold text-sm transition-all ${selectedSpell && canCastSelected
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
          >
            {canCastSelected ? 'Conjurar ✨' : !selectedSpell ? 'Selecionar 🔮' : !isPreparationClass || selectedSpell.prepared ? 'Sem Slots 🚫' : 'Não Preparada 🚫'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default UseSpellModal;
