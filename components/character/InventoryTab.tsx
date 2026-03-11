import React, { useState, useMemo } from 'react';
import { Character } from '@/lib/character-data';
import { Weapon, OtherEquipmentItem } from '@/lib/items-data';

interface InventoryTabProps {
    character: Character;
    isReadOnly: boolean;
    weaponSearchTerm: string;
    equipmentSearchTerm: string;
    handleFieldChange: (field: string, value: any) => void;
    handleNestedChange: (path: string, value: any) => void;
    openSelectionModal: (type: 'weapon' | 'race' | 'class') => void;
    handleOpenWeaponModal: (weapon: Weapon | null) => void;
    handleRemoveWeapon: (id: string) => void;
    handleOpenEquipmentModal: (item: OtherEquipmentItem | null) => void;
    handleRemoveEquipment: (id: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
    character,
    isReadOnly,
    weaponSearchTerm,
    equipmentSearchTerm,
    handleFieldChange,
    handleNestedChange,
    openSelectionModal,
    handleOpenWeaponModal,
    handleRemoveWeapon,
    handleOpenEquipmentModal,
    handleRemoveEquipment
}) => {
    const filteredWeapons = character.inventory.weapons.filter(w => w.name.toLowerCase().includes(weaponSearchTerm.toLowerCase()));
    const filteredEquipment = character.inventory.otherEquipment.filter(e => e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase()));

    const totalWeight = (character.inventory.weapons.reduce((acc, w) => acc + (w.weight || 0) * (w.quantity || 1), 0) +
        character.inventory.otherEquipment.reduce((acc, e) => acc + (e.weight || 0) * (e.quantity || 1), 0)).toFixed(1);
    const weightLimit = (character.attributes.strength * 7.5).toFixed(1);
    const weightPercentage = Math.min(100, (parseFloat(totalWeight) / parseFloat(weightLimit)) * 100);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Barra de Carga */}
            <div className="card-glass border-none p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rpg-gold/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <h3 className="text-lg font-serif text-rpg-gold tracking-wider">Carga & Peso</h3>
                        <p className="text-[11px] text-rpg-grey/60 uppercase tracking-widest mt-0.5">Capacidade Baseada em Força</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-2xl font-black ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'text-rpg-red shadow-glow-red' : 'text-white'}`}>{totalWeight}</span>
                        <span className="text-rpg-grey/40 text-xs font-bold ml-1 uppercase">/ {weightLimit} kg</span>
                    </div>
                </div>
                <div className="h-2.5 bg-black/40 rounded-full border border-white/5 overflow-hidden p-[1px] relative z-10">
                    <div
                        className={`h-full transition-all duration-1000 rounded-full shadow-lg ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-rpg-gold to-yellow-300'}`}
                        style={{ width: `${weightPercentage}%` }}
                    />
                </div>
                {parseFloat(totalWeight) > parseFloat(weightLimit) && (
                    <div className="mt-3 flex items-center justify-center gap-2 animate-pulse">
                        <span className="text-rpg-red text-xs font-black uppercase tracking-widest">⚠️ Sobrecarga Crítica</span>
                    </div>
                )}
            </div>

            {/* Moedas */}
            <div className="px-2">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-rpg-gold/30 to-transparent flex-grow" />
                    <h3 className="text-lg font-serif text-rpg-gold tracking-widest uppercase">Tesouro & Moedas</h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-rpg-gold/30 to-transparent flex-grow" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                        <div key={key} className="card-glass border-none p-3 text-center group hover:bg-white/5 transition-colors">
                            <label className="block text-[9px] font-black text-rpg-gold/70 uppercase mb-2 tracking-widest">{key}</label>
                            <input 
                                type="number" 
                                disabled={isReadOnly} 
                                value={character.inventory.currency[key]} 
                                onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value) || 0)} 
                                className={`w-full bg-black/20 text-white font-black text-xl text-center p-2 rounded-lg border border-white/5 focus:border-rpg-gold/40 outline-none transition-all ${isReadOnly ? 'opacity-50' : ''}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Armas */}
            <div>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-xl font-serif text-rpg-gold tracking-widest uppercase">Arsenal & Combate</h3>
                    {!isReadOnly && (
                        <div className="flex gap-3">
                            <button onClick={() => openSelectionModal('weapon')} className="btn-premium py-1.5 px-3 text-[10px]">Biblioteca</button>
                            <button onClick={() => handleOpenWeaponModal(null)} className="btn-premium btn-premium-gold py-1.5 px-3 text-[10px]">+ Nova Arma</button>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    {filteredWeapons.length > 0 ? filteredWeapons.map((weapon) => {
                        const isStrengthBased = !(weapon.properties?.includes('Acuidade') && character.attributeModifiers.dexterity > character.attributeModifiers.strength) && !weapon.properties?.includes('Munição');
                        const abilityMod = isStrengthBased ? character.attributeModifiers.strength : character.attributeModifiers.dexterity;
                        const rageBonusToDmg = (isStrengthBased && character.activeEffects?.includes('rage')) ? (character.rageBonus || 0) : 0;

                        const atkBonus = (weapon.isProficient !== false ? character.proficiencyBonus : 0) + abilityMod + (weapon.magicalBonus || 0);
                        const dmgBonus = abilityMod + (weapon.magicalBonus || 0) + rageBonusToDmg;

                        return (
                            <div key={weapon.id} className={`p-5 card-glass card-glass-hover border-none flex flex-col md:flex-row justify-between gap-4 relative overflow-hidden group transition-all duration-300`}>
                                {weapon.isMagical && <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />}
                                <div className="flex-grow relative z-10">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h4 className={`font-bold text-xl font-serif ${weapon.isMagical ? 'text-purple-300' : 'text-white'}`}>{weapon.name}</h4>
                                        {weapon.isMagical && <span className="bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-purple-400/30">Mágico</span>}
                                        <div className="flex items-center gap-2">
                                            <span className="bg-rpg-gold/20 text-rpg-gold px-2.5 py-0.5 rounded-full text-[10px] font-black border border-rpg-gold/30">ATK: {atkBonus >= 0 ? `+${atkBonus}` : atkBonus}</span>
                                            <span className="bg-red-500/20 text-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-red-400/30">
                                                DANO: {weapon.damage}{dmgBonus !== 0 ? ` + ${dmgBonus}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-rpg-grey/60 uppercase font-bold tracking-wider">
                                        <span className="bg-white/5 px-2 py-0.5 rounded">{weapon.damageType}</span>
                                        {weapon.properties?.map(p => <span key={p} className="bg-white/5 px-2 py-0.5 rounded text-rpg-grey/40">{p}</span>)}
                                    </div>
                                    {weapon.magicalEffect && <p className="text-xs text-purple-300/80 italic mt-2 border-l-2 border-purple-500/30 pl-3 py-1 font-sans">{weapon.magicalEffect}</p>}
                                </div>
                                {!isReadOnly && (
                                    <div className="flex gap-3 items-center self-end md:self-center relative z-10">
                                        <button onClick={() => handleOpenWeaponModal(weapon)} className="px-4 py-1.5 text-[10px] font-black bg-white/5 border border-white/10 hover:border-rpg-gold hover:text-rpg-gold rounded transition-all uppercase tracking-widest">Editar</button>
                                        <button onClick={() => handleRemoveWeapon(weapon.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-all">×</button>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="card-glass border-none p-10 text-center text-rpg-grey/40 italic font-serif text-lg">Seu arsenal está vazio...</div>
                    )}
                </div>
            </div>

            {/* Mochila & Itens */}
            <div>
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-xl font-serif text-rpg-gold tracking-widest uppercase">Mochila & Equipamentos</h3>
                    {!isReadOnly && (
                        <button onClick={() => handleOpenEquipmentModal(null)} className="btn-premium py-1.5 px-3 text-[10px] shadow-glow-gold/10">+ Novo Item</button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
                        <div key={item.id} className={`p-4 card-glass card-glass-hover border-none flex justify-between items-center group relative overflow-hidden transition-all duration-300`}>
                            {item.isMagical && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent -rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />}
                            <div className="relative z-10 flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`${item.isMagical ? 'text-purple-300' : 'text-rpg-gold'} font-bold text-lg font-serif`}>{item.quantity}x</span>
                                    <span className={`font-bold font-serif text-lg ${item.isMagical ? 'text-purple-100' : 'text-white'}`}>{item.name}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {item.isEquipped && <span className="text-[9px] bg-green-500/10 text-green-300 px-2 py-0.5 rounded border border-green-400/20 uppercase font-black tracking-widest">Equipado</span>}
                                    {item.isMagical && <span className="text-[9px] bg-purple-500/10 text-purple-200 px-2 py-0.5 rounded border border-purple-400/20 uppercase font-black tracking-widest">Mágico</span>}
                                </div>
                                
                                {(item.type === 'armor' || item.type === 'shield') && (
                                    <button 
                                        onClick={() => {
                                            const newEquipment = character.inventory.otherEquipment.map(e => 
                                                e.id === item.id ? { ...e, isEquipped: !e.isEquipped } : e
                                            );
                                            handleNestedChange('inventory.otherEquipment', newEquipment);
                                        }}
                                        className={`mt-3 flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            item.isEquipped 
                                                ? 'bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20' 
                                                : 'bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20'
                                        }`}
                                    >
                                        {item.isEquipped ? 'Remover' : 'Vestir'}
                                    </button>
                                )}
                                <div className="mt-3 flex items-center gap-4 text-rpg-grey/40">
                                   {item.weight && <span className="text-[10px] font-bold uppercase tracking-tighter">⚖️ {item.weight} kg</span>}
                                </div>
                                {item.magicalEffect && <p className="text-[10px] text-purple-300/60 italic mt-1 font-sans line-clamp-1 group-hover:line-clamp-none transition-all">{item.magicalEffect}</p>}
                            </div>
                            {!isReadOnly && (
                                <div className="flex flex-col gap-2 relative z-10 ml-4">
                                    <button onClick={() => handleOpenEquipmentModal(item)} className="w-8 h-8 flex items-center justify-center rounded bg-white/5 border border-white/10 text-white/40 hover:text-rpg-gold hover:border-rpg-gold transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => handleRemoveEquipment(item.id)} className="w-8 h-8 flex items-center justify-center rounded bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:border-red-500 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="col-span-full card-glass border-none p-10 text-center text-rpg-grey/30 italic font-serif text-lg">Mochila vazia...</div>
                    )}
                </div>
            </div>

            {/* Tesouros */}
            <div className="mt-8 px-2">
                <h3 className="text-lg font-serif text-rpg-gold tracking-widest uppercase mb-4">Tesouros & Objetos de Valor</h3>
                <div className="card-glass border-none p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <textarea
                        value={character.treasures || ''}
                        onChange={(e) => handleFieldChange('treasures', e.target.value)}
                        placeholder="Joias, pedras preciosas, obras de arte e outros itens valiosos..."
                        disabled={isReadOnly}
                        className={`w-full h-32 bg-transparent text-white font-serif text-lg focus:outline-none resize-none placeholder:text-rpg-grey/20 border-none relative z-10 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <div className="mt-4 text-[11px] text-rpg-grey/30 italic border-t border-white/5 pt-4 relative z-10">
                        * Registre aqui itens que não possuem peso mecânico mas têm alto valor de troca.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryTab;
