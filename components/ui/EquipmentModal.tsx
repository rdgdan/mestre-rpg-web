
// components/ui/EquipmentModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { OtherEquipmentItem } from '@/lib/items-data';
import { DEFAULT_ITEM_CATEGORIES } from '@/lib/dnd-data';

interface EquipmentData {
    name: string;
}

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: OtherEquipmentItem) => void;
    allEquipment: EquipmentData[];
    onAddNewGlobalItem: (itemName: string) => Promise<void>;
    itemToEdit?: OtherEquipmentItem | null;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    allEquipment,
    onAddNewGlobalItem,
    itemToEdit
}) => {
    const [item, setItem] = useState<Partial<OtherEquipmentItem>>({
        name: '',
        quantity: 1,
        type: 'other',
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setItem({
                    ...itemToEdit
                });
                setIsCreatingNew(false);
            } else {
                setItem({
                    name: '',
                    quantity: 1,
                    type: 'other',
                    description: ''
                });
                setIsCreatingNew(false);
            }
            setSearchTerm('');
        }
    }, [isOpen, itemToEdit]);

    const filteredEquipment = searchTerm
        ? allEquipment.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleSave = async () => {
        if (!item.name) {
            alert("Por favor, selecione ou dê um nome ao item.");
            return;
        }

        if (isCreatingNew) {
            const exists = allEquipment.some(e => e.name.toLowerCase() === item.name?.toLowerCase());
            if (!exists) {
                await onAddNewGlobalItem(item.name || '');
            }
        }

        onSave({
            ...itemToEdit,
            id: itemToEdit?.id || new Date().toISOString(),
            name: item.name || '',
            quantity: item.quantity || 1,
            type: item.type || 'other',
            description: item.description || ''
        } as OtherEquipmentItem);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-rpg-gold/20 flex justify-between items-center bg-black/20">
                    <h2 className="text-2xl font-bold text-rpg-gold font-cinzel">
                        {itemToEdit ? 'Editar Equipamento' : 'Novo Equipamento'}
                    </h2>
                    <button onClick={onClose} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Pesquisa ou Nome */}
                    {!isCreatingNew && !itemToEdit ? (
                        <div>
                            <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Pesquisar na Biblioteca</label>
                            <input
                                type="text"
                                placeholder="ex: Corda, Tocha..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment outline-none focus:border-rpg-gold font-medieval"
                            />
                            {searchTerm && (
                                <div className="mt-2 bg-black/40 border border-rpg-gold/20 rounded max-h-40 overflow-y-auto custom-scrollbar">
                                    {filteredEquipment.length > 0 ? (
                                        filteredEquipment.map(e => (
                                            <div
                                                key={e.name}
                                                onClick={() => {
                                                    setItem({ ...item, name: e.name });
                                                    setSearchTerm('');
                                                }}
                                                className="p-2 hover:bg-rpg-gold/20 hover:text-rpg-gold cursor-pointer text-sm text-rpg-parchment border-b border-rpg-gold/5 last:border-0 font-medieval"
                                            >
                                                {e.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2 text-rpg-grey italic text-xs">Nenhum item encontrado.</div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setIsCreatingNew(true)}
                                className="mt-2 text-[10px] text-rpg-gold hover:underline uppercase font-bold tracking-widest"
                            >
                                + Criar item customizado
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Nome do Item</label>
                            <input
                                type="text"
                                value={item.name}
                                onChange={e => setItem({ ...item, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment outline-none focus:border-rpg-gold font-medieval"
                            />
                            {!itemToEdit && (
                                <button
                                    onClick={() => setIsCreatingNew(false)}
                                    className="mt-2 text-[10px] text-rpg-gold hover:underline uppercase font-bold tracking-widest"
                                >
                                    ← Voltar para pesquisa
                                </button>
                            )}
                        </div>
                    )}

                    {item.name || itemToEdit ? (
                        <div className="animate-fade-in space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => setItem({ ...item, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment text-center font-medieval"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Categoria</label>
                                    <select
                                        value={item.type || 'other'}
                                        onChange={e => setItem({ ...item, type: e.target.value as any })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment outline-none font-medieval"
                                    >
                                        <option value="other">Outro</option>
                                        <option value="armor">Armadura</option>
                                        <option value="shield">Escudo</option>
                                        {DEFAULT_ITEM_CATEGORIES.filter(c => c !== 'Arma').map(cat => (
                                            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isMagical"
                                        checked={item.isMagical || false}
                                        onChange={e => setItem({ ...item, isMagical: e.target.checked })}
                                        className="w-5 h-5 rounded accent-purple-500 bg-rpg-dark border-rpg-gold/30"
                                    />
                                    <label htmlFor="isMagical" className="text-sm font-bold text-purple-300 uppercase tracking-widest font-cinzel cursor-pointer">Item Mágico ✨</label>
                                </div>

                                {item.isMagical && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Bônus Mágico (+X)</label>
                                            <input
                                                type="number"
                                                value={item.magicalBonus || 0}
                                                onChange={e => setItem({ ...item, magicalBonus: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-rpg-slate border border-purple-500/30 rounded px-3 py-2 text-rpg-parchment font-medieval"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Efeito / Propriedade Mágica</label>
                                            <textarea
                                                value={item.magicalEffect || ''}
                                                onChange={e => setItem({ ...item, magicalEffect: e.target.value })}
                                                className="w-full bg-rpg-slate border border-purple-500/30 rounded px-3 py-2 text-rpg-parchment outline-none h-16 text-xs font-medieval"
                                                placeholder="ex: Brilha na presença de orcs..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Descrição / Notas</label>
                                <textarea
                                    value={item.description}
                                    onChange={e => setItem({ ...item, description: e.target.value })}
                                    className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment outline-none focus:border-rpg-gold h-24 text-sm font-medieval"
                                    placeholder="ex: Útil para escalar paredes..."
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="p-6 border-t border-rpg-gold/20 flex justify-end gap-3 bg-black/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-rpg-slate text-rpg-grey hover:bg-rpg-dark transition-all border border-rpg-gold/10">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md bg-rpg-gold text-rpg-dark hover:brightness-110 shadow-lg font-cinzel tracking-wider transition-all">Salvar Item</button>
                </div>
            </div>
        </div>
    );
};

export default EquipmentModal;
