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
  spellSlots: Record<string, { current: number; max: number }>;
  pactLevel?: number;
  characterClass: string;
  characterLevel: number;
  spellType?: 'cantrip' | 'spell' | null;
}

const UseSpellModal: React.FC<UseSpellModalProps> = ({
  isOpen,
  onClose,
  onUseSpell,
  spells,
  spellSlots,
  pactLevel = 0,
  characterClass,
  characterLevel,
  spellType = null,
}) => {
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);

  const isPreparationClass = useMemo(() => requiresPreparation(characterClass), [characterClass]);

  const availableSpells = useMemo(() => {
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
    const lvlKey = level.toString();
    const normalSlots = spellSlots[lvlKey]?.current || 0;
    const pactSlots = spellSlots['pact']?.current || 0;

    return normalSlots > 0 || (level <= pactLevel && pactSlots > 0);
  }, [selectedSpell, spellSlots, pactLevel]);

  // Verificar se pode conjurar (slots + preparação se necessário)
  const canCastSelected = useMemo(() => {
    if (!selectedSpell) return false;
    if (selectedSpell.level === 0) return true;

    if (isPreparationClass && !selectedSpell.prepared) return false;
    return hasSlotsForSelected;
  }, [selectedSpell, isPreparationClass, hasSlotsForSelected]);

  const handleUseSpell = () => {
    if (!selectedSpell || !canCastSelected) return;
    onUseSpell(selectedSpell, 1);
    setSelectedSpellId(null);
    onClose();
  };

  const renderSpellProperty = (prop: any) => {
    if (!prop) return '-';
    if (typeof prop === 'string') return prop;
    if (typeof prop === 'object') {
      if (prop.distance) return `${prop.distance} ${prop.type || ''}`;
      if (prop.type) return prop.type;
      return JSON.stringify(prop);
    }
    return String(prop);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-rpg-panel border border-purple-500/30 rounded-lg w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-rpg-panel p-4 border-b border-purple-500/20 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-purple-300 font-cinzel">
              {spellType === 'cantrip' ? '✨ Selecionar Truque' : '🔮 Selecionar Magia'}
            </h2>
            <button onClick={onClose} className="text-rpg-grey hover:text-rpg-gold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-rpg-grey mt-1 uppercase tracking-widest font-semibold opacity-60">
            {spellType === 'cantrip' ? 'Escolha um truque ilimitado' : 'Escolha uma magia que consome slot'}
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {availableSpells.length === 0 ? (
            <div className="text-center py-12 text-rpg-grey/50">
              <p className="text-4xl mb-4">📜</p>
              <p className="text-sm italic font-medieval">Nenhuma magia aprendida deste tipo.</p>
            </div>
          ) : (
            availableSpells.map((spell) => {
              const isSelected = selectedSpellId === spell.id;
              const level = spell.level || 0;
              const lvlKey = level.toString();

              const normalSlots = spellSlots[lvlKey]?.current || 0;
              const pactSlots = spellSlots['pact']?.current || 0;
              const canUsePact = level > 0 && level <= pactLevel && pactSlots > 0;

              const isPrepared = level === 0 || !isPreparationClass || spell.prepared;
              const hasSlots = level === 0 || normalSlots > 0 || canUsePact;
              const canCast = isPrepared && hasSlots;

              return (
                <button
                  key={spell.id}
                  onClick={() => setSelectedSpellId(spell.id)}
                  className={`w-full p-3 rounded border text-left transition-all ${isSelected
                    ? 'bg-purple-600/30 border-purple-400 text-purple-100 shadow-glow-purple/10'
                    : 'bg-black/20 text-rpg-grey border-purple-500/10 hover:bg-purple-900/10'
                    } ${!canCast && !isSelected ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm ${isSelected ? 'text-rpg-gold' : 'text-rpg-parchment'}`}>{spell.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${level === 0 ? 'bg-green-900/40 text-green-300' : 'bg-purple-900/40 text-purple-300'}`}>
                      {level === 0 ? 'Truque' : `Nível ${level}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-rpg-grey/60 uppercase">{spell.school}</span>
                    <span className={canCast ? (level === 0 ? 'text-green-400' : 'text-purple-400') : 'text-rpg-red font-bold'}>
                      {level === 0 ? '∞ Ilimitado' : hasSlots ? (
                        <>
                          {normalSlots > 0 ? `${normalSlots} slot(s)` : `${pactSlots} slot(s) de Pacto`}
                          {!isPrepared && <span className="ml-2 text-rpg-red font-bold">[NÃO PREPARADA]</span>}
                        </>
                      ) : 'Sem Slots'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedSpell && (
          <div className="p-4 border-t border-purple-500/10 bg-black/40 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-xs font-bold text-rpg-gold uppercase tracking-widest mb-2 font-cinzel">Detalhes do Encantamento</h3>
            <p className="text-xs text-rpg-grey leading-relaxed mb-4 italic line-clamp-3">{selectedSpell.description}</p>

            <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-tighter">
              <div>
                <span className="text-rpg-grey/50 block">Conjuração:</span>
                <p className="text-purple-300 font-bold">{renderSpellProperty(selectedSpell.castingTime)}</p>
              </div>
              <div>
                <span className="text-rpg-grey/50 block">Alcance:</span>
                <p className="text-purple-300 font-bold">{renderSpellProperty(selectedSpell.range)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-rpg-panel p-4 border-t border-purple-500/20 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded bg-rpg-slate/50 text-rpg-grey hover:text-rpg-parchment transition-all text-xs font-bold uppercase tracking-widest font-cinzel"
          >
            Fechar
          </button>
          <button
            onClick={handleUseSpell}
            disabled={!selectedSpell || !canCastSelected}
            className={`flex-[2] px-4 py-2.5 rounded font-bold text-xs uppercase tracking-widest font-cinzel transition-all ${selectedSpell && canCastSelected
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple/40'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
          >
            {canCastSelected ? 'Conjurar ✨' : !selectedSpell ? 'Escolha uma 🔮' : (!isPreparationClass || selectedSpell.prepared || selectedSpell.level === 0) ? 'Sem Slots 🚫' : 'Não Preparada 🚫'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseSpellModal;
