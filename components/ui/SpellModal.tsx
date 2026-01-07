import React, { useState, useEffect } from 'react';

interface Spell {
  name: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  description: string;
}

interface SpellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (spell: Spell) => void;
  spellToEdit?: Spell | null;
}

const defaultSpell: Spell = {
  name: '',
  level: 1,
  castingTime: '',
  range: '',
  duration: '',
  description: '',
};

const SpellModal: React.FC<SpellModalProps> = ({ isOpen, onClose, onSave, spellToEdit }) => {
  const [spell, setSpell] = useState<Spell>(defaultSpell);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 w-full max-w-lg shadow-2xl">
        <h2 className="text-xl font-bold text-rpg-gold mb-4 font-cinzel">{spellToEdit ? 'Editar Magia' : 'Adicionar Magia'}</h2>
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
              <label className="block text-xs font-bold text-rpg-gold mb-1">Alcance</label>
              <input type="text" className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.range} onChange={e => setSpell(s => ({ ...s, range: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-rpg-gold mb-1">Duração</label>
              <input type="text" className="w-full p-2 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment" value={spell.duration} onChange={e => setSpell(s => ({ ...s, duration: e.target.value }))} />
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
