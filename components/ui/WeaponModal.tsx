
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-rpg-panel border-2 border-rpg-gold/30 p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-black/50 custom-scrollbar">
                <h2 className="text-2xl font-bold text-rpg-gold mb-4 font-cinzel border-b border-rpg-gold/20 pb-2">{weaponToEdit ? 'Editar Arma' : 'Criar Nova Arma'}</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* CAMPO DE QUANTIDADE */}
                        <div className="md:col-span-1">
                            <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Qtd.</label>
                            <input type="number" value={weapon.quantity} onChange={e => handleChange('quantity', e.target.value)} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval text-center" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Nome da Arma</label>
                            <input type="text" placeholder="Nome da Arma" value={weapon.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Dano</label>
                            <input type="text" placeholder="e.g., 1d8" value={weapon.damage} onChange={e => handleChange('damage', e.target.value)} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Tipo de Dano</label>
                            <input type="text" placeholder="e.g., Cortante" value={weapon.damageType} onChange={e => handleChange('damageType', e.target.value)} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-rpg-gold font-medieval mb-2">Propriedades</label>
                        <input type="text" placeholder="Adicionar propriedade e pressionar Enter..." onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                handlePropertyChange(e.currentTarget.value.trim());
                                e.currentTarget.value = '';
                            }
                        }} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md mb-2 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50" />
                        <div className="flex flex-wrap gap-2">
                            {weapon.properties.map(prop => (
                                <span key={prop} className="bg-rpg-slate border border-rpg-gold/20 px-2 py-1 rounded-md text-sm flex items-center text-rpg-parchment font-medieval">
                                    {prop}
                                    <button onClick={() => handlePropertyChange(prop)} className="ml-2 text-rpg-red hover:text-red-400 font-bold transition-colors">X</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-rpg-slate/50 border border-rpg-gold/10 p-4 rounded-lg space-y-3">
                        <div className="flex items-center">
                            <input type="checkbox" id="isMagical" checked={weapon.isMagical} onChange={e => handleChange('isMagical', e.target.checked)} className="w-5 h-5 rounded-sm text-rpg-gold focus:ring-rpg-gold bg-rpg-dark border-rpg-grey/50" />
                            <label htmlFor="isMagical" className="ml-3 text-lg font-bold text-rpg-gold font-cinzel">É uma Arma Mágica?</label>
                        </div>
                        {weapon.isMagical && (
                            <div className="space-y-3 pl-8 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Bônus Mágico (+)</label>
                                    <input type="number" value={weapon.magicalBonus} onChange={e => handleChange('magicalBonus', parseInt(e.target.value, 10) || 0)} className="w-full p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-rpg-gold font-medieval mb-1">Efeitos Mágicos</label>
                                    <textarea placeholder="Descreva os efeitos..." value={weapon.magicalEffect} onChange={e => handleChange('magicalEffect', e.target.value)} className="w-full h-24 p-2 bg-rpg-slate border border-rpg-gold/10 rounded-md text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval placeholder-rpg-grey/50"></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-rpg-gold/10">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-rpg-slate text-rpg-grey hover:bg-rpg-dark hover:text-rpg-parchment border border-rpg-grey/30">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md transition-all duration-200 bg-rpg-gold text-rpg-dark hover:bg-rpg-gold-light shadow-lg hover:shadow-glow-gold font-cinzel">Salvar Arma</button>
                </div>
            </div>
        </div>
    );
};

export default WeaponModal;
