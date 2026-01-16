/**
 * Componente para exibir detalhes de uma magia selecionada
 */

import { Spell } from '@/types';

interface SpellDetailsProps {
  spell: Spell | null;
  isReadOnly?: boolean;
  onClose: () => void;
  onSelect?: (spell: Spell) => void;
}

export default function SpellDetails({
  spell,
  isReadOnly = false,
  onClose,
  onSelect,
}: SpellDetailsProps) {
  if (!spell) {
    return null;
  }

  return (
    <div className={`bg-rpg-slate border border-rpg-gold/20 rounded p-6 shadow-2xl relative`}>
      {/* Botão Fechar (Mobile) */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-4 right-4 text-rpg-grey hover:text-rpg-parchment"
      >
        ✕
      </button>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold font-cinzel text-rpg-gold mb-2">
          {spell.name}
        </h2>
        <p className="text-sm text-rpg-grey uppercase tracking-wide">
          {spell.level === 0 ? 'Truque' : `Nível ${spell.level}`} • {spell.school}
          {spell.concentration && ' • Concentração'}
          {spell.ritual && ' • Ritual'}
        </p>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b border-rpg-gold/10 pb-4">
        <div>
          <span className="text-rpg-grey">Tempo de Lançamento:</span>
          <p className="text-rpg-parchment font-bold">{spell.castingTime}</p>
        </div>
        <div>
          <span className="text-rpg-grey">Alcance:</span>
          <p className="text-rpg-parchment font-bold">{spell.range}</p>
        </div>
        <div>
          <span className="text-rpg-grey">Componentes:</span>
          <p className="text-rpg-parchment font-bold">{spell.components.join(', ')}</p>
        </div>
        <div>
          <span className="text-rpg-grey">Duração:</span>
          <p className="text-rpg-parchment font-bold">{spell.duration}</p>
        </div>
      </div>

      {/* Descrição */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-rpg-gold mb-2 uppercase tracking-wider">
          Descrição
        </h3>
        <p className="text-xs text-rpg-grey leading-relaxed">
          {spell.description}
        </p>
      </div>

      {/* Botão de Ação */}
      {!isReadOnly && onSelect && (
        <button
          onClick={() => onSelect(spell)}
          className="w-full bg-rpg-gold/20 hover:bg-rpg-gold/40 text-rpg-gold border border-rpg-gold/50 py-2 rounded transition-colors font-bold text-sm"
        >
          Adicionar à Ficha
        </button>
      )}
    </div>
  );
}
