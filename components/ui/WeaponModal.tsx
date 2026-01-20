
// components/ui/WeaponModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Weapon, parseDamageString } from '@/lib/items-data';
import { DEFAULT_DICE, DEFAULT_DAMAGE_TYPES, DEFAULT_PROPERTIES } from '@/lib/dnd-data';

interface WeaponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weapon: Weapon) => void;
    weaponToEdit: Weapon | null;
}

const BLANK_WEAPON: Omit<Weapon, 'id'> = {
    name: '',
    damage: '',
    damageType: 'Cortante',
    properties: [],
    quantity: 1,
    isMagical: false,
    magicalBonus: 0,
    magicalEffect: '',
    diceQty: 1,
    diceType: 'd8',
    diceBonus: 0,
    isCustomDamage: false,
    isProficient: true
};

const WeaponModal: React.FC<WeaponModalProps> = ({ isOpen, onClose, onSave, weaponToEdit }) => {
    const [weapon, setWeapon] = useState<Weapon>({ id: new Date().toISOString(), ...BLANK_WEAPON });

    useEffect(() => {
        if (isOpen) {
            if (weaponToEdit) {
                // Se o dano for customizado, tenta ver se ele pode ser estruturado
                let enhancedWeapon = { ...weaponToEdit };
                if (weaponToEdit.isCustomDamage && weaponToEdit.damage) {
                    const parsed = parseDamageString(weaponToEdit.damage);
                    if (!parsed.isCustomDamage) {
                        enhancedWeapon = { ...enhancedWeapon, ...parsed };
                    }
                }

                setWeapon({
                    ...enhancedWeapon,
                    diceQty: enhancedWeapon.diceQty || 1,
                    diceType: enhancedWeapon.diceType || 'd8',
                    diceBonus: enhancedWeapon.diceBonus || 0,
                    isCustomDamage: enhancedWeapon.isCustomDamage ?? true,
                    isProficient: enhancedWeapon.isProficient ?? true
                });
            } else {
                setWeapon({ id: new Date().toISOString(), ...BLANK_WEAPON });
            }
        }
    }, [weaponToEdit, isOpen]);

    const handlePropertyChange = (prop: string) => {
        const props = weapon.properties || [];
        const updated = props.includes(prop)
            ? props.filter(p => p !== prop)
            : [...props, prop];
        setWeapon({ ...weapon, properties: updated });
    };

    const handleSave = () => {
        if (!weapon.name) return alert('Dê um nome à arma!');

        let finalDamage = weapon.damage;
        if (!weapon.isCustomDamage) {
            finalDamage = `${weapon.diceQty}${weapon.diceType}${weapon.diceBonus ? ` + ${weapon.diceBonus}` : ''}`;
        }

        onSave({
            ...weapon,
            damage: finalDamage
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="modal-theme-c border-2 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-rpg-gold/20 flex justify-between items-center bg-black/20">
                    <h2 className="text-2xl font-bold text-rpg-gold font-cinzel">{weaponToEdit ? 'Editar Arma' : 'Criar Nova Arma'}</h2>
                    <button onClick={onClose} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Nome e Quantidade */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Nome da Arma</label>
                            <input
                                type="text"
                                value={weapon.name}
                                onChange={e => setWeapon({ ...weapon, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold outline-none font-medieval"
                                placeholder="ex: Espada Longa"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-rpg-gold uppercase mb-1 text-center">Qtd.</label>
                            <input
                                type="number"
                                min="1"
                                value={weapon.quantity}
                                onChange={e => setWeapon({ ...weapon, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment text-center font-medieval"
                            />
                        </div>
                    </div>

                    {/* Dano Estruturado */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-rpg-gold uppercase tracking-wider">Dano / Efeito</label>
                            <label className="flex items-center gap-2 text-[10px] text-rpg-gold cursor-pointer uppercase font-bold">
                                <input
                                    type="checkbox"
                                    checked={weapon.isCustomDamage}
                                    onChange={(e) => setWeapon({ ...weapon, isCustomDamage: e.target.checked })}
                                    className="accent-rpg-gold"
                                />
                                Dano Customizado
                            </label>
                        </div>

                        {weapon.isCustomDamage ? (
                            <input
                                type="text"
                                placeholder="ex: 1d8 + 1"
                                value={weapon.damage}
                                onChange={(e) => setWeapon({ ...weapon, damage: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold outline-none font-medieval"
                            />
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex bg-rpg-slate border border-rpg-gold/20 rounded overflow-hidden">
                                    <span className="px-2 py-2 text-[10px] text-rpg-grey bg-black/20 flex items-center border-r border-rpg-gold/10">Qt</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={weapon.diceQty}
                                        onChange={(e) => setWeapon({ ...weapon, diceQty: parseInt(e.target.value) || 1 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-transparent px-2 py-2 text-rpg-parchment text-center text-sm outline-none font-medieval"
                                    />
                                </div>
                                <select
                                    value={weapon.diceType}
                                    onChange={(e) => setWeapon({ ...weapon, diceType: e.target.value })}
                                    className="bg-rpg-slate border border-rpg-gold/20 rounded px-2 py-2 text-rpg-parchment text-sm outline-none font-medieval"
                                >
                                    {DEFAULT_DICE.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <div className="flex bg-rpg-slate border border-rpg-gold/20 rounded overflow-hidden">
                                    <span className="px-2 py-2 text-[10px] text-rpg-grey bg-black/20 flex items-center border-r border-rpg-gold/10">+</span>
                                    <input
                                        type="number"
                                        value={weapon.diceBonus}
                                        onChange={(e) => setWeapon({ ...weapon, diceBonus: parseInt(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-transparent px-2 py-2 text-rpg-parchment text-center text-sm outline-none font-medieval"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tipo de Dano */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-rpg-gold uppercase mb-1">Tipo de Dano</label>
                            <select
                                value={weapon.damageType}
                                onChange={(e) => setWeapon({ ...weapon, damageType: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold outline-none font-medieval"
                            >
                                {DEFAULT_DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Propriedades (Chips) */}
                    <div>
                        <label className="block text-xs font-bold text-rpg-gold uppercase mb-2 tracking-wider">Propriedades</label>
                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_PROPERTIES.map(prop => (
                                <button
                                    key={prop}
                                    onClick={() => handlePropertyChange(prop)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${weapon.properties?.includes(prop)
                                        ? 'bg-rpg-gold text-rpg-dark'
                                        : 'bg-rpg-slate text-rpg-parchment border border-rpg-gold/20 hover:border-rpg-gold/50'
                                        }`}
                                >
                                    {prop}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mágico e Proficiência */}
                    <div className="space-y-4 pt-4 border-t border-rpg-gold/10">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-bold text-rpg-gold cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={weapon.isProficient}
                                    onChange={e => setWeapon({ ...weapon, isProficient: e.target.checked })}
                                    className="accent-rpg-gold w-4 h-4"
                                />
                                <span className="group-hover:text-rpg-gold-light transition-colors">Proficiente?</span>
                            </label>

                            <label className="flex items-center gap-2 text-sm font-bold text-rpg-gold cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={weapon.isMagical}
                                    onChange={e => setWeapon({ ...weapon, isMagical: e.target.checked })}
                                    className="accent-rpg-gold w-4 h-4"
                                />
                                <span className="group-hover:text-rpg-gold-light transition-colors">É Mágica?</span>
                            </label>
                        </div>

                        {weapon.isMagical && (
                            <div className="grid grid-cols-4 gap-4 animate-fade-in bg-black/20 p-4 rounded border border-rpg-gold/10">
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-rpg-gold uppercase mb-1 text-center">Bônus (+)</label>
                                    <input
                                        type="number"
                                        value={weapon.magicalBonus}
                                        onChange={e => setWeapon({ ...weapon, magicalBonus: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-2 py-2 text-rpg-parchment text-center outline-none font-medieval"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-[10px] font-bold text-rpg-gold uppercase mb-1">Efeito Mágico</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Brilha na presença de orcs"
                                        value={weapon.magicalEffect}
                                        onChange={e => setWeapon({ ...weapon, magicalEffect: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment outline-none text-sm font-medieval"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-rpg-gold/20 flex justify-end gap-3 bg-black/20">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-rpg-slate text-rpg-grey hover:bg-rpg-dark transition-all border border-rpg-gold/10">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 font-bold rounded-md bg-rpg-gold text-rpg-dark hover:brightness-110 shadow-lg font-cinzel tracking-wider transition-all">Salvar Arma</button>
                </div>
            </div>
        </div>
    );
};

export default WeaponModal;
