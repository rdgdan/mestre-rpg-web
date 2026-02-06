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
            <div className="bg-rpg-panel border border-rpg-gold/20 rounded-xl p-5 shadow-inner">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-rpg-gold uppercase tracking-widest font-cinzel">Capacidade de Carga</h3>
                        <p className="text-xs text-rpg-grey">Baseado em sua Força ({character.attributes.strength})</p>
                    </div>
                    <div className="text-right">
                        <span className={`text-xl font-bold font-medieval ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'text-rpg-red shadow-glow-red' : 'text-rpg-parchment'}`}>{totalWeight} kg</span>
                        <span className="text-rpg-grey/60 text-sm font-medieval ml-1">/ {weightLimit} kg</span>
                    </div>
                </div>
                <div className="h-3 bg-black/40 rounded-full border border-rpg-gold/10 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 rounded-full ${parseFloat(totalWeight) > parseFloat(weightLimit) ? 'bg-gradient-to-r from-red-600 to-rpg-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-rpg-gold/40 to-rpg-gold'}`}
                        style={{ width: `${weightPercentage}%` }}
                    />
                </div>
                {parseFloat(totalWeight) > parseFloat(weightLimit) && (
                    <p className="text-[10px] text-rpg-red font-bold uppercase mt-2 text-center animate-pulse">⚠️ Sobrecarga! Sua velocidade é reduzida.</p>
                )}
            </div>

            {/* Moedas */}
            <div>
                <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Moedas</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md">
                    {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                        <div key={key}>
                            <label className="block text-[10px] font-bold text-rpg-gold uppercase text-center mb-1 font-cinzel">{key}</label>
                            <input type="number" disabled={isReadOnly} value={character.inventory.currency[key]} onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value) || 0)} className={`w-full p-2 text-xl font-bold text-center bg-rpg-slate rounded-md border border-rpg-gold/10 font-medieval focus:border-rpg-gold/50 outline-none ${isReadOnly ? 'opacity-70' : ''}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Armas */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Armas</h3>
                    {!isReadOnly && (
                        <div className="flex gap-2">
                            <button onClick={() => openSelectionModal('weapon')} className="px-3 py-1 text-xs font-bold bg-rpg-slate border border-rpg-gold/20 rounded hover:bg-rpg-dark transition-all uppercase tracking-tighter">Biblioteca</button>
                            <button onClick={() => handleOpenWeaponModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Nova Arma</button>
                        </div>
                    )}
                </div>
                <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-4 space-y-3 shadow-inner">
                    {filteredWeapons.length > 0 ? filteredWeapons.map((weapon) => {
                        const isStrengthBased = !(weapon.properties?.includes('Acuidade') && character.attributeModifiers.dexterity > character.attributeModifiers.strength) && !weapon.properties?.includes('Munição');
                        const abilityMod = isStrengthBased ? character.attributeModifiers.strength : character.attributeModifiers.dexterity;
                        const rageBonusToDmg = (isStrengthBased && character.activeEffects?.includes('rage')) ? (character.rageBonus || 0) : 0;

                        const atkBonus = (weapon.isProficient !== false ? character.proficiencyBonus : 0) + abilityMod + (weapon.magicalBonus || 0);
                        const dmgBonus = abilityMod + (weapon.magicalBonus || 0) + rageBonusToDmg;

                        return (
                            <div key={weapon.id} className={`p-4 bg-rpg-slate/80 border ${weapon.isMagical ? 'border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' : 'border-rpg-gold/10'} rounded-lg flex flex-col md:flex-row justify-between gap-4 hover:border-rpg-gold/30 transition-all group shadow-md relative overflow-hidden`}>
                                {weapon.isMagical && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent -rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />}
                                <div className="flex-grow">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h4 className={`font-bold text-lg font-medieval ${weapon.isMagical ? 'text-purple-200' : 'text-rpg-parchment'}`}>{weapon.name}</h4>
                                        {weapon.isMagical && <span className="bg-purple-600 text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-lg">Mágico ✨</span>}
                                        <span className="bg-rpg-gold text-rpg-dark px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">ATK: {atkBonus >= 0 ? `+${atkBonus}` : atkBonus}</span>
                                        <span className="bg-rpg-red text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">
                                            DANO: {weapon.damage}{dmgBonus !== 0 ? ` + ${dmgBonus}` : ''}
                                            {rageBonusToDmg > 0 && <span className="ml-1 text-[8px] text-yellow-300 animate-pulse"> (+{rageBonusToDmg} FÚRIA)</span>}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-rpg-grey uppercase tracking-wider bg-black/20 px-2 py-1 rounded inline-block">{weapon.damageType} | {weapon.properties?.join(', ')}</p>
                                    {weapon.magicalEffect && <p className="text-[10px] text-purple-300 italic mt-1 font-sans">{weapon.magicalEffect}</p>}
                                    {(weapon.sourceClass || character.class) && (
                                        <div className="mt-2 flex items-center gap-1">
                                            <span className="text-[8px] bg-rpg-gold/20 text-rpg-gold/70 px-1.5 py-0.5 rounded border border-rpg-gold/10 font-black uppercase tracking-widest leading-none">
                                                {weapon.sourceClass || character.class}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!isReadOnly && (
                                    <div className="flex gap-2 items-center self-end md:self-center">
                                        <button onClick={() => handleOpenWeaponModal(weapon)} className="px-3 py-1 text-xs font-medium bg-rpg-slate/50 border border-rpg-grey/30 hover:border-rpg-gold text-rpg-grey hover:text-rpg-parchment rounded-md transition-colors uppercase">Editar</button>
                                        <button onClick={() => handleRemoveWeapon(weapon.id)} className="px-3 py-1 text-xs font-medium bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded-md transition-colors">×</button>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <p className="text-center text-rpg-grey py-8 italic">O cinto de utilidades está vazio.</p>
                    )}
                </div>
            </div>

            {/* Mochila & Itens */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Mochila & Itens</h3>
                    {!isReadOnly && (
                        <div className="flex gap-2">
                            <button onClick={() => handleOpenEquipmentModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Novo Item</button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
                        <div key={item.id} className={`p-3 bg-rpg-panel border ${item.isMagical ? 'border-purple-500/40 shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]' : 'border-rpg-gold/10'} rounded-lg flex justify-between items-center hover:border-rpg-gold/40 transition-all group shadow-sm relative overflow-hidden`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className={`${item.isMagical ? 'text-purple-300' : 'text-rpg-gold'} font-bold font-medieval`}>{item.quantity}x</span>
                                    <span className={`font-bold font-medieval ${item.isMagical ? 'text-purple-100 italic' : 'text-rpg-parchment'}`}>{item.name}</span>
                                    {item.isEquipped && <span className="text-[8px] bg-green-900/50 text-green-300 px-1 py-0.5 rounded border border-green-700/30 uppercase font-black">Equipado</span>}
                                    {item.isMagical && <span className="text-[7px] bg-purple-600/80 text-white px-1 py-0.5 rounded uppercase font-black tracking-tighter shadow-sm animate-pulse-slow">Mágico ✨</span>}
                                </div>
                                {item.weight && <span className="text-[10px] text-rpg-grey/60">{item.weight} kg</span>}
                                {item.magicalEffect && <p className="text-[9px] text-purple-300/80 italic mt-0.5 font-sans leading-tight line-clamp-1">{item.magicalEffect}</p>}
                                {(item.sourceClass || character.class) && (
                                    <div className="mt-1">
                                        <span className="text-[7px] bg-white/5 text-white/40 px-1 py-0.2 rounded font-black uppercase tracking-tighter border border-white/5">
                                            {item.sourceClass || character.class}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {!isReadOnly && (
                                <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEquipmentModal(item)} className="p-1 text-rpg-grey hover:text-rpg-gold transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => handleRemoveEquipment(item.id)} className="p-1 text-rpg-red/50 hover:text-rpg-red transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="col-span-full text-center text-rpg-grey py-8 italic bg-rpg-slate/20 rounded-lg border border-dashed border-rpg-gold/10">A mochila parece leve... nenhum item registrado.</p>
                    )}
                </div>
            </div>

            {/* Tesouros */}
            <div className="mt-8">
                <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Tesouros & Objetos de Valor</h3>
                <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-5 shadow-inner">
                    <textarea
                        value={character.treasures || ''}
                        onChange={(e) => handleFieldChange('treasures', e.target.value)}
                        placeholder="Joias, pedras preciosas, obras de arte e outros itens valiosos que não ocupam espaço regular na mochila..."
                        disabled={isReadOnly}
                        className={`w-full h-32 bg-transparent text-rpg-parchment font-handschrift text-lg focus:outline-none resize-none placeholder:text-rpg-grey/30 border-none ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                    />
                    <div className="mt-2 text-[10px] text-rpg-grey italic border-t border-rpg-gold/10 pt-2">
                        Ex: Colar de pérolas (250 po), Estatueta de obsidiana, Pergaminho antigo.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryTab;
