/**
 * Componente para exibir atributos básicos do personagem
 */

import { Character } from '@/types';

interface CharacterBasicsProps {
  character: Character;
  onUpdate: (field: keyof Character, value: any) => void;
  isReadOnly?: boolean;
}

const ATTRIBUTES = [
  { key: 'strength' as const, label: 'For' },
  { key: 'dexterity' as const, label: 'Des' },
  { key: 'constitution' as const, label: 'Con' },
  { key: 'intelligence' as const, label: 'Int' },
  { key: 'wisdom' as const, label: 'Sab' },
  { key: 'charisma' as const, label: 'Car' },
];

export default function CharacterBasics({
  character,
  onUpdate,
  isReadOnly = false,
}: CharacterBasicsProps) {
  const calculateModifier = (value: number) => Math.floor((value - 10) / 2);

  return (
    <div className="bg-rpg-panel border border-rpg-gold/20 rounded p-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm text-rpg-grey uppercase">Nome</label>
          <p className="text-2xl font-bold font-cinzel text-rpg-gold">
            {character.name}
          </p>
        </div>
        <div>
          <label className="text-sm text-rpg-grey uppercase">Nível</label>
          <p className="text-2xl font-bold font-cinzel text-rpg-parchment">
            {character.level}
          </p>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {ATTRIBUTES.map(attr => {
          const value = character.attributes[attr.key];
          const modifier = calculateModifier(value);

          return (
            <div
              key={attr.key}
              className="bg-rpg-slate border border-rpg-gold/20 rounded p-3 text-center"
            >
              <div className="text-xs font-bold text-rpg-grey uppercase mb-2">
                {attr.label}
              </div>
              <div className="text-xl font-bold font-cinzel text-rpg-gold mb-1">
                {value}
              </div>
              <div className={`text-xs font-bold ${modifier >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {modifier > 0 ? '+' : ''}{modifier}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-rpg-slate border border-red-500/20 rounded p-4 text-center">
          <label className="text-xs text-rpg-grey uppercase mb-2 block">HP</label>
          <p className="text-2xl font-bold font-cinzel text-red-400">
            {character.resources.currentHp}/{character.resources.maxHp}
          </p>
        </div>

        <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-4 text-center">
          <label className="text-xs text-rpg-grey uppercase mb-2 block">AC</label>
          <p className="text-2xl font-bold font-cinzel text-rpg-gold">
            {character.ac}
          </p>
        </div>

        <div className="bg-rpg-slate border border-blue-500/20 rounded p-4 text-center">
          <label className="text-xs text-rpg-grey uppercase mb-2 block">Iniciativa</label>
          <p className="text-2xl font-bold font-cinzel text-blue-400">
            +{calculateModifier(character.attributes.dexterity)}
          </p>
        </div>
      </div>
    </div>
  );
}
