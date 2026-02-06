import React, { useState, useMemo, useRef } from 'react';
import Modal from '@/components/Modal';
import { translateMonster } from '@/lib/monster-translator';
import { Combatant } from '@/hooks/useCombat';

interface AddCombatantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (entry: any) => Promise<void>;
    dbMonsters: any[];
    dbStandardNpcs: any[];
    customNpcs: any[];
    myCharacters: any[];
    charactersLoading: boolean;
}

const AddCombatantModal: React.FC<AddCombatantModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    dbMonsters,
    dbStandardNpcs,
    customNpcs,
    myCharacters,
    charactersLoading
}) => {
    const [newCombatant, setNewCombatant] = useState({
        name: '',
        hp: '' as any,
        initiative: '' as any,
        type: 'monster' as 'monster' | 'npc' | 'player',
        ac: '' as any,
        cr: '0',
        xp: '' as any,
        quantity: 1,
        externalId: '',
        ownerId: '',
        ownerName: ''
    });

    const [monsterSearch, setMonsterSearch] = useState('');
    const [showMonsterResults, setShowMonsterResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Search logic
    const filteredMonsters = useMemo(() => {
        if (!monsterSearch) return [];
        const query = monsterSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const source = newCombatant.type === 'monster' ? dbMonsters : [...dbStandardNpcs, ...customNpcs];

        return source.filter(m => {
            const nameMatch = m.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query);
            const translated = translateMonster(m.name);
            const translatedMatch = translated?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query);
            return nameMatch || translatedMatch;
        }).slice(0, 10);
    }, [monsterSearch, newCombatant.type, dbMonsters, dbStandardNpcs, customNpcs]);

    const handleSelectMonster = (m: any) => {
        const translated = translateMonster(m.name);
        setNewCombatant(prev => ({
            ...prev,
            name: translated || m.name,
            hp: m.hp || (m.hit_points) || 10,
            ac: m.ac || (m.armor_class) || 10,
            cr: m.challenge_rating || m.cr || '0',
            xp: m.xp || ''
        }));
        setShowMonsterResults(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Math.min(Math.max(Number(newCombatant.quantity) || 1, 1), 20);
        const baseName = newCombatant.name || 'Combatente';

        for (let i = 0; i < qty; i++) {
            const suffix = qty > 1 ? ` ${i + 1}` : '';
            await onAdd({
                ...newCombatant,
                name: `${baseName}${suffix}`.trim(),
                hp: Number(newCombatant.hp) || 1,
                maxHp: Number(newCombatant.hp) || 1,
                initiative: Number(newCombatant.initiative) || 0,
                ac: Number(newCombatant.ac) || 10,
                externalId: newCombatant.externalId ? `${newCombatant.externalId}${qty > 1 ? `-${i + 1}` : ''}` : ''
            });
        }

        onClose();
        setNewCombatant({
            name: '', hp: '', initiative: '', type: 'monster',
            ac: '', cr: '0', xp: '', quantity: 1,
            externalId: '', ownerId: '', ownerName: ''
        });
        setMonsterSearch('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Combatente">
            <div className="space-y-6">
                <div className="flex bg-rpg-dark/50 p-1 rounded-xl border border-rpg-gold/20">
                    {(['monster', 'npc', 'player'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                setNewCombatant(prev => ({ ...prev, type: t, name: '', externalId: '' }));
                                setMonsterSearch('');
                                setShowMonsterResults(false);
                            }}
                            className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-cinzel font-bold tracking-widest transition-all ${newCombatant.type === t ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/20' : 'text-rpg-grey hover:text-rpg-gold'}`}
                        >
                            {t === 'monster' ? 'MONSTROS' : t === 'npc' ? 'NPC' : 'JOGADOR'}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {newCombatant.type !== 'player' ? (
                        <div className="relative" ref={searchRef}>
                            <label className="block text-rpg-gold text-[9px] font-bold mb-1 font-cinzel tracking-wider uppercase opacity-70">BUSCAR NA BIBLIOTECA</label>
                            <input
                                type="text"
                                value={monsterSearch}
                                onChange={(e) => {
                                    setMonsterSearch(e.target.value);
                                    setShowMonsterResults(true);
                                }}
                                className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                                placeholder="Dragão, Orc, Guarda..."
                            />
                            {showMonsterResults && filteredMonsters.length > 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-2 bg-rpg-panel border border-rpg-gold/30 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                    {filteredMonsters.map((m, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSelectMonster(m)}
                                            className="w-full text-left p-3 hover:bg-rpg-gold/10 border-b border-white/5 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="text-rpg-parchment font-medieval">{translateMonster(m.name) || m.name}</div>
                                                <div className="text-[10px] text-rpg-grey uppercase">{m.type || m.race}</div>
                                            </div>
                                            <div className="text-right text-rpg-gold text-xs font-cinzel">CR {m.cr || m.challenge_rating || '—'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {newCombatant.name && (
                                <div className="mt-3">
                                    <label className="block text-rpg-gold text-[9px] font-bold mb-1 font-cinzel tracking-wider uppercase opacity-70">NOME</label>
                                    <input
                                        type="text"
                                        value={newCombatant.name}
                                        onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-rpg-dark/30 border border-rpg-gold/20 rounded-lg p-2.5 text-rpg-parchment outline-none focus:border-rpg-gold text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-rpg-gold text-[10px] font-bold mb-1.5 font-cinzel tracking-widest uppercase opacity-70">SELECIONE UM HERÓI</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {myCharacters.map(char => (
                                    <button
                                        key={char.id}
                                        type="button"
                                        onClick={() => setNewCombatant({
                                            ...newCombatant,
                                            name: char.name,
                                            hp: char.maxHp || 10,
                                            ac: char.armorClass || 10,
                                            cr: char.level || '1',
                                            externalId: char.id,
                                            ownerId: char.ownerId,
                                            ownerName: char.name
                                        })}
                                        className={`p-2.5 rounded-lg border text-left transition-all ${newCombatant.externalId === char.id ? 'bg-rpg-gold text-rpg-dark border-rpg-gold' : 'bg-rpg-dark border-white/5 hover:border-rpg-gold/30'}`}
                                    >
                                        <div className="font-bold truncate text-sm">{char.name}</div>
                                        <div className="text-[9px] opacity-70">{char.class} • Lvl {char.level}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">INIC</label>
                            <input type="number" value={newCombatant.initiative} onChange={e => setNewCombatant({ ...newCombatant, initiative: e.target.value })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">HP</label>
                            <input type="number" value={newCombatant.hp} onChange={e => setNewCombatant({ ...newCombatant, hp: e.target.value })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">CA</label>
                            <input type="number" value={newCombatant.ac} onChange={e => setNewCombatant({ ...newCombatant, ac: e.target.value })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">CR</label>
                            <input type="text" value={newCombatant.cr} onChange={e => setNewCombatant({ ...newCombatant, cr: e.target.value })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">XP</label>
                            <input type="number" value={newCombatant.xp} onChange={e => setNewCombatant({ ...newCombatant, xp: e.target.value })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-rpg-gold text-[9px] font-bold font-cinzel text-center">QTD</label>
                            <input type="number" value={newCombatant.quantity} onChange={e => setNewCombatant({ ...newCombatant, quantity: Number(e.target.value) })} className="w-full bg-rpg-dark border border-rpg-gold/20 rounded p-2 text-rpg-parchment text-center font-medieval" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-rpg-grey font-cinzel text-[10px]">CANCELAR</button>
                        <button type="submit" className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold font-cinzel text-[10px] shadow-glow-gold/20 hover:bg-rpg-gold-light transition-all">CONVOCAR</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddCombatantModal;
