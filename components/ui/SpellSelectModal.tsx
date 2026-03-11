import React, { useState, useEffect } from 'react';
import { spellsDatabase, Spell, fetchGlobalSpells, searchSpells } from '@/lib/spells-data';
import { dndClasses } from '@/lib/dnd-data';

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
  filterLevel: initialFilterLevel,
  minLevel
}) => {
  const [search, setSearch] = useState('');
  const [globalSpells, setGlobalSpells] = useState<Spell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(initialFilterLevel !== undefined ? initialFilterLevel : null);
  const [selectedClass, setSelectedClass] = useState<string | null>(filterClass || null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchGlobalSpells().then(spells => {
        setGlobalSpells(spells);
        setIsLoading(false);
      });
      // Resetar seleção se o modal abrir de novo
      if (initialFilterLevel !== undefined) setSelectedLevel(initialFilterLevel);
      if (filterClass !== undefined) setSelectedClass(filterClass);
    }
  }, [isOpen, initialFilterLevel, filterClass]);

  const filtered = searchSpells(search, {
    class: selectedClass || undefined,
    level: selectedLevel !== null ? selectedLevel : undefined,
    minLevel: minLevel
  }, [...globalSpells]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-rpg-gold font-cinzel">Adicionar Magia ao Grimório</h2>
          <button onClick={onClose} className="text-rpg-grey hover:text-rpg-gold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4 flex flex-col flex-grow overflow-hidden">
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-10 rounded bg-rpg-dark/50 border border-rpg-gold/10 text-rpg-parchment focus:border-rpg-gold/40 outline-none transition-all"
              placeholder="Buscar magia pelo nome ou descrição..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3.5 h-4 w-4 text-rpg-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtros Combinados */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-rpg-gold/10">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-rpg-gold/60 uppercase tracking-widest font-bold ml-1">Filtro por Classe</label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value || null)}
                className="w-full p-2.5 rounded bg-rpg-dark/60 border border-rpg-gold/20 text-rpg-parchment text-xs focus:border-rpg-gold/50 outline-none transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem_1rem]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d4af37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
              >
                <option value="">Todas as Classes</option>
                {dndClasses.filter(c => !['Bárbaro', 'Guerreiro', 'Ladino', 'Monge'].includes(c)).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-rpg-gold/60 uppercase tracking-widest font-bold ml-1">Filtro por Nível</label>
              <select
                value={selectedLevel === null ? '' : selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value === '' ? null : Number(e.target.value))}
                className="w-full p-2.5 rounded bg-rpg-dark/60 border border-rpg-gold/20 text-rpg-parchment text-xs focus:border-rpg-gold/50 outline-none transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem_1rem]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d4af37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
              >
                <option value="">Todos os Níveis</option>
                <option value="0">Truques (Nível 0)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => (
                  <option key={lv} value={lv}>Nível {lv}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rpg-gold mb-4"></div>
                <p className="italic">Consultando o Grimório...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(spell => (
                <div
                  key={spell.id}
                  className="p-4 bg-rpg-slate/40 border border-rpg-gold/10 rounded-lg flex flex-col gap-1 hover:bg-rpg-slate/60 hover:border-rpg-gold/30 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-300"
                  onClick={() => onSelect(spell)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rpg-parchment font-medieval text-lg group-hover:text-rpg-gold transition-colors">{spell.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${spell.level === 0 ? 'bg-purple-900/40 text-purple-300 border border-purple-500/20' : 'bg-amber-900/40 text-amber-300 border border-amber-500/20'}`}>
                      {spell.level === 0 ? 'TRUQUE' : `Nível ${spell.level}`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-rpg-grey/60 uppercase tracking-tighter">
                    <span className="text-purple-400/80">{spell.school}</span>
                    <span>{renderSpellProperty(spell.castingTime)}</span>
                    <span>{renderSpellProperty(spell.range)}</span>
                    <span className="text-rpg-gold/50 italic capitalize">
                      {Array.isArray(spell.classes) 
                        ? spell.classes.map(c => typeof c === 'string' ? c : (c as any).name).join(', ')
                        : (typeof (spell as any).classes === 'string' ? (spell as any).classes : 
                           (typeof (spell as any).classe === 'string' ? (spell as any).classe : ''))}
                    </span>
                  </div>
                  <p className="text-xs text-rpg-grey/80 line-clamp-2 mt-1 leading-relaxed">{spell.description}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <p className="italic">Nenhuma magia encontrada para os filtros aplicados.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-4 mt-auto border-t border-rpg-gold/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded bg-rpg-slate/80 text-rpg-grey border border-rpg-gold/10 hover:bg-rpg-dark hover:text-rpg-parchment transition-all uppercase text-xs font-bold tracking-widest font-cinzel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onCreate}
              className="flex-[2] px-4 py-2.5 rounded bg-rpg-gold text-rpg-dark font-bold hover:shadow-glow-gold transition-all uppercase text-xs font-bold tracking-widest font-cinzel"
            >
              Criar Nova Magia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpellSelectModal;
