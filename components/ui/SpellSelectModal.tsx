import React, { useState, useEffect } from 'react';
import { spellsDatabase, Spell, fetchGlobalSpells, searchSpells } from '@/lib/spells-data';

interface SpellSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (spell: Spell) => void;
  onCreate: () => void;
  filterClass?: string;
  filterLevel?: number;
  minLevel?: number;
}

const SpellSelectModal: React.FC<SpellSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onCreate,
  filterClass,
  filterLevel,
  minLevel
}) => {
  const [search, setSearch] = useState('');
  const [globalSpells, setGlobalSpells] = useState<Spell[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchGlobalSpells().then(spells => {
        setGlobalSpells(spells);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  const filtered = searchSpells(search, {
    class: filterClass,
    level: filterLevel,
    minLevel: minLevel
  }, [...globalSpells]);

  // Debug: Logar informações sobre magias filtradas
  useEffect(() => {
    if (isOpen && globalSpells.length > 0) {
      console.log('🔍 DEBUG SpellSelectModal:');
      console.log('  📚 Total de magias carregadas:', globalSpells.length);
      console.log('  🎯 Filtro de classe:', filterClass || 'Nenhum');
      console.log('  📊 Filtro de nível máximo:', filterLevel !== undefined ? filterLevel : 'Nenhum');
      console.log('  📈 Filtro de nível mínimo:', minLevel !== undefined ? minLevel : 'Nenhum');
      console.log('  ✨ Magias após filtro:', filtered.length);

      if (filterClass) {
        const classSpells = globalSpells.filter(s =>
          Array.isArray(s.classes) &&
          s.classes.some(c => typeof c === 'string' && c.toLowerCase().trim() === filterClass.toLowerCase().trim())
        );
        console.log(`  🎵 Magias de ${filterClass} no total:`, classSpells.length);

        if (classSpells.length > 0 && classSpells.length <= 20) {
          console.table(classSpells.map(s => ({
            nome: s.name,
            nível: s.level,
            classes: Array.isArray(s.classes) ? s.classes.join(', ') : s.classes
          })));
        }

        // Verificar magias com problemas
        const problematicSpells = globalSpells.filter(s => !Array.isArray(s.classes));
        if (problematicSpells.length > 0) {
          console.warn('  ⚠️ Magias com campo classes inválido:', problematicSpells.length);
          console.table(problematicSpells.map(s => ({
            nome: s.name,
            classes: s.classes
          })));
        }
      }
    }
  }, [isOpen, globalSpells, filterClass, filterLevel, minLevel, filtered.length]);

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
        <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {filtered.length > 0 ? filtered.map(spell => (
            <div key={spell.id} className="p-3 bg-rpg-slate/80 border border-rpg-gold/10 rounded-lg flex flex-col gap-1 hover:border-rpg-gold/30 transition-colors cursor-pointer" onClick={() => onSelect(spell)}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-rpg-parchment font-medieval text-lg">{spell.name}</span>
                <span className="text-xs text-purple-300 uppercase tracking-widest font-bold">{spell.level === 0 ? 'TRUQUE' : `Nível ${spell.level}`}</span>
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
