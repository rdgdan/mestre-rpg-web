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
        <p className="text-xs font-bold text-rpg-gold uppercase tracking-widest">Slots Disponíveis:</p>
        <div className="flex flex-wrap gap-1">
          {availableLevels.map((lvlKey) => {
            const level = lvlKey === 'pact' ? (pactLevel || 0) : Number(lvlKey);
            const info = spellSlots[lvlKey] || { current: 0, max: 0 };
            if (lvlKey !== '0' && info.max === 0) return null;

            return (
              <span
                key={lvlKey}
                className={`text-[10px] px-2 py-1 rounded font-bold border ${lvlKey === '0'
                  ? 'bg-rpg-gold/10 text-rpg-gold border-rpg-gold/20'
                  : lvlKey === 'pact'
                    ? 'bg-rpg-ember/10 text-rpg-ember border-rpg-ember/20'
                    : info.current > 0
                        ? 'bg-white/5 text-rpg-parchment border-white/10'
                        : 'bg-gray-800 text-gray-500 border-transparent'
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
      <div className="bg-rpg-panel border border-white/5 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rpg-gold/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-center mb-5 gap-4 flex-wrap relative z-10">
          <div>
            <h3 className="text-sm font-bold text-rpg-gold uppercase tracking-[0.2em] mb-1">Slots de Magia</h3>
            <p className="text-[10px] text-rpg-grey/40 font-medieval italic">Energia Arcana Disponível</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSpellType('cantrip');
                setShowModal(true);
              }}
              className="px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-white/5 hover:bg-white/10 text-rpg-parchment border border-white/10 hover:border-rpg-gold/40 shadow-lg active:scale-95"
            >
              <span className="text-rpg-gold">✦</span> Truque
            </button>
            <button
              onClick={() => {
                setSpellType('spell');
                setShowModal(true);
              }}
              className="px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 bg-rpg-gold/10 hover:bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/30 hover:border-rpg-gold/50 shadow-lg active:scale-95"
            >
              <span>🔥</span> Magia
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
                className={`p-3 rounded-lg border text-center transition-all relative overflow-hidden ${lvlKey === '0'
                  ? 'bg-black/40 border-rpg-gold/20 shadow-inner'
                  : isPact
                    ? 'bg-rpg-ember/5 border-rpg-ember/30 shadow-lg shadow-rpg-ember/5'
                    : isEmpty
                      ? 'bg-gray-950/20 border-white/5 opacity-40'
                      : 'bg-black/30 border-white/10 hover:border-rpg-gold/30 shadow-md'
                  }`}
              >
                <p className={`text-[10px] mb-1 uppercase tracking-[0.15em] font-black ${isPact ? 'text-rpg-ember/60' : 'text-rpg-grey/40'}`}>
                  {lvlKey === '0' ? 'Truques' : isPact ? `Pacto (Nv ${level})` : `Nível ${level}`}
                </p>
                <p className={`text-xl font-serif font-bold ${lvlKey === '0'
                  ? 'text-rpg-gold'
                  : isPact
                    ? 'text-rpg-ember text-2xl'
                    : isEmpty
                      ? 'text-gray-600'
                      : 'text-rpg-parchment'
                  }`}>
                  {lvlKey === '0' ? '∞' : `${info.current}/${info.max}`}
                </p>
                {isPact && (
                  <span className="text-[9px] text-rpg-ember/40 block mt-0.5 uppercase font-bold tracking-tighter">Descanso Curto</span>
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
