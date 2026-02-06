// Exibidor de Slots de Magia para Combate
// Mostra slots disponíveis com botões para usar

import React, { useState } from 'react';
import { Spell } from '@/lib/spells-data';
import { formatSpellSlotsDisplay, getMaxSpellSlotsForCharacter } from '@/lib/spell-usage';
import UseSpellModal from './UseSpellModal';

interface SpellSlotsDisplayProps {
  spellSlots: Record<string, { current: number; max: number }>;
  pactLevel?: number;
  characterClass: string;
  characterLevel: number;
  spells: Spell[];
  onUseSpell: (spell: Spell, slotsCost: number) => void;
  compact?: boolean;
}

const SpellSlotsDisplay: React.FC<SpellSlotsDisplayProps> = ({
  spellSlots,
  pactLevel = 0,
  characterClass,
  characterLevel,
  spells,
  onUseSpell,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [spellType, setSpellType] = useState<'cantrip' | 'spell' | null>(null);

  // Filtrar apenas níveis com slots ou pacto
  const availableLevels = Object.keys(spellSlots)
    .filter(k => k !== 'pactLevel' && k !== '0') // Truques são tratados separadamente ou mostrados só se quiser
    .sort((a, b) => {
      if (a === 'pact') return 1;
      if (b === 'pact') return -1;
      return Number(a) - Number(b);
    });

  // Sempre incluir nível 0 de forma implícita se houver magias ou se for desejado
  if (!availableLevels.includes('0')) availableLevels.unshift('0');

  if (compact) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Slots Disponíveis:</p>
        <div className="flex flex-wrap gap-1">
          {availableLevels.map((lvlKey) => {
            const level = lvlKey === 'pact' ? (pactLevel || 0) : Number(lvlKey);
            const info = spellSlots[lvlKey] || { current: 0, max: 0 };
            if (lvlKey !== '0' && info.max === 0) return null;

            return (
              <span
                key={lvlKey}
                className={`text-[10px] px-2 py-1 rounded font-bold ${lvlKey === '0'
                  ? 'bg-green-900/60 text-green-200'
                  : info.current > 0
                    ? 'bg-purple-900/60 text-purple-200'
                    : 'bg-gray-800 text-gray-500'
                  }`}
              >
                {lvlKey === '0' ? '🔮 Truques: ∞' : lvlKey === 'pact' ? `Pacto (Nv ${level}): ${info.current}/${info.max}` : `Nv ${level}: ${info.current}/${info.max}`}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
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
          {availableLevels.map((lvlKey) => {
            const info = spellSlots[lvlKey] || { current: 0, max: 0 };
            if (lvlKey !== '0' && info.max === 0) return null;

            const isPact = lvlKey === 'pact';
            const level = isPact ? pactLevel : Number(lvlKey);
            const isEmpty = lvlKey !== '0' && info.current === 0;

            return (
              <div
                key={lvlKey}
                className={`p-3 rounded border text-center transition-all ${lvlKey === '0'
                  ? 'bg-green-900/30 border-green-500/40'
                  : isPact
                    ? 'bg-purple-900/50 border-purple-400/60 shadow-lg shadow-purple-900/20'
                    : isEmpty
                      ? 'bg-gray-900/30 border-gray-500/40'
                      : 'bg-purple-900/30 border-purple-500/40'
                  }`}
              >
                <p className={`text-xs mb-1 uppercase tracking-wider font-bold ${isPact ? 'text-purple-200' : 'text-rpg-grey/70'}`}>
                  {lvlKey === '0' ? 'Truques' : isPact ? `Pacto (Nv ${level})` : `Nível ${level}`}
                </p>
                <p className={`text-lg font-bold ${lvlKey === '0'
                  ? 'text-green-300'
                  : isPact
                    ? 'text-purple-100 text-xl'
                    : isEmpty
                      ? 'text-gray-400'
                      : 'text-purple-300'
                  }`}>
                  {lvlKey === '0' ? '∞' : `${info.current}/${info.max}`}
                </p>
                {isPact && (
                  <span className="text-[9px] text-purple-300/60 block -mt-1 capitalize">Recupera no descanso curto</span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-rpg-grey/60 mt-3 italic">
          ⚠️ Truques não consomem slots. Magias normais consomem 1 slot do seu nível.
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
        spellSlots={spellSlots}
        pactLevel={pactLevel}
        characterClass={characterClass}
        spellType={spellType}
        characterLevel={characterLevel}
      />
    </>
  );
};

export default SpellSlotsDisplay;
