
"use client";

import React, { useState, useMemo } from 'react';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  onSelectItem: (item: string) => void;
  onAddItem?: (item: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SelectionModal({
  isOpen,
  onClose,
  title,
  items,
  onSelectItem,
  onAddItem,
  isLoading = false,
}: SelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, searchTerm]);

  const handleAddItem = async () => {
    if (!newItem.trim() || !onAddItem) return;
    setIsAdding(true);
    try {
      await onAddItem(newItem.trim());
      setNewItem('');
    } catch (error) {
      console.error("Failed to add new item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 mx-4 bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg shadow-2xl shadow-black/50">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-rpg-grey hover:text-rpg-red transition-colors text-2xl"
          aria-label="(Fechar)"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-rpg-gold mb-4 font-cinzel border-b border-rpg-gold/20 pb-2">{title}</h2>

        <input
          type="text"
          placeholder="Buscar ou adicionar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 mb-4 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment placeholder-rpg-grey/50 focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval"
        />

        {isLoading ? (
          <div className="text-center text-rpg-grey italic font-medieval text-lg">Carregando...</div>
        ) : (
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {filteredItems.map(item => (
              <button
                key={item}
                onClick={() => onSelectItem(item)}
                className="w-full p-2 mb-2 text-left text-rpg-parchment bg-rpg-slate/50 border border-transparent hover:border-rpg-gold/30 rounded-md hover:bg-rpg-slate transition-all duration-150 font-medieval text-lg"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {onAddItem && (
          <div className="mt-4 pt-4 border-t border-rpg-gold/20">
            <p className="text-sm text-rpg-grey mb-2 font-medieval">Não encontrou o que queria? Adicione um novo:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nova Opção Personalizada"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="flex-grow px-3 py-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment placeholder-rpg-grey/50 focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval"
              />
              <button
                onClick={handleAddItem}
                disabled={isAdding || !newItem.trim()}
                className="px-4 py-2 font-bold text-rpg-dark bg-rpg-gold rounded-md hover:bg-rpg-gold/80 disabled:bg-rpg-grey disabled:text-rpg-slate disabled:cursor-not-allowed transition-colors font-cinzel shadow-lg"
              >
                {isAdding ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
