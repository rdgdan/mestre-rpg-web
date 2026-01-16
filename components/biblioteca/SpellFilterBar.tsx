/**
 * Componente de filtros para magias
 */

interface SpellFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  levelFilter?: number;
  onLevelChange: (level?: number) => void;
  schoolFilter?: string;
  onSchoolChange: (school?: string) => void;
  ritualOnly: boolean;
  onRitualToggle: () => void;
  concentrationOnly: boolean;
  onConcentrationToggle: () => void;
  schools: string[];
}

export default function SpellFilterBar({
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelChange,
  schoolFilter,
  onSchoolChange,
  ritualOnly,
  onRitualToggle,
  concentrationOnly,
  onConcentrationToggle,
  schools,
}: SpellFilterBarProps) {
  return (
    <div className="bg-rpg-panel border border-rpg-gold/20 rounded p-4 mb-4 space-y-3">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Pesquisar magia..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment placeholder-rpg-grey/50 focus:border-rpg-gold focus:outline-none"
      />

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Level Filter */}
        <div>
          <label className="block text-sm text-rpg-grey mb-2">Nível</label>
          <select
            value={levelFilter ?? ''}
            onChange={(e) => onLevelChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none text-sm"
          >
            <option value="">Todos</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
              <option key={level} value={level}>
                {level === 0 ? 'Truques' : `Nível ${level}`}
              </option>
            ))}
          </select>
        </div>

        {/* School Filter */}
        <div>
          <label className="block text-sm text-rpg-grey mb-2">Escola</label>
          <select
            value={schoolFilter ?? ''}
            onChange={(e) => onSchoolChange(e.target.value || undefined)}
            className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none text-sm"
          >
            <option value="">Todas</option>
            {schools.map(school => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Options */}
        <div className="flex gap-2 items-end">
          <button
            onClick={onRitualToggle}
            className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-colors border ${
              ritualOnly
                ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold'
                : 'bg-rpg-slate border-rpg-gold/20 text-rpg-grey hover:text-rpg-parchment'
            }`}
          >
            Ritual
          </button>
          <button
            onClick={onConcentrationToggle}
            className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-colors border ${
              concentrationOnly
                ? 'bg-rpg-gold/20 border-rpg-gold text-rpg-gold'
                : 'bg-rpg-slate border-rpg-gold/20 text-rpg-grey hover:text-rpg-parchment'
            }`}
          >
            Concentração
          </button>
        </div>
      </div>
    </div>
  );
}
