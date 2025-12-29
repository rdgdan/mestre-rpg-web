
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
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    allEquipment, 
    onAddNewGlobalItem 
}) => {
    const [selectedItemName, setSelectedItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        // Resetar o estado quando o modal for aberto
        if (isOpen) {
            setSelectedItemName('');
            setQuantity(1);
            setSearchTerm('');
            setIsCreatingNew(false);
            setNewItemName('');
        }
    }, [isOpen]);

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
            id: new Date().toISOString(), 
            name: nameToSave, 
            quantity 
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-accent mb-4">Adicionar Equipamento</h2>
                
                {isCreatingNew ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-300">Nome do Novo Item</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Corda de Cânhamo (50 pés)"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full p-2 bg-slate-700 rounded-md"
                        />
                         <a href="#" onClick={() => setIsCreatingNew(false)} className="text-sm text-primary hover:underline">Ou selecione um item existente</a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300">Pesquisar Item</label>
                            <input
                                type="text"
                                placeholder="Comece a digitar para buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full p-2 bg-slate-700 rounded-md"
                            />
                            {searchTerm && (
                                <div className="mt-2 bg-slate-900 border border-slate-700 rounded-md max-h-40 overflow-y-auto">
                                    {filteredEquipment.length > 0 ? filteredEquipment.map(item => (
                                        <div key={item.name} onClick={() => { setSelectedItemName(item.name); setSearchTerm(''); }} className="p-2 hover:bg-primary hover:text-slate-900 cursor-pointer">
                                            {item.name}
                                        </div>
                                    )) : <div className="p-2 text-slate-400">Nenhum item encontrado.</div>}
                                </div>
                            )}
                            {selectedItemName && <p className='mt-2 text-slate-300'>Selecionado: <strong class='text-white'>{selectedItemName}</strong></p>}
                        </div>
                        <a href="#" onClick={() => setIsCreatingNew(true)} className="text-sm text-primary hover:underline">+ Criar novo item não listado</a>
                    </div>
                )}

                <div className="mt-4">
                    <label className="block text-sm font-semibold text-slate-300">Quantidade</label>
                    <input 
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2 bg-slate-700 rounded-md"
                    />
                </div>

                {/* Ações */}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-slate-600 text-slate-300 hover:bg-slate-500">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md transition-all duration-200 bg-primary text-slate-900 hover:bg-primary-dark shadow-lg">Salvar Item</button>
                </div>
            </div>
        </div>
    );
};

export default EquipmentModal;
