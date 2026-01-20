import React, { useState, useEffect } from 'react';
import { getMaxSpellSlots } from '@/lib/spell-slots';

interface Spell {
  name: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
  school?: string;
  concentration?: boolean;
  ritual?: boolean;
}

interface SpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spell: Spell) => void;
  spellToEdit?: Spell | null;
  characterClass?: string;
  characterLevel?: number;
}

const defaultSpell: Spell = {
  name: '',
  level: 0,
  castingTime: '',
  range: '',
  duration: '',
  description: '',
  school: 'Evocação',
  concentration: false,
  ritual: false,
};

const SpellModal: React.FC<SpellModalProps> = ({ isOpen, onClose, onSave, spellToEdit, characterClass, characterLevel = 1 }) => {
  const [spell, setSpell] = useState<Spell>(defaultSpell);

  // Obter níveis disponíveis para o personagem
  const availableLevels = characterClass ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(level => {
    if (level === 0) return true;
    return getMaxSpellSlots(characterClass, characterLevel, level) > 0;
  }) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    if (spellToEdit) {
      // Normalize complex objects to strings
      const normalized = {
        ...spellToEdit,
        castingTime: typeof spellToEdit.castingTime === 'string' ? spellToEdit.castingTime : '',
        range: typeof spellToEdit.range === 'string' ? spellToEdit.range : '',
        duration: typeof spellToEdit.duration === 'string' ? spellToEdit.duration : ''
      };
      setSpell(normalized);
    } else {
      setSpell(defaultSpell);
    }
  }, [spellToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-rpg-gold mb-2 font-cinzel">{spellToEdit ? 'Editar Magia' : 'Criar Magia Customizada'}</h2>
        {characterClass && characterLevel && (
          <p className="text-xs text-rpg-grey/70 mb-4 bg-purple-900/30 border border-purple-500/20 rounded p-2">
            ✨ {characterClass} nível {characterLevel} — Níveis disponíveis: <span className="text-purple-300 font-bold">{availableLevels.join(', ')}</span>
          </p>
        )}
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!spell.name.trim()) return;
            onSave({ ...spell, name: spell.name.trim() });
            onClose();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs font-bold text-rpg-gold mb-1">Nome</label>
            <input type="text" className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.name} onChange={e => setSpell(s => ({ ...s, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-rpg-gold mb-1">Nível</label>
              <input type="number" min={0} max={9} className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.level} onChange={e => setSpell(s => ({ ...s, level: Number(e.target.value) || 0 }))} onFocus={(e) => e.target.select()} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-rpg-gold mb-1">Tempo de Conjuração</label>
              <input type="text" className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.castingTime} onChange={e => setSpell(s => ({ ...s, castingTime: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-rpg-gold mb-1">Escola</label>
              <select className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.school || 'Evocação'} onChange={e => setSpell(s => ({ ...s, school: e.target.value }))}>
                <option>Abjuração</option>
                <option>Adivinhação</option>
                <option>Alteração</option>
                <option>Convocação</option>
                <option>Encantamento</option>
                <option>Evocação</option>
                <option>Ilusão</option>
                <option>Necromancia</option>
                <option>Transmutação</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-rpg-gold cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={spell.concentration || false} onChange={e => setSpell(s => ({ ...s, concentration: e.target.checked }))} />
                Concentração
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-rpg-gold cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={spell.ritual || false} onChange={e => setSpell(s => ({ ...s, ritual: e.target.checked }))} />
                Ritual
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-rpg-gold mb-1">Descrição</label>
            <textarea className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment min-h-[80px]" value={spell.description} onChange={e => setSpell(s => ({ ...s, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-rpg-slate text-rpg-grey border border-rpg-gold/10 hover:bg-rpg-dark">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-rpg-gold text-rpg-dark font-bold hover:bg-rpg-gold-light">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpellModal;
