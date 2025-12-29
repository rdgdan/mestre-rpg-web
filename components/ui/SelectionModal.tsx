
"use client";

import React, { useState, useMemo } from 'react';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  onSelectItem: (item: string) => void;
  onAddItem: (item: string) => Promise<void>;
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
    if (!newItem.trim()) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-md p-6 mx-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-accent mb-4">{title}</h2>

        <input
          type="text"
          placeholder="Buscar ou adicionar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 mb-4 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {isLoading ? (
          <div className="text-center text-slate-300">Carregando...</div>
        ) : (
          <div className="max-h-60 overflow-y-auto pr-2">
            {filteredItems.map(item => (
              <button
                key={item}
                onClick={() => onSelectItem(item)}
                className="w-full p-3 mb-2 text-left text-white bg-slate-700 rounded-md hover:bg-primary transition-all duration-150"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-700">
           <p className="text-sm text-slate-400 mb-2">Não encontrou o que queria? Adicione um novo:</p>
           <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nova Opção Personalizada"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-grow px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button 
              onClick={handleAddItem}
              disabled={isAdding || !newItem.trim()}
              className="px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
