
// components/ui/EquipmentModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { OtherEquipmentItem } from '@/lib/items-data';

// Supondo que você passará a lista de todos os equipamentos disponíveis
interface EquipmentData {
    name: string;
}

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: OtherEquipmentItem) => void;
    allEquipment: EquipmentData[]; // Lista de todos os equipamentos do DB
    onAddNewGlobalItem: (itemName: string) => Promise<void>; // Função para criar um novo item no DB
    itemToEdit?: OtherEquipmentItem | null; // Novo prop para edição
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    allEquipment,
    onAddNewGlobalItem,
    itemToEdit
}) => {
    const [selectedItemName, setSelectedItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        // Resetar ou popular o estado quando o modal for aberto
        if (isOpen) {
            if (itemToEdit) {
                setSelectedItemName(itemToEdit.name);
                setQuantity(itemToEdit.quantity);
                setSearchTerm('');
                setIsCreatingNew(false);
                setNewItemName('');
            } else {
                setSelectedItemName('');
                setQuantity(1);
                setSearchTerm('');
                setIsCreatingNew(false);
                setNewItemName('');
            }
        }
    }, [isOpen, itemToEdit]);

    const filteredEquipment = searchTerm
        ? allEquipment.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleSave = async () => {
        let nameToSave = selectedItemName;

        if (isCreatingNew) {
            if (!newItemName.trim()) {
                alert("O nome do novo item não pode estar vazio.");
                return;
            }
            // Verifica se o item já existe (ignorando maiúsculas/minúsculas)
            const exists = allEquipment.some(item => item.name.toLowerCase() === newItemName.trim().toLowerCase());
            if (!exists) {
                await onAddNewGlobalItem(newItemName.trim());
            }
            nameToSave = newItemName.trim();
        }

        if (!nameToSave) {
            alert("Por favor, selecione ou crie um item.");
            return;
        }

        onSave({
            ...itemToEdit, // Preserva campos como isEquipped, armorClass, etc.
            id: itemToEdit?.id || new Date().toISOString(),
            name: nameToSave,
            quantity: quantity === '' ? 1 : quantity
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 p-6 rounded-lg shadow-2xl w-full max-w-md shadow-black/50">
                <h2 className="text-2xl font-bold text-rpg-gold mb-4 font-cinzel border-b border-rpg-gold/20 pb-2">
                    {itemToEdit ? 'Editar Equipamento' : 'Adicionar Equipamento'}
                </h2>

                {isCreatingNew ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-rpg-gold font-medieval">Nome do Novo Item</label>
                        <input
                            type="text"
                            placeholder="Ex: Corda de Cânhamo (50 pés)"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50"
                        />
                        <a href="#" onClick={() => setIsCreatingNew(false)} className="text-sm text-rpg-gold hover:text-rpg-gold-light hover:underline font-medieval">Ou selecione um item existente</a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Pesquisar Item</label>
                            <input
                                type="text"
                                placeholder="Comece a digitar para buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50"
                            />
                            {searchTerm && (
                                <div className="mt-2 bg-rpg-slate border border-rpg-gold/20 rounded-md max-h-40 overflow-y-auto custom-scrollbar">
                                    {filteredEquipment.length > 0 ? filteredEquipment.map(item => (
                                        <div key={item.name} onClick={() => { setSelectedItemName(item.name); setSearchTerm(''); }} className="p-2 hover:bg-rpg-gold/20 hover:text-rpg-gold cursor-pointer text-rpg-parchment font-medieval border-b border-rpg-gold/5 last:border-0 transition-colors">
                                            {item.name}
                                        </div>
                                    )) : <div className="p-2 text-rpg-grey italic font-medieval">Nenhum item encontrado.</div>}
                                </div>
                            )}
                            {selectedItemName && <p className='mt-2 text-rpg-grey font-medieval'>Selecionado: <strong className='text-rpg-gold text-lg'>{selectedItemName}</strong></p>}
                        </div>
                        <a href="#" onClick={() => setIsCreatingNew(true)} className="text-sm text-rpg-gold hover:text-rpg-gold-light hover:underline font-medieval block text-right">+ Criar novo item não listado</a>
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Quantidade</label>
                    <input
                        type="number"
                        value={quantity === 0 ? '' : quantity}
                        onChange={e => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval text-center text-lg"
                    />
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-rpg-gold/10">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-rpg-slate text-rpg-grey hover:bg-rpg-dark hover:text-rpg-parchment border border-rpg-grey/30">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md transition-all duration-200 bg-rpg-gold text-rpg-dark hover:bg-rpg-gold-light shadow-lg hover:shadow-glow-gold font-cinzel">Salvar Item</button>
                </div>
            </div>
        </div>
    );
};

export default EquipmentModal;
