// Exibidor de Slots de Magia para Combate
// Mostra slots disponíveis com botões para usar

import React, { useState } from 'react';
import { Spell } from '@/lib/spells-data';
import { formatSpellSlotsDisplay, getMaxSpellSlotsForCharacter } from '@/lib/spell-usage';
import UseSpellModal from './UseSpellModal';

interface SpellSlotsDisplayProps {
  spellSlotsCurrent: Record<number, number>;
  characterClass: string;
  characterLevel: number;
  spells: Spell[];
  onUseSpell: (spell: Spell, slotsCost: number) => void;
  compact?: boolean;
}

const SpellSlotsDisplay: React.FC<SpellSlotsDisplayProps> = ({
  spellSlotsCurrent,
  characterClass,
  characterLevel,
  spells,
  onUseSpell,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [spellType, setSpellType] = useState<'cantrip' | 'spell' | null>(null);
  const maxSlots = getMaxSpellSlotsForCharacter(characterClass, characterLevel);

  // Filtrar apenas níveis com slots
  const availableLevels = Object.keys(maxSlots)
    .map(Number)
    .filter(level => maxSlots[level] > 0)
    .sort((a, b) => a - b);

  if (compact) {
    // Versão compacta: apenas mostra resumo
    return (
      <div className="space-y-1">
        <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Slots Disponíveis:</p>
        <div className="flex flex-wrap gap-1">
          {availableLevels.map((level) => {
            const current = spellSlotsCurrent[level] ?? maxSlots[level];
            const max = maxSlots[level];
            const display = formatSpellSlotsDisplay(level, current, max);

            return (
              <span
                key={level}
                className={`text-[10px] px-2 py-1 rounded font-bold ${level === 0
                  ? 'bg-green-900/60 text-green-200'
                  : current > 0
                    ? 'bg-purple-900/60 text-purple-200'
                    : 'bg-gray-800 text-gray-500'
                  }`}
              >
                {level === 0 ? '🔮 Truques: ∞' : `Nível ${level}: ${display}`}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Calcular slots efetivos (combinando atuais com máximos)
  const effectiveSlots = React.useMemo(() => {
    const effective: Record<number, number> = { 0: Infinity };
    Object.keys(maxSlots).forEach(k => {
      const lvl = Number(k);
      effective[lvl] = spellSlotsCurrent[lvl] ?? maxSlots[lvl];
    });
    return effective;
  }, [spellSlotsCurrent, maxSlots]);

  // Versão completa: mostra com botão de usar
  return (
    <>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        {/* ... (código existente da view) ... */}
        {/* Manter apenas o bloco de view, removendo códigos antigos se necessário, mas o foco é o return do componente */}
        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest">Slots de Magia</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSpellType('cantrip');
                setShowModal(true);
              }}
              className="text-base bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-bold transition-colors shadow-lg hover:shadow-xl"
            >
              ✨ Truque
            </button>
            <button
              onClick={() => {
                setSpellType('spell');
                setShowModal(true);
              }}
              className="text-base bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded font-bold transition-colors shadow-lg hover:shadow-xl"
            >
              🔮 Magia
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableLevels.map((level) => {
            const current = spellSlotsCurrent[level] ?? maxSlots[level];
            const max = maxSlots[level];
            const display = formatSpellSlotsDisplay(level, current, max);
            const isPact = level === 100;
            const isEmpty = level !== 0 && current === 0;

            return (
              <div
                key={level}
                className={`p-3 rounded border text-center transition-all ${level === 0
                  ? 'bg-green-900/30 border-green-500/40'
                  : isPact
                    ? 'bg-purple-900/50 border-purple-400/60 shadow-lg shadow-purple-900/20'
                    : isEmpty
                      ? 'bg-gray-900/30 border-gray-500/40'
                      : 'bg-purple-900/30 border-purple-500/40'
                  }`}
              >
                <p className={`text-xs mb-1 uppercase tracking-wider font-bold ${isPact ? 'text-purple-200' : 'text-rpg-grey/70'}`}>
                  {level === 0 ? 'Truques' : isPact ? 'Pacto' : `Nível ${level}`}
                </p>
                <p className={`text-lg font-bold ${level === 0
                  ? 'text-green-300'
                  : isPact
                    ? 'text-purple-100 text-xl'
                    : isEmpty
                      ? 'text-gray-400'
                      : 'text-purple-300'
                  }`}>
                  {display}
                </p>
                {isPact && (
                  <span className="text-[9px] text-purple-300/60 block -mt-1 capitalize">Recupera no descanso curto</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-rpg-grey/60 mt-3 italic">
          ⚠️ Slots só recuperam com descanso longo
        </p>
      </div>

      <UseSpellModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUseSpell={(spell, cost) => {
          onUseSpell(spell, cost);
          setShowModal(false);
        }}
        spells={spells}
        spellSlotsCurrent={effectiveSlots}
        characterClass={characterClass}
        spellType={spellType}
        characterLevel={characterLevel}
      />
    </>
  );
};

export default SpellSlotsDisplay;
