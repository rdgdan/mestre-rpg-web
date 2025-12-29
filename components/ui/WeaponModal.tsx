
// components/ui/WeaponModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Weapon } from '@/lib/items-data';

interface WeaponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weapon: Weapon) => void;
    weaponToEdit: Weapon | null;
}

const BLANK_WEAPON: Omit<Weapon, 'id'> = {
    name: '', 
    damage: '', 
    damageType: '', 
    properties: [], 
    quantity: 1, // <-- PADRÃO
    isMagical: false, 
    magicalBonus: 0, 
    magicalEffect: '' 
};

const WeaponModal: React.FC<WeaponModalProps> = ({ isOpen, onClose, onSave, weaponToEdit }) => {
    const [weapon, setWeapon] = useState<Weapon>({ id: new Date().toISOString(), ...BLANK_WEAPON });

    useEffect(() => {
        if (isOpen) {
            if (weaponToEdit) {
                // Garante que a quantidade seja pelo menos 1 ao editar
                setWeapon({ ...weaponToEdit, quantity: weaponToEdit.quantity || 1 });
            } else {
                setWeapon({ id: new Date().toISOString(), ...BLANK_WEAPON });
            }
        }
    }, [weaponToEdit, isOpen]);

    const handleChange = (field: keyof Weapon, value: any) => {
        // Garante que a quantidade nunca seja menor que 1
        if (field === 'quantity') {
            const numValue = parseInt(value, 10);
            value = isNaN(numValue) || numValue < 1 ? 1 : numValue;
        }
        setWeapon(prev => ({ ...prev, [field]: value }));
    };
    
    const handlePropertyChange = (prop: string) => {
        const newProperties = weapon.properties.includes(prop)
            ? weapon.properties.filter(p => p !== prop)
            : [...weapon.properties, prop];
        handleChange('properties', newProperties);
    };

    const handleSave = () => {
        onSave(weapon);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-accent mb-4">{weaponToEdit ? 'Editar Arma' : 'Criar Nova Arma'}</h2>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* CAMPO DE QUANTIDADE */}
                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Qtd.</label>
                            <input type="number" value={weapon.quantity} onChange={e => handleChange('quantity', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-semibold text-slate-300 mb-1">Nome da Arma</label>
                            <input type="text" placeholder="Nome da Arma" value={weapon.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-semibold text-slate-300 mb-1">Dano</label>
                           <input type="text" placeholder="e.g., 1d8" value={weapon.damage} onChange={e => handleChange('damage', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md" />
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-300 mb-1">Tipo de Dano</label>
                           <input type="text" placeholder="e.g., Cortante" value={weapon.damageType} onChange={e => handleChange('damageType', e.target.value)} className="w-full p-2 bg-slate-700 rounded-md" />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-slate-300 mb-2">Propriedades</label>
                         <input type="text" placeholder="Adicionar propriedade e pressionar Enter..." onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                handlePropertyChange(e.currentTarget.value.trim());
                                e.currentTarget.value = '';
                            }
                         }} className="w-full p-2 bg-slate-700 rounded-md mb-2" />
                         <div className="flex flex-wrap gap-2">
                            {weapon.properties.map(prop => (
                                <span key={prop} className="bg-slate-600 px-2 py-1 rounded-md text-sm flex items-center">
                                    {prop}
                                    <button onClick={() => handlePropertyChange(prop)} className="ml-2 text-red-400 hover:text-red-200 font-bold">X</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center">
                            <input type="checkbox" id="isMagical" checked={weapon.isMagical} onChange={e => handleChange('isMagical', e.target.checked)} className="w-5 h-5 rounded-sm text-primary focus:ring-primary-dark bg-slate-600 border-slate-500" />
                            <label htmlFor="isMagical" className="ml-3 text-lg font-bold text-white">É uma Arma Mágica?</label>
                        </div>
                        {weapon.isMagical && (
                            <div className="space-y-3 pl-8 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300">Bônus Mágico (+)</label>
                                    <input type="number" value={weapon.magicalBonus} onChange={e => handleChange('magicalBonus', parseInt(e.target.value, 10) || 0)} className="w-full p-2 bg-slate-700 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300">Efeitos Mágicos</label>
                                    <textarea placeholder="Descreva os efeitos..." value={weapon.magicalEffect} onChange={e => handleChange('magicalEffect', e.target.value)} className="w-full h-24 p-2 bg-slate-700 rounded-md"></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-slate-600 text-slate-300 hover:bg-slate-500">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md transition-all duration-200 bg-primary text-slate-900 hover:bg-primary-dark shadow-lg">Salvar Arma</button>
                </div>
            </div>
        </div>
    );
};

export default WeaponModal;
