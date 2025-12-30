import React, { useState } from 'react';
import { spellsDatabase } from '@/lib/spells-data';

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
  ritual?: boolean;
  concentration?: boolean;
}

interface SpellSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (spell: Spell) => void;
  onCreate: () => void;
}

const SpellSelectModal: React.FC<SpellSelectModalProps> = ({ isOpen, onClose, onSelect, onCreate }) => {
  const [search, setSearch] = useState('');
  const filtered = spellsDatabase.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-rpg-gold mb-4 font-cinzel">Adicionar Magia ao Grimório</h2>
        <input
          type="text"
          className="w-full p-2 mb-4 rounded bg-rpg-slate border border-rpg-gold/10 text-rpg-parchment"
          placeholder="Buscar magia pelo nome ou descrição..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered.length > 0 ? filtered.map(spell => (
            <div key={spell.id} className="p-3 bg-rpg-slate/80 border border-rpg-gold/10 rounded-lg flex flex-col gap-1 hover:border-rpg-gold/30 transition-colors cursor-pointer" onClick={() => onSelect(spell)}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-rpg-parchment font-medieval text-lg">{spell.name}</span>
                <span className="text-xs text-purple-300 uppercase tracking-widest font-bold">Nível {spell.level}</span>
              </div>
              <span className="text-xs text-rpg-grey">{spell.school}</span>
              <p className="text-xs text-rpg-grey/80 line-clamp-2">{spell.description}</p>
            </div>
          )) : <p className="text-center text-rpg-grey italic">Nenhuma magia encontrada.</p>}
        </div>
        <div className="flex justify-between gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-rpg-slate text-rpg-grey border border-rpg-gold/10 hover:bg-rpg-dark">Cancelar</button>
          <button type="button" onClick={onCreate} className="px-4 py-2 rounded bg-rpg-gold text-rpg-dark font-bold hover:bg-rpg-gold-light">Criar Nova Magia</button>
        </div>
      </div>
    </div>
  );
};

export default SpellSelectModal;
