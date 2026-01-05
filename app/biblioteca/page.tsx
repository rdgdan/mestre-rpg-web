'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { searchSpells, Spell, fetchGlobalSpells } from '@/lib/spells-data';
import { searchMonsters, getMonsterTypes, MonsterDataExtended } from '@/lib/monsters-search';
import { dndWeapons } from '@/lib/items-data';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { fetchSRDBookFromFirestore } from '@/lib/srd-sync';
import { syncAllGameRulesToFirestore } from '@/lib/class-features-sync';
import {
    DEFAULT_CLASSES,
    DEFAULT_SCHOOLS,
    DEFAULT_MONSTER_TYPES,
    DEFAULT_ITEM_CATEGORIES,
    DEFAULT_DAMAGE_TYPES,
    DEFAULT_PROPERTIES,
    DEFAULT_DICE
} from '@/lib/dnd-data';
import { searchNpcs, npcTemplates, NPCTemplate } from '@/lib/npc-combatants-data';
import { ArchiveStorage } from '@/lib/archive-storage';
import { ParsedMechanic } from '@/lib/dnd-parser';

type TabType = 'grimorio' | 'bestiario' | 'itens' | 'regras' | 'notas' | 'npcs' | 'arquivista';

// Utilitário para normalizar nomes
const normalizeName = (name: string) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Componente Grimório
function GrimorioTab({ searchQuery, onAddSpell }: { searchQuery: string; onAddSpell?: (spell: any) => void }) {
    const { user } = useAuth();
    const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
    const [schoolFilter, setSchoolFilter] = useState<string>('');
    const [classFilter, setClassFilter] = useState<string>('');
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
    const [customSpells, setCustomSpells] = useState<Spell[]>([]);
    const [globalSpells, setGlobalSpells] = useState<Spell[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSpell, setNewSpell] = useState({
        name: '',
        level: 0,
        school: 'Evocação' as Spell['school'],
        castingTime: '1 ação',
        range: '',
        components: '',
        duration: '',
        description: '',
        classes: [] as string[]
    });
    const [customSchools, setCustomSchools] = useState<string[]>([]);
    const [customSubclasses, setCustomSubclasses] = useState<string[]>([]);
    const [newClassName, setNewClassName] = useState('');
    const [newMetadataName, setNewMetadataName] = useState('');

    const loadCustomSpells = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'custom_spells', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomSpells(docSnap.data().spells || []);
            }
        } catch (error) {
            console.error('Erro ao carregar magias:', error);
        }
    }, [user]);

    const loadGlobalSpells = useCallback(async () => {
        try {
            const spells = await fetchGlobalSpells();
            setGlobalSpells(spells);
        } catch (error) {
            console.error('Erro ao carregar magias globais:', error);
        }
    }, []);

    const loadMetadata = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCustomSchools(data.spellSchools || []);
                setCustomSubclasses(data.spellSubclasses || []);
            }
        } catch (error) {
            console.error('Erro ao carregar metadados:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadCustomSpells();
            loadMetadata();
        }
        loadGlobalSpells();
    }, [user, loadCustomSpells, loadMetadata, loadGlobalSpells]);

    const saveMetadata = async (type: string, value: string) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : {};

            const normalizedValue = normalizeName(value);
            const existingList = currentData[type] || [];

            if (!existingList.includes(normalizedValue)) {
                const updatedData = {
                    ...currentData,
                    [type]: [...existingList, normalizedValue]
                };
                await setDoc(docRef, updatedData);
                // Update local state based on type
                if (type === 'spellSchools') setCustomSchools(updatedData.spellSchools);
                if (type === 'spellSubclasses') setCustomSubclasses(updatedData.spellSubclasses);
            }
        } catch (error) {
            console.error('Erro ao salvar metadados:', error);
        }
    };

    const saveCustomSpell = async () => {
        if (!user || !newSpell.name) return;
        try {
            const normalizedName = normalizeName(newSpell.name);
            const spellId = (newSpell as any).id || `custom-${Date.now()}`;

            const spell: Spell = {
                ...newSpell,
                name: normalizedName,
                id: spellId,
                concentration: (newSpell as any).concentration || false
            };

            let updatedSpells: Spell[];
            const existingIndex = customSpells.findIndex(s =>
                (s.id === spellId) || (normalizeName(s.name) === normalizedName)
            );

            if (existingIndex !== -1) {
                if (!confirm(`A magia "${newSpell.name}" já existe no seu grimório. Deseja sobrescrevê-la?`)) {
                    return;
                }
                updatedSpells = [...customSpells];
                updatedSpells[existingIndex] = { ...updatedSpells[existingIndex], ...spell };
            } else {
                // Check Global Spells DB before creating new
                const globalDocRef = doc(db, 'magias', spell.id);
                const globalDocSnap = await getDoc(globalDocRef);

                if (globalDocSnap.exists()) {
                    alert(`A magia "${newSpell.name}" já existe no Grimório oficial. Tente usar um nome diferente.`);
                    return;
                }
                updatedSpells = [...customSpells, spell];
            }

            await setDoc(doc(db, 'custom_spells', user.uid), { spells: updatedSpells });
            setCustomSpells(updatedSpells);
            setIsAddModalOpen(false);
            setNewSpell({ name: '', level: 0, school: 'Evocação', castingTime: '1 ação', range: '', components: '', duration: '', description: '', classes: [] });
            if (selectedSpell?.name === normalizedName || selectedSpell?.id === spellId) setSelectedSpell(spell);
        } catch (error) {
            console.error('Erro ao salvar magia:', error);
        }
    };

    const deleteCustomSpell = async (spellId: string) => {
        if (!user || !confirm('Tem certeza que deseja excluir esta magia?')) return;
        try {
            const updatedSpells = customSpells.filter(s => s.id !== spellId);
            await setDoc(doc(db, 'custom_spells', user.uid), { spells: updatedSpells });
            setCustomSpells(updatedSpells);
            if (selectedSpell?.id === spellId) setSelectedSpell(null);
        } catch (error) {
            console.error('Erro ao excluir magia:', error);
        }
    };

    const openEditModal = (spell: Spell) => {
        setNewSpell({ ...spell } as any);
        setIsAddModalOpen(true);
    };

    const allSpells = [...searchSpells(searchQuery, {
        level: levelFilter,
        school: schoolFilter || undefined,
        class: classFilter || undefined
    }, [...globalSpells]), ...customSpells.filter(spell =>
        spell.name.toLowerCase().includes(searchQuery.toLowerCase())
    )];

    const schools = [...DEFAULT_SCHOOLS, ...customSchools];
    const classes = DEFAULT_CLASSES;


    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">✨ Grimório de Magias</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                    >
                        + Adicionar Magia
                    </button>
                </div>
            </div>

            {/* Modal de Adicionar Magia */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold">
                                {(newSpell as any).id ? 'Editar Magia' : 'Nova Magia Customizada'}
                            </h3>
                            <button onClick={() => {
                                setIsAddModalOpen(false);
                                setNewSpell({ name: '', level: 0, school: 'Evocação', castingTime: '1 ação', range: '', components: '', duration: '', description: '', classes: [] });
                            }} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome da Magia"
                                value={newSpell.name}
                                onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Nível</label>
                                    <select
                                        value={newSpell.level}
                                        onChange={(e) => setNewSpell({ ...newSpell, level: parseInt(e.target.value) })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => <option key={l} value={l}>{l === 0 ? 'Truque' : `Nível ${l}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Escola</label>
                                    <select
                                        value={newSpell.school}
                                        onChange={(e) => setNewSpell({ ...newSpell, school: e.target.value as Spell['school'] })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                    >
                                        {[...DEFAULT_SCHOOLS, ...customSchools].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nova Escola..."
                                            value={newMetadataName}
                                            onChange={(e) => setNewMetadataName(e.target.value)}
                                            className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!newMetadataName) return;
                                                saveMetadata('spellSchools', newMetadataName);
                                                setNewSpell({ ...newSpell, school: normalizeName(newMetadataName) as any });
                                                setNewMetadataName('');
                                            }}
                                            className="bg-rpg-gold/20 text-rpg-gold px-2 py-1 rounded text-xs"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-rpg-grey uppercase mb-1 block">Tags / Temas de Magia</label>
                                <select
                                    value={(newSpell as any).subclass || ''}
                                    onChange={(e) => setNewSpell({ ...newSpell, subclass: e.target.value } as any)}
                                    className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                >
                                    <option value="">Nenhuma Tag</option>
                                    {customSubclasses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nova Tag ou Tema..."
                                        // Using a separate state for subclass input to avoid conflict
                                        className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val) {
                                                    saveMetadata('spellSubclasses', val);
                                                    setNewSpell({ ...newSpell, subclass: normalizeName(val) } as any);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-rpg-grey uppercase mb-1 block">Classes de Personagem (quem pode usar)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {DEFAULT_CLASSES.map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => {
                                                const classes = newSpell.classes.includes(cls)
                                                    ? newSpell.classes.filter(c => c !== cls)
                                                    : [...newSpell.classes, cls];
                                                setNewSpell({ ...newSpell, classes });
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${newSpell.classes.includes(cls)
                                                ? 'bg-rpg-gold text-rpg-dark'
                                                : 'bg-rpg-slate text-rpg-parchment border border-rpg-gold/20'
                                                }`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Tempo de Conjuração (ex: 1 ação)"
                                value={newSpell.castingTime}
                                onChange={(e) => setNewSpell({ ...newSpell, castingTime: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <input
                                type="text"
                                placeholder="Alcance (ex: 18 metros)"
                                value={newSpell.range}
                                onChange={(e) => setNewSpell({ ...newSpell, range: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <textarea
                                placeholder="Descrição da magia..."
                                value={newSpell.description}
                                onChange={(e) => setNewSpell({ ...newSpell, description: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment min-h-[120px]"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveCustomSpell} className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                    {(newSpell as any).id ? 'Salvar Alterações' : 'Criar Magia'}
                                </button>
                                <button onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewSpell({ name: '', level: 0, school: 'Evocação', castingTime: '1 ação', range: '', components: '', duration: '', description: '', classes: [] });
                                }} className="bg-rpg-slate text-rpg-parchment px-6 py-2 rounded hover:bg-rpg-slate/80">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Nível</label>
                    <select
                        value={levelFilter ?? ''}
                        onChange={(e) => setLevelFilter(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none max-h-48 overflow-y-auto appearance-none"
                    >
                        <option value="">Todos</option>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                            <option key={level} value={level}>
                                {level === 0 ? 'Truque' : `Nível ${level}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Escola</label>
                    <select
                        value={schoolFilter}
                        onChange={(e) => setSchoolFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none max-h-48 overflow-y-auto appearance-none"
                    >
                        <option value="">Todas</option>
                        {schools.map(school => (
                            <option key={school} value={school}>{school}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Classe</label>
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none max-h-48 overflow-y-auto appearance-none"
                    >
                        <option value="">Todas</option>
                        {classes.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lista de Magias */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {allSpells.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhuma magia encontrada.</p>
                    ) : (
                        allSpells.map(spell => (
                            <div
                                key={spell.id}
                                onClick={() => setSelectedSpell(spell)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedSpell?.id === spell.id ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    {spell.level === 0 ? '🌟' : '✨'} {spell.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    {spell.level === 0 ? 'Truque' : `Nível ${spell.level}`} • {spell.school}
                                    {spell.concentration && ' • Concentração'}
                                    {spell.ritual && ' • Ritual'}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detalhes da Magia */}
                <div className={`${selectedSpell ? 'fixed inset-0 z-[60] bg-black/90 p-4 overflow-y-auto' : 'hidden'} md:block md:static md:bg-transparent md:p-0 md:overflow-visible`}>
                    <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 md:sticky md:top-4 relative shadow-2xl md:shadow-none min-h-[50vh]">
                        {selectedSpell && (
                            <button
                                onClick={() => setSelectedSpell(null)}
                                className="md:hidden absolute top-4 right-4 text-rpg-gold bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                            >
                                ✕
                            </button>
                        )}
                        {selectedSpell ? (
                            <div>
                                <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedSpell.name}</h3>
                                <p className="text-sm text-rpg-grey mb-4">
                                    {selectedSpell.level === 0 ? 'Truque' : `Magia de Nível ${selectedSpell.level}`} • {selectedSpell.school}
                                </p>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="font-bold text-rpg-gold">Tempo de Conjuração:</span> {selectedSpell.castingTime}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">Alcance:</span> {selectedSpell.range}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">Componentes:</span> {selectedSpell.components}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">Duração:</span> {selectedSpell.duration}
                                    </div>
                                    <div>
                                        <span className="font-bold text-rpg-gold">Classes:</span> {selectedSpell.classes.join(', ')}
                                    </div>
                                    {selectedSpell.subclass && (
                                        <div>
                                            <span className="font-bold text-rpg-gold">Temas/Tags:</span> {selectedSpell.subclass}
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-rpg-gold/20">
                                        <p className="text-rpg-parchment leading-relaxed">{selectedSpell.description}</p>
                                    </div>
                                    {selectedSpell.id.startsWith('custom-') && (
                                        <div className="pt-4 flex gap-2">
                                            <button
                                                onClick={() => openEditModal(selectedSpell)}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => deleteCustomSpell(selectedSpell.id)}
                                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    )}
                                    {onAddSpell && (
                                        <div className="pt-4 mt-4 border-t border-rpg-gold/20">
                                            <button
                                                onClick={() => onAddSpell(selectedSpell)}
                                                className="w-full bg-rpg-gold text-rpg-dark font-bold py-2 rounded shadow-glow-gold/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                ✨ Aprender Magia
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-rpg-grey py-12">
                                <p className="text-4xl mb-4">📖</p>
                                <p>Selecione uma magia para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente Bestiário
function BestiarioTab({ searchQuery }: { searchQuery: string }) {
    const { user } = useAuth();
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [crMinFilter, setCrMinFilter] = useState<number | undefined>(undefined);
    const [crMaxFilter, setCrMaxFilter] = useState<number | undefined>(undefined);
    const [selectedMonster, setSelectedMonster] = useState<MonsterDataExtended | null>(null);
    const [customMonsters, setCustomMonsters] = useState<MonsterDataExtended[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMonster, setNewMonster] = useState<Partial<MonsterDataExtended>>({
        name: '',
        type: 'Humanoide',
        ac: 10,
        hp: 10,
        challenge: '1/4',
        xp: 50,
        description: '',
        classes: [],
        subclass: ''
    });
    const [customTypes, setCustomTypes] = useState<string[]>([]);
    const [customSubtypes, setCustomSubtypes] = useState<string[]>([]);
    const [newMetadataName, setNewMetadataName] = useState('');

    const loadMetadata = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCustomTypes(data.monsterTypes || []);
                setCustomSubtypes(data.monsterSubtypes || []);
            }
        } catch (error) {
            console.error('Erro ao carregar metadados:', error);
        }
    }, [user]);

    const saveMetadata = async (type: string, value: string) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : {};

            const normalizedValue = normalizeName(value);
            const existingList = currentData[type] || [];

            if (!existingList.includes(normalizedValue)) {
                const updatedData = {
                    ...currentData,
                    [type]: [...existingList, normalizedValue]
                };
                await setDoc(docRef, updatedData);
                if (type === 'monsterTypes') setCustomTypes(updatedData.monsterTypes);
                if (type === 'monsterSubtypes') setCustomSubtypes(updatedData.monsterSubtypes);
            }
        } catch (error) {
            console.error('Erro ao salvar metadados:', error);
        }
    };

    const [isSyncing, setIsSyncing] = useState(false);

    const loadCustomMonsters = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'custom_monsters', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomMonsters(docSnap.data().monsters || []);
            }
        } catch (error) {
            console.error('Erro ao carregar monstros:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadCustomMonsters();
            loadMetadata();
        }
    }, [user, loadCustomMonsters, loadMetadata]);

    const saveCustomMonster = async () => {
        if (!user || !newMonster.name) return;
        try {
            const normalizedName = normalizeName(newMonster.name);
            const monster: MonsterDataExtended = {
                ...(newMonster as MonsterDataExtended),
                name: normalizedName
            };

            let updatedMonsters: MonsterDataExtended[];
            const existingIndex = customMonsters.findIndex(m => normalizeName(m.name) === normalizedName);

            if (existingIndex !== -1) {
                if (!confirm(`A criatura "${newMonster.name}" já existe no seu bestiário. Deseja sobrescrevê-la?`)) {
                    return;
                }
                updatedMonsters = [...customMonsters];
                updatedMonsters[existingIndex] = { ...updatedMonsters[existingIndex], ...monster };
            } else {
                // Check Global Monsters DB before creating new
                const globalDocRef = doc(db, 'monsters', normalizedName);
                const globalDocSnap = await getDoc(globalDocRef);

                if (globalDocSnap.exists()) {
                    alert(`A criatura "${newMonster.name}" já existe no Bestiário oficial. Tente usar um nome diferente ou busque pelo nome.`);
                    return;
                }

                updatedMonsters = [...customMonsters, monster];
            }

            await setDoc(doc(db, 'custom_monsters', user.uid), { monsters: updatedMonsters });
            setCustomMonsters(updatedMonsters);
            setIsAddModalOpen(false);
            setNewMonster({ name: '', type: 'Humanoide', ac: 10, hp: 10, challenge: '1/4', xp: 50, description: '', classes: [], subclass: '' });
            if (selectedMonster?.name === normalizedName) setSelectedMonster(monster);
        } catch (error) {
            console.error('Erro ao salvar monstro:', error);
        }
    };

    const deleteCustomMonster = async (monsterName: string) => {
        if (!user || !confirm('Tem certeza que deseja excluir esta criatura?')) return;
        try {
            const updatedMonsters = customMonsters.filter(m => m.name !== monsterName);
            await setDoc(doc(db, 'custom_monsters', user.uid), { monsters: updatedMonsters });
            setCustomMonsters(updatedMonsters);
            if (selectedMonster?.name === monsterName) setSelectedMonster(null);
        } catch (error) {
            console.error('Erro ao excluir monstro:', error);
        }
    };

    const openEditModal = (monster: MonsterDataExtended) => {
        setNewMonster({ ...monster });
        setIsAddModalOpen(true);
    };

    const monsters = [...searchMonsters(searchQuery, {
        type: typeFilter || undefined,
        challengeMin: crMinFilter,
        challengeMax: crMaxFilter
    }), ...customMonsters.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )];

    const types = getMonsterTypes();

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">🐉 Bestiário</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                    >
                        + Adicionar Criatura
                    </button>
                </div>
            </div>

            {/* Modal de Adicionar Monstro */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold">
                                {customMonsters.some(m => m.name === newMonster.name) ? 'Editar Criatura' : 'Nova Criatura Customizada'}
                            </h3>
                            <button onClick={() => {
                                setIsAddModalOpen(false);
                                setNewMonster({ name: '', type: 'Humanoide', ac: 10, hp: 10, challenge: '1/4', xp: 50, description: '', classes: [], subclass: '' });
                            }} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome da Criatura"
                                value={newMonster.name}
                                onChange={(e) => setNewMonster({ ...newMonster, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Tipo</label>
                                    <select
                                        value={newMonster.type}
                                        onChange={(e) => setNewMonster({ ...newMonster, type: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                    >
                                        {[...DEFAULT_MONSTER_TYPES, ...customTypes].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Novo Tipo..."
                                            value={newMetadataName}
                                            onChange={(e) => setNewMetadataName(e.target.value)}
                                            className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!newMetadataName) return;
                                                saveMetadata('monsterTypes', newMetadataName);
                                                setNewMonster({ ...newMonster, type: normalizeName(newMetadataName) });
                                                setNewMetadataName('');
                                            }}
                                            className="bg-rpg-gold/20 text-rpg-gold px-2 py-1 rounded text-xs"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">CR</label>
                                    <input
                                        type="text"
                                        placeholder="ex: 1/4, 5"
                                        value={newMonster.challenge}
                                        onChange={(e) => setNewMonster({ ...newMonster, challenge: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Subtipo / Tags</label>
                                    <select
                                        value={newMonster.subclass || ''}
                                        onChange={(e) => setNewMonster({ ...newMonster, subclass: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                    >
                                        <option value="">Sem Subtipo</option>
                                        {customSubtypes.map(st => <option key={st} value={st}>{st}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Novo Subtipo..."
                                            className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) {
                                                        saveMetadata('monsterSubtypes', val);
                                                        setNewMonster({ ...newMonster, subclass: normalizeName(val) });
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Classes de Personagem Assoc.</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {DEFAULT_CLASSES.map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => {
                                                    const classesArr = (newMonster.classes || []);
                                                    const updated = classesArr.includes(cls)
                                                        ? classesArr.filter(c => c !== cls)
                                                        : [...classesArr, cls];
                                                    setNewMonster({ ...newMonster, classes: updated });
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${(newMonster.classes || []).includes(cls)
                                                    ? 'bg-rpg-gold text-rpg-dark'
                                                    : 'bg-rpg-slate text-rpg-parchment border border-rpg-gold/20'
                                                    }`}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">CA</label>
                                    <input
                                        type="number"
                                        value={newMonster.ac}
                                        onChange={(e) => setNewMonster({ ...newMonster, ac: parseInt(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">HP</label>
                                    <input
                                        type="number"
                                        value={newMonster.hp}
                                        onChange={(e) => setNewMonster({ ...newMonster, hp: parseInt(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">XP</label>
                                    <input
                                        type="number"
                                        value={newMonster.xp}
                                        onChange={(e) => setNewMonster({ ...newMonster, xp: parseInt(e.target.value) || 0 })}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Descrição e habilidades..."
                                value={newMonster.description}
                                onChange={(e) => setNewMonster({ ...newMonster, description: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment min-h-[120px]"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveCustomMonster} className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                    {customMonsters.some(m => m.name === newMonster.name) ? 'Salvar Alterações' : 'Criar Criatura'}
                                </button>
                                <button onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewMonster({ name: '', type: 'Humanoide', ac: 10, hp: 10, challenge: '1/4', xp: 50, description: '', classes: [], subclass: '' });
                                }} className="bg-rpg-slate text-rpg-parchment px-6 py-2 rounded hover:bg-rpg-slate/80">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">Tipo</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none max-h-48 overflow-y-auto appearance-none"
                    >
                        <option value="">Todos</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">CR Mínimo</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={crMinFilter ?? ''}
                        onChange={(e) => setCrMinFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-sm text-rpg-grey mb-2">CR Máximo</label>
                    <input
                        type="number"
                        min="0"
                        max="30"
                        value={crMaxFilter ?? ''}
                        onChange={(e) => setCrMaxFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment focus:border-rpg-gold focus:outline-none"
                        placeholder="30"
                    />
                </div>
            </div>

            {/* Lista de Monstros */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {monsters.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhuma criatura encontrada.</p>
                    ) : (
                        monsters.map(monster => (
                            <div
                                key={monster.name}
                                onClick={() => setSelectedMonster(monster)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedMonster?.name === monster.name ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    🐉 {monster.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    CR {monster.challenge} • {monster.type} • {monster.xp} XP
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Detalhes do Monstro */}
                <div className={`${selectedMonster ? 'fixed inset-0 z-[60] bg-black/90 p-4 overflow-y-auto' : 'hidden'} md:block md:static md:bg-transparent md:p-0 md:overflow-visible`}>
                    <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 md:sticky md:top-4 relative shadow-2xl md:shadow-none min-h-[50vh]">
                        {selectedMonster && (
                            <button
                                onClick={() => setSelectedMonster(null)}
                                className="md:hidden absolute top-4 right-4 text-rpg-gold bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                            >
                                ✕
                            </button>
                        )}
                        {selectedMonster ? (
                            <div>
                                <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedMonster.name}</h3>
                                <p className="text-sm text-rpg-grey mb-4">{selectedMonster.type}</p>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-bold text-rpg-gold">CA:</span> {selectedMonster.ac}
                                        </div>
                                        <div>
                                            <span className="font-bold text-rpg-gold">HP:</span> {selectedMonster.hp}
                                        </div>
                                        <div>
                                            <span className="font-bold text-rpg-gold">CR:</span> {selectedMonster.challenge}
                                        </div>
                                        <div>
                                            <span className="font-bold text-rpg-gold">XP:</span> {selectedMonster.xp}
                                        </div>
                                        {selectedMonster.classes && selectedMonster.classes.length > 0 && (
                                            <div>
                                                <span className="font-bold text-rpg-gold">Classes:</span> {selectedMonster.classes.join(', ')}
                                            </div>
                                        )}
                                        {selectedMonster.subclass && (
                                            <div>
                                                <span className="font-bold text-rpg-gold">Subtipo/Tags:</span> {selectedMonster.subclass}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-3 border-t border-rpg-gold/20">
                                        <p className="text-rpg-parchment leading-relaxed">{selectedMonster.description}</p>
                                    </div>
                                    {customMonsters.some(m => m.name === selectedMonster.name) && (
                                        <div className="pt-4 flex gap-2">
                                            <button
                                                onClick={() => openEditModal(selectedMonster)}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => deleteCustomMonster(selectedMonster.name)}
                                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-rpg-grey py-12">
                                <p className="text-4xl mb-4">🐲</p>
                                <p>Selecione uma criatura para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente Itens
function ItensTab({ searchQuery, onAddItem }: { searchQuery: string; onAddItem?: (item: any) => void }) {
    const { user } = useAuth();
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [customItems, setCustomItems] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<any>({
        id: '',
        name: '',
        damage: '',
        diceQty: 1,
        diceType: 'd8',
        diceBonus: 0,
        isCustomDamage: false,
        damageType: '',
        properties: [] as string[],
        description: '',
        classes: [] as string[],
        subclass: ''
    });
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [customDamageTypes, setCustomDamageTypes] = useState<string[]>([]);
    const [customProperties, setCustomProperties] = useState<string[]>([]);
    const [newMetadataName, setNewMetadataName] = useState('');

    const [categoryFilter, setCategoryFilter] = useState('all');

    const loadMetadata = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCustomCategories(data.itemCategories || []);
                setCustomDamageTypes(data.itemDamageTypes || []);
                setCustomProperties(data.itemProperties || []);
            }
        } catch (error) {
            console.error('Erro ao carregar metadados:', error);
        }
    }, [user]);

    const loadGlobalItems = useCallback(async () => {
        try {
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            const itemsRef = collection(db, 'itens');
            const q = query(itemsRef, orderBy('name'));
            const querySnapshot = await getDocs(q);
            const items: any[] = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            return items;
        } catch (error) {
            console.error('Erro ao carregar itens globais:', error);
            return [];
        }
    }, []);

    const [globalItems, setGlobalItems] = useState<any[]>([]);

    const refreshGlobalItems = useCallback(async () => {
        const items = await loadGlobalItems();
        setGlobalItems(items);
    }, [loadGlobalItems]);

    useEffect(() => {
        if (user) {
            refreshGlobalItems();
        }
    }, [user, refreshGlobalItems]);

    const saveMetadata = async (type: string, value: string) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'library_metadata', user.uid);
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : {};

            const normalizedValue = normalizeName(value);
            const existingList = currentData[type] || [];

            if (!existingList.includes(normalizedValue)) {
                const updatedData = {
                    ...currentData,
                    [type]: [...existingList, normalizedValue]
                };
                await setDoc(docRef, updatedData);
                if (type === 'itemCategories') setCustomCategories(updatedData.itemCategories);
                if (type === 'itemDamageTypes') setCustomDamageTypes(updatedData.itemDamageTypes);
                if (type === 'itemProperties') setCustomProperties(updatedData.itemProperties);
            }
        } catch (error) {
            console.error('Erro ao salvar metadados:', error);
        }
    };

    const loadCustomItems = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'custom_items', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomItems(docSnap.data().items || []);
            }
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadCustomItems();
            loadMetadata();
        }
    }, [user, loadCustomItems, loadMetadata]);

    const saveCustomItem = async () => {
        if (!user || !newItem.name) return;
        try {
            const normalizedName = normalizeName(newItem.name);
            const itemId = newItem.id || `custom-item-${Date.now()}`;

            let finalDamage = newItem.damage;
            if (!newItem.isCustomDamage && newItem.diceQty && newItem.diceType) {
                const bonusStr = newItem.diceBonus ? ` + ${newItem.diceBonus}` : '';
                finalDamage = `${newItem.diceQty}${newItem.diceType}${bonusStr}`;
            }

            const item = {
                ...newItem,
                name: normalizedName,
                id: itemId,
                damage: finalDamage
            };

            let updatedItems: any[];
            const existingIndex = customItems.findIndex(i =>
                (i.id === itemId) || (normalizeName(i.name) === normalizedName)
            );

            if (existingIndex !== -1) {
                if (!confirm(`O item "${newItem.name}" já existe na sua enciclopédia. Deseja sobrescrevê-lo?`)) {
                    return;
                }
                updatedItems = [...customItems];
                updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...item };
            } else {
                // Check Global Items DB before creating new
                const globalDocRef = doc(db, 'itens', item.id);
                const globalDocSnap = await getDoc(globalDocRef);

                if (globalDocSnap.exists()) {
                    alert(`O item "${newItem.name}" já existe na enciclopédia oficial. Tente usar um nome diferente.`);
                    return;
                }
                updatedItems = [...customItems, item];
            }

            await setDoc(doc(db, 'custom_items', user.uid), { items: updatedItems });
            setCustomItems(updatedItems);
            setIsAddModalOpen(false);
            setNewItem({ id: '', name: '', damage: '', diceQty: 1, diceType: 'd8', diceBonus: 0, isCustomDamage: false, damageType: '', properties: [], description: '', classes: [], subclass: '' });
            if (selectedItem?.name === normalizedName || selectedItem?.id === itemId) setSelectedItem(item);
        } catch (error) {
            console.error('Erro ao salvar item:', error);
        }
    };

    const deleteCustomItem = async (itemId: string) => {
        if (!user || !confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            const updatedItems = customItems.filter(i => i.id !== itemId);
            await setDoc(doc(db, 'custom_items', user.uid), { items: updatedItems });
            setCustomItems(updatedItems);
            if (selectedItem?.id === itemId) setSelectedItem(null);
        } catch (error) {
            console.error('Erro ao excluir item:', error);
        }
    };

    const openEditModal = (item: any) => {
        setNewItem({
            ...item,
            isCustomDamage: item.isCustomDamage !== undefined ? item.isCustomDamage : true,
            diceQty: item.diceQty || 1,
            diceType: item.diceType || 'd8',
            diceBonus: item.diceBonus || 0,
            properties: item.properties || []
        });
        setIsAddModalOpen(true);
    };

    const allItems = [...globalItems, ...customItems].filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.damageType && item.damageType.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === 'all' || item.itemType === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">⚗️ Enciclopédia de Itens</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                    >
                        + Adicionar Item
                    </button>
                </div>
            </div>

            {/* Filtros por Categoria */}
            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'Todos', icon: '📦' },
                    { id: 'WEAPON', label: 'Armas', icon: '⚔️' },
                    { id: 'ARMOR', label: 'Armaduras', icon: '🛡️' },
                    { id: 'SHIELD', label: 'Escudos', icon: '🛡️' },
                    { id: 'NORMAL', label: 'Equipamentos', icon: '🎒' },
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${categoryFilter === cat.id
                            ? 'bg-rpg-gold text-rpg-dark border-rpg-gold shadow-lg shadow-rpg-gold/20'
                            : 'bg-rpg-slate text-rpg-grey border-rpg-gold/10 hover:border-rpg-gold/30'
                            }`}
                    >
                        <span>{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Modal de Adicionar Item */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold">
                                {newItem.id ? 'Editar Item' : 'Novo Item Customizado'}
                            </h3>
                            <button onClick={() => {
                                setIsAddModalOpen(false);
                                setNewItem({ id: '', name: '', damage: '', diceQty: 1, diceType: 'd8', diceBonus: 0, isCustomDamage: false, damageType: '', properties: [], description: '', classes: [], subclass: '' });
                            }} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome do Item"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-rpg-grey uppercase">Dano / Efeito</label>
                                    <label className="flex items-center gap-2 text-xs text-rpg-gold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newItem.isCustomDamage}
                                            onChange={(e) => setNewItem({ ...newItem, isCustomDamage: e.target.checked })}
                                            className="accent-rpg-gold"
                                        />
                                        Dano Customizado
                                    </label>
                                </div>

                                {newItem.isCustomDamage ? (
                                    <input
                                        type="text"
                                        placeholder="Dano (ex: 1d8, +1 AC, etc.)"
                                        value={newItem.damage}
                                        onChange={(e) => setNewItem({ ...newItem, damage: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex bg-rpg-slate border border-rpg-gold/20 rounded overflow-hidden">
                                            <span className="px-2 py-2 text-xs text-rpg-grey bg-black/20 flex items-center border-r-rpg-gold/20">Qtde</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={newItem.diceQty}
                                                onChange={(e) => setNewItem({ ...newItem, diceQty: parseInt(e.target.value) || 1 })}
                                                onFocus={(e) => e.target.select()}
                                                className="w-full bg-transparent px-2 py-2 text-rpg-parchment text-center"
                                            />
                                        </div>
                                        <select
                                            value={newItem.diceType}
                                            onChange={(e) => setNewItem({ ...newItem, diceType: e.target.value })}
                                            className="bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                        >
                                            {DEFAULT_DICE.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <div className="flex bg-rpg-slate border border-rpg-gold/20 rounded overflow-hidden">
                                            <span className="px-2 py-2 text-xs text-rpg-grey bg-black/20 flex items-center border-r-rpg-gold/20">+ Bonus</span>
                                            <input
                                                type="number"
                                                value={newItem.diceBonus}
                                                onChange={(e) => setNewItem({ ...newItem, diceBonus: parseInt(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                className="w-full bg-transparent px-2 py-2 text-rpg-parchment text-center"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-rpg-grey uppercase mb-1 block">Propriedades</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {[...DEFAULT_PROPERTIES, ...customProperties].map(prop => (
                                        <button
                                            key={prop}
                                            onClick={() => {
                                                const props = newItem.properties || [];
                                                const updated = props.includes(prop)
                                                    ? props.filter(p => p !== prop)
                                                    : [...props, prop];
                                                setNewItem({ ...newItem, properties: updated });
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${newItem.properties?.includes(prop)
                                                ? 'bg-rpg-gold text-rpg-dark'
                                                : 'bg-rpg-slate text-rpg-parchment border border-rpg-gold/20'
                                                }`}
                                        >
                                            {prop}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nova Propriedade..."
                                        className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-3 py-2 text-xs text-rpg-parchment"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val) {
                                                    saveMetadata('itemProperties', val);
                                                    const props = newItem.properties || [];
                                                    if (!props.includes(normalizeName(val))) {
                                                        setNewItem({ ...newItem, properties: [...props, normalizeName(val)] });
                                                    }
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Categoria</label>
                                    <select
                                        value={(newItem as any).type || ''}
                                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value } as any)}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {[...DEFAULT_ITEM_CATEGORIES, ...customCategories].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nova Categoria..."
                                            value={newMetadataName}
                                            onChange={(e) => setNewMetadataName(e.target.value)}
                                            className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!newMetadataName) return;
                                                saveMetadata('itemCategories', newMetadataName);
                                                setNewItem({ ...newItem, type: normalizeName(newMetadataName) } as any);
                                                setNewMetadataName('');
                                            }}
                                            className="bg-rpg-gold/20 text-rpg-gold px-2 py-1 rounded text-xs"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Tipo de Dano / Efeito</label>
                                    <select
                                        value={(newItem as any).damageType || ''}
                                        onChange={(e) => setNewItem({ ...newItem, damageType: e.target.value } as any)}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment mb-2 max-h-48 overflow-y-auto appearance-none"
                                    >
                                        <option value="">Nenhum</option>
                                        {[...DEFAULT_DAMAGE_TYPES, ...customDamageTypes].map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Novo Dano..."
                                            className="flex-1 bg-rpg-slate border border-rpg-gold/10 rounded px-2 py-1 text-xs text-rpg-parchment"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) {
                                                        saveMetadata('itemDamageTypes', val);
                                                        setNewItem({ ...newItem, damageType: normalizeName(val) } as any);
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-rpg-grey uppercase mb-1 block">Classes de Personagem (quem pode usar)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {DEFAULT_CLASSES.map(cls => (
                                        <button
                                            key={cls}
                                            onClick={() => {
                                                const classesArr = (newItem.classes || []);
                                                const updated = classesArr.includes(cls)
                                                    ? classesArr.filter(c => c !== cls)
                                                    : [...classesArr, cls];
                                                setNewItem({ ...newItem, classes: updated });
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${(newItem.classes || []).includes(cls)
                                                ? 'bg-rpg-gold text-rpg-dark'
                                                : 'bg-rpg-slate text-rpg-parchment border border-rpg-gold/20'
                                                }`}
                                        >
                                            {cls}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                placeholder="Descrição detalhada do item..."
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment min-h-[120px]"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveCustomItem} className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                    {newItem.id ? 'Salvar Alterações' : 'Criar Item'}
                                </button>
                                <button onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewItem({ id: '', name: '', damage: '', damageType: '', properties: [], description: '', class: '', classes: [], subclass: '' });
                                }} className="bg-rpg-slate text-rpg-parchment px-6 py-2 rounded hover:bg-rpg-slate/80">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {allItems.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhum item encontrado.</p>
                    ) : (
                        allItems.map(item => (
                            <div
                                key={item.id || item.name}
                                onClick={() => setSelectedItem(item)}
                                className={`bg-rpg-panel border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedItem?.name === item.name ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                        {item.itemType === 'WEAPON' ? '⚔️' : item.itemType === 'ARMOR' || item.itemType === 'SHIELD' ? '🛡️' : '🎒'} {item.name}
                                    </h3>
                                    {item.price > 0 && (
                                        <span className="text-[10px] text-rpg-gold/60 font-bold uppercase">
                                            {item.price} {item.currency}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {item.itemType === 'WEAPON' && item.damage && (
                                        <span className="text-[10px] bg-red-900/40 text-red-200 px-1.5 py-0.5 rounded border border-red-500/20">
                                            {item.damage} {item.damageType}
                                        </span>
                                    )}
                                    {(item.itemType === 'ARMOR' || item.itemType === 'SHIELD') && item.ac > 0 && (
                                        <span className="text-[10px] bg-blue-900/40 text-blue-200 px-1.5 py-0.5 rounded border border-blue-500/20">
                                            CA {item.itemType === 'SHIELD' ? '+' : ''}{item.ac}
                                        </span>
                                    )}
                                    {item.weight > 0 && (
                                        <span className="text-[10px] bg-rpg-slate text-rpg-grey px-1.5 py-0.5 rounded border border-rpg-gold/10">
                                            {item.weight} kg
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={`${selectedItem ? 'fixed inset-0 z-[60] bg-black/90 p-4 overflow-y-auto' : 'hidden'} md:block md:static md:bg-transparent md:p-0 md:overflow-visible`}>
                    <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 md:sticky md:top-4 relative shadow-2xl md:shadow-none min-h-[50vh]">
                        {selectedItem && (
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="md:hidden absolute top-4 right-4 text-rpg-gold bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                            >
                                ✕
                            </button>
                        )}
                        {selectedItem ? (
                            <div>
                                <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedItem.name}</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-3 rounded border border-rpg-gold/10">
                                            <span className="text-[10px] text-rpg-grey uppercase block mb-1">Tipo de Item</span>
                                            <span className="font-bold text-rpg-gold">{selectedItem.itemType || 'NORMAL'}</span>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded border border-rpg-gold/10">
                                            <span className="text-[10px] text-rpg-grey uppercase block mb-1">Preço</span>
                                            <span className="font-bold text-rpg-gold">{selectedItem.price || 0} {selectedItem.currency || 'GP'}</span>
                                        </div>
                                        {selectedItem.itemType === 'WEAPON' && (
                                            <div className="bg-black/20 p-3 rounded border border-rpg-gold/10">
                                                <span className="text-[10px] text-rpg-grey uppercase block mb-1">Dano</span>
                                                <span className="font-bold text-rpg-gold">{selectedItem.damage} {selectedItem.damageType}</span>
                                            </div>
                                        )}
                                        {(selectedItem.itemType === 'ARMOR' || selectedItem.itemType === 'SHIELD') && (
                                            <div className="bg-black/20 p-3 rounded border border-rpg-gold/10">
                                                <span className="text-[10px] text-rpg-grey uppercase block mb-1">{selectedItem.itemType === 'SHIELD' ? 'Bônus CA' : 'Classe de Armadura'}</span>
                                                <span className="font-bold text-rpg-gold">{selectedItem.itemType === 'SHIELD' ? '+' : ''}{selectedItem.ac}</span>
                                            </div>
                                        )}
                                        <div className="bg-black/20 p-3 rounded border border-rpg-gold/10">
                                            <span className="text-[10px] text-rpg-grey uppercase block mb-1">Peso</span>
                                            <span className="font-bold text-rpg-gold">{selectedItem.weight || 0} kg</span>
                                        </div>
                                    </div>

                                    {selectedItem.itemType === 'ARMOR' && (
                                        <div className="flex gap-4">
                                            {selectedItem.strengthReq > 0 && (
                                                <div className="px-3 py-1 bg-red-900/20 border border-red-500/30 rounded text-red-200 text-xs">
                                                    Força Requerida: {selectedItem.strengthReq}
                                                </div>
                                            )}
                                            {selectedItem.stealthDisadvantage && (
                                                <div className="px-3 py-1 bg-orange-900/20 border border-orange-500/30 rounded text-orange-200 text-xs">
                                                    Desvantagem Furtividade
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-rpg-gold/20">
                                        <span className="text-[10px] text-rpg-grey uppercase block mb-2">Propriedades</span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.properties && selectedItem.properties.length > 0 ? (
                                                selectedItem.properties.map((prop: string, idx: number) => (
                                                    <span key={idx} className="bg-rpg-slate border border-rpg-gold/10 px-2 py-1 rounded text-xs text-rpg-parchment italic">
                                                        {prop}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-rpg-grey italic">Nenhuma</span>
                                            )}
                                        </div>
                                    </div>

                                    {selectedItem.description && (
                                        <div className="pt-3 border-t border-rpg-gold/20">
                                            <span className="text-[10px] text-rpg-grey uppercase block mb-2">Descrição</span>
                                            <p className="text-rpg-parchment leading-relaxed">{selectedItem.description}</p>
                                        </div>
                                    )}
                                    {selectedItem.id?.toString().startsWith('custom-item-') && (
                                        <div className="pt-4 flex gap-2">
                                            <button
                                                onClick={() => openEditModal(selectedItem)}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => deleteCustomItem(selectedItem.id)}
                                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    )}
                                    {onAddItem && (
                                        <div className="pt-4 mt-4 border-t border-rpg-gold/20">
                                            <button
                                                onClick={() => onAddItem(selectedItem)}
                                                className="w-full bg-rpg-gold text-rpg-dark font-bold py-2 rounded shadow-glow-gold/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                            >
                                                🎒 Adicionar à Ficha
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-rpg-grey py-12">
                                <p className="text-4xl mb-4">⚔️</p>
                                <p>Selecione um item para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Componente Regras (SRD)
function RegrasTab({ searchQuery }: { searchQuery: string }) {
    const { user } = useAuth();
    const [customRules, setCustomRules] = useState<any[]>([]);
    const [srdChapters, setSrdChapters] = useState<any[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRule, setNewRule] = useState({ id: '', title: '', content: '' });

    const loadCustomRules = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'custom_rules', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomRules(docSnap.data().rules || []);
            }
        } catch (error) {
            console.error('Erro ao carregar regras:', error);
        }
    }, [user]);

    const loadSRD = useCallback(async () => {
        const book = await fetchSRDBookFromFirestore();
        setSrdChapters(book.chapters);
        if (!selectedChapter && book.chapters.length > 0) {
            setSelectedChapter(book.chapters[0]);
        }
    }, [selectedChapter]);

    useEffect(() => {
        loadSRD();
        if (user) loadCustomRules();
    }, [user, loadCustomRules, loadSRD]);

    const saveCustomRule = async () => {
        if (!user || !newRule.title) return;
        try {
            const normalizedTitle = normalizeName(newRule.title);
            const ruleId = newRule.id || `custom-rule-${Date.now()}`;

            const rule = {
                ...newRule,
                title: normalizedTitle,
                id: ruleId
            };

            let updatedRules: any[];
            const existingIndex = customRules.findIndex(r =>
                (r.id === ruleId) || (normalizeName(r.title) === normalizedTitle)
            );

            if (existingIndex !== -1) {
                if (!confirm(`A regra "${newRule.title}" já existe nas suas regras customizadas. Deseja sobrescrevê-la?`)) {
                    return;
                }
                updatedRules = [...customRules];
                updatedRules[existingIndex] = { ...updatedRules[existingIndex], ...rule };
            } else {
                // Check Global SRD Rules
                const globalRule = srdChapters.find(c => normalizeName(c.title) === normalizedTitle);
                if (globalRule) {
                    alert(`A regra "${newRule.title}" já existe no SRD oficial. Tente usar um título diferente.`);
                    return;
                }
                updatedRules = [...customRules, rule];
            }

            await setDoc(doc(db, 'custom_rules', user.uid), { rules: updatedRules });
            setCustomRules(updatedRules);
            setIsAddModalOpen(false);
            setNewRule({ id: '', title: '', content: '' });
            if (selectedChapter.id === ruleId || normalizeName(selectedChapter.title) === normalizedTitle) {
                setSelectedChapter(rule);
            }
        } catch (error) {
            console.error('Erro ao salvar regra:', error);
        }
    };

    const deleteCustomRule = async (ruleId: string) => {
        if (!user || !confirm('Tem certeza que deseja excluir esta regra?')) return;
        try {
            const updatedRules = customRules.filter(r => r.id !== ruleId);
            await setDoc(doc(db, 'custom_rules', user.uid), { rules: updatedRules });
            setCustomRules(updatedRules);
            if (selectedChapter?.id === ruleId && srdChapters.length > 0) setSelectedChapter(srdChapters[0]);
        } catch (error) {
            console.error('Erro ao excluir regra:', error);
        }
    };

    const openEditModal = (rule: any) => {
        setNewRule({ ...rule });
        setIsAddModalOpen(true);
    };

    const allChapters = [...srdChapters, ...customRules];
    const filteredChapters = allChapters.filter(chapter =>
        chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">📕 System Reference Document 5.1</h2>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (confirm("Deseja sincronizar todas as Habilidades, Raças e Talentos com o Banco de Dados Global?")) {
                                try {
                                    await syncAllGameRulesToFirestore();
                                    await loadSRD();
                                    alert("✅ Sincronização concluída com sucesso!");
                                } catch (e) {
                                    alert("❌ Erro ao sincronizar. Verifique o console.");
                                }
                            }
                        }}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 px-4 py-2 rounded font-bold transition-all text-sm flex items-center gap-2"
                    >
                        ✨ Sincronizar Regras Base
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                    >
                        + Adicionar Regra
                    </button>
                </div>
            </div>
            <p className="text-rpg-grey mb-6">O SRD contém as regras essenciais, classes, magias e monstros do Dungeons & Dragons, disponibilizado sob a Open Gaming License (OGL).</p>

            {/* Modal de Adicionar Regra */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold">
                                {newRule.id ? 'Editar Regra' : 'Nova Regra Customizada'}
                            </h3>
                            <button onClick={() => {
                                setIsAddModalOpen(false);
                                setNewRule({ id: '', title: '', content: '' });
                            }} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Título da Regra"
                                value={newRule.title}
                                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <textarea
                                placeholder="Conteúdo da regra (suporta HTML básico)..."
                                value={newRule.content}
                                onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment min-h-[300px] font-mono text-sm"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveCustomRule} className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                    {newRule.id ? 'Salvar Alterações' : 'Criar Regra'}
                                </button>
                                <button onClick={() => {
                                    setIsAddModalOpen(false);
                                    setNewRule({ id: '', title: '', content: '' });
                                }} className="bg-rpg-slate text-rpg-parchment px-6 py-2 rounded hover:bg-rpg-slate/80">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    {filteredChapters.map(chapter => (
                        <button
                            key={chapter.id}
                            onClick={() => setSelectedChapter(chapter)}
                            className={`w-full text-left p-3 rounded transition-all ${selectedChapter.id === chapter.id
                                ? 'bg-rpg-gold text-rpg-dark font-bold'
                                : 'bg-rpg-slate text-rpg-parchment hover:bg-rpg-slate/80 border border-rpg-gold/10'
                                }`}
                        >
                            {chapter.title}
                        </button>
                    ))}
                </div>

                <div className={`${selectedChapter ? 'fixed inset-0 z-[60] bg-black/99 md:bg-black/90 p-4 overflow-y-auto' : 'hidden'} md:block md:col-span-3 md:bg-rpg-slate md:border md:border-rpg-gold/20 md:rounded md:p-6 md:max-h-[600px] md:static md:overflow-y-auto relative`}>
                    {selectedChapter && (
                        <button
                            onClick={() => setSelectedChapter(null)}
                            className="md:hidden absolute top-4 right-4 text-rpg-gold bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                        >
                            ✕
                        </button>
                    )}
                    {selectedChapter ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">{selectedChapter.title}</h2>
                                {selectedChapter.id && selectedChapter.id.toString().startsWith('custom-rule-') && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(selectedChapter)}
                                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => deleteCustomRule(selectedChapter.id.toString())}
                                            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                        >
                                            🗑️ Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-rpg-grey">
                            <div className="text-center">
                                <p className="text-4xl mb-2">📜</p>
                                <p>Selecione uma regra para ler.</p>
                                {srdChapters.length === 0 && <p className="text-xs mt-2 text-yellow-500/50">Nenhuma regra encontrada. Verifique a internet ou sincronize.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Anotações do Mestre
function NotasTab() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<any[]>([]);
    const [selectedNote, setSelectedNote] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadNotes = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'master_notes_list', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setNotes(docSnap.data().notes || []);
            }
        } catch (error) {
            console.error('Erro ao carregar anotações:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) loadNotes();
    }, [user, loadNotes]);

    const handleCreateNote = () => {
        const newNote = {
            id: `note-${Date.now()}`,
            title: 'Nova Anotação',
            content: '',
            updatedAt: new Date()
        };
        setSelectedNote(newNote);
    };

    const saveNote = async () => {
        if (!user || !selectedNote) return;
        setIsSaving(true);
        try {
            const noteToSave = {
                ...selectedNote,
                updatedAt: new Date()
            };

            let updatedNotes: any[];
            const exists = notes.some(n => n.id === noteToSave.id);
            if (exists) {
                updatedNotes = notes.map(n => n.id === noteToSave.id ? noteToSave : n);
            } else {
                updatedNotes = [noteToSave, ...notes];
            }

            await setDoc(doc(db, 'master_notes_list', user.uid), { notes: updatedNotes });
            setNotes(updatedNotes);
            setSelectedNote(noteToSave);
        } catch (error) {
            console.error('Erro ao salvar anotação:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteNote = async (noteId: string) => {
        if (!user || !confirm('Deseja excluir esta anotação?')) return;
        try {
            const updatedNotes = notes.filter(n => n.id !== noteId);
            await setDoc(doc(db, 'master_notes_list', user.uid), { notes: updatedNotes });
            setNotes(updatedNotes);
            if (selectedNote?.id === noteId) setSelectedNote(null);
        } catch (error) {
            console.error('Erro ao excluir anotação:', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">📜 Anotações do Mestre</h2>
                <button
                    onClick={handleCreateNote}
                    className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                >
                    + Nova Nota
                </button>
            </div>
            <p className="text-rpg-grey mb-6">Registre o Lore do seu mundo, Regras da Casa e notas de sessões.</p>

            <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                    {notes.length === 0 ? (
                        <p className="text-rpg-grey text-xs italic">Nenhuma nota criada.</p>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => setSelectedNote(note)}
                                className={`p-3 rounded border cursor-pointer transition-all ${selectedNote?.id === note.id
                                    ? 'bg-rpg-gold text-rpg-dark border-rpg-gold'
                                    : 'bg-rpg-slate text-rpg-parchment border-rpg-gold/10 hover:border-rpg-gold/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-bold truncate text-sm">{note.title}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                        className="text-[10px] opacity-50 hover:opacity-100"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <p className="text-[10px] opacity-70 mt-1">
                                    {note.updatedAt instanceof Date ? note.updatedAt.toLocaleDateString() : note.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recentemente'}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="md:col-span-3">
                    {selectedNote ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={selectedNote.title}
                                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded p-3 text-rpg-gold font-bold focus:border-rpg-gold outline-none"
                                placeholder="Título da Nota..."
                            />
                            <textarea
                                value={selectedNote.content}
                                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                                placeholder="Digite suas anotações aqui..."
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded p-4 text-rpg-parchment placeholder-rpg-grey min-h-[400px] focus:border-rpg-gold focus:outline-none transition-all font-mono text-sm"
                            />
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={saveNote}
                                    disabled={isSaving}
                                    className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? '💾 Salvando...' : '💾 Salvar Nota'}
                                </button>
                                {selectedNote.updatedAt && (
                                    <span className="text-[10px] text-rpg-grey uppercase tracking-widest">
                                        Atualizado em: {selectedNote.updatedAt instanceof Date ? selectedNote.updatedAt.toLocaleString() : selectedNote.updatedAt?.toDate?.()?.toLocaleString() || 'Agora'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-rpg-slate/30 border border-dashed border-rpg-gold/20 rounded-lg h-[400px] flex items-center justify-center text-rpg-grey">
                            <p>Selecione uma nota ou crie uma nova para começar.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// Componente Arquivista (Processamento de PDFs)
function ArquivistaTab() {
    const [books, setBooks] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch('/api/books/list');
                const data = await res.json();
                setBooks(data);
            } catch (error) {
                console.error('Erro ao listar livros:', error);
            }
        };
        fetchBooks();
    }, []);

    const processBook = async (filename: string) => {
        setIsScanning(true);
        setResults(null);
        try {
            const res = await fetch('/api/books/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            const data = await res.json();
            if (res.ok) {
                setResults(data);
            } else {
                alert(`Erro: ${data.error || 'Falha ao processar o livro'}`);
            }
        } catch (error) {
            console.error('Erro ao processar livro:', error);
            alert('Erro ao processar PDF.');
        } finally {
            setIsScanning(false);
        }
    };

    const importMechanic = async (mechanic: ParsedMechanic) => {
        if (!user || !results) return;
        try {
            const success = await ArchiveStorage.saveMechanic(user.uid, mechanic, results.info.title);
            if (success) {
                alert(`✅ ${mechanic.name} importado com sucesso!`);
            } else {
                alert(`❌ Erro ao importar ${mechanic.name}`);
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert('Erro crítico ao importar.');
        }
    };

    const fetchFromAPI = async (type: string) => {
        setIsScanning(true);
        setResults(null);
        try {
            const res = await fetch(`/api/dnd-api?type=${type}`);
            const data = await res.json();

            if (res.ok) {
                // Converter formato da API para nosso formato
                const mechanics = data.items.map((item: any) => ({
                    type: type === 'spells' ? 'spell' : type === 'monsters' ? 'monster' : 'item',
                    name: item.name,
                    content: item.desc?.join(' ') || item.description || JSON.stringify(item).substring(0, 200),
                    raw: JSON.stringify(item),
                    metadata: item
                }));

                setResults({
                    count: mechanics.length,
                    mechanics: mechanics,
                    info: {
                        title: `API D&D 5e - ${type}`,
                        pages: Math.ceil(mechanics.length / 10)
                    }
                });
            } else {
                alert(`Erro: ${data.error || 'Falha ao buscar da API'}`);
            }
        } catch (error) {
            console.error('Erro ao buscar da API:', error);
            alert('Erro ao conectar com a API.');
        } finally {
            setIsScanning(false);
        }
    };

    const fetchFrom5etools = async (type: string) => {
        setIsScanning(true);
        setResults(null);
        try {
            const res = await fetch(`/api/fivetools?type=${type}`);
            const data = await res.json();

            if (res.ok) {
                const mechanics = data.items.map((item: any) => ({
                    type: type === 'spells' ? 'spell' : type === 'monsters' ? 'monster' : type === 'classes' || type === 'races' ? 'rule' : 'item',
                    name: item.name,
                    content: item.entries?.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e)).join(' ') || item.description || JSON.stringify(item).substring(0, 200),
                    raw: JSON.stringify(item),
                    metadata: item
                }));

                setResults({
                    count: mechanics.length,
                    mechanics: mechanics,
                    info: {
                        title: `5etools - ${type}`,
                        pages: Math.ceil(mechanics.length / 10)
                    }
                });
            } else {
                alert(`Erro: ${data.error || 'Falha ao buscar do 5etools'}`);
            }
        } catch (error) {
            console.error('Erro ao buscar do 5etools:', error);
            alert('Erro ao conectar com o 5etools.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">🏛️ O Arquivista</h2>
                <p className="text-rpg-grey text-sm italic">Processar PDFs e extrair mecânicas...</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Lista de Livros */}
                <div className="bg-rpg-slate/50 p-4 rounded-lg border border-rpg-gold/10 h-fit space-y-4">
                    <h3 className="text-lg font-bold font-cinzel text-rpg-gold mb-2">Importar da API Oficial</h3>
                    <p className="text-xs text-rpg-grey mb-3">Buscar dados do SRD D&D 5e</p>

                    <div className="space-y-2">
                        <button
                            onClick={() => fetchFromAPI('spells')}
                            disabled={isScanning}
                            className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border border-blue-500/30 px-3 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                        >
                            🔮 Magias SRD
                        </button>
                        <button
                            onClick={() => fetchFromAPI('monsters')}
                            disabled={isScanning}
                            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 border border-red-500/30 px-3 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                        >
                            👹 Monstros SRD
                        </button>
                        <button
                            onClick={() => fetchFromAPI('equipment')}
                            disabled={isScanning}
                            className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 px-3 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                        >
                            ⚔️ Equipamentos SRD
                        </button>
                    </div>

                    <div className="border-t border-rpg-gold/10 pt-4 mt-4">
                        <h3 className="text-lg font-bold font-cinzel text-rpg-gold mb-2">5etools (Mais Conteúdo)</h3>
                        <p className="text-xs text-rpg-grey mb-3">Classes, raças e mais</p>
                        <div className="space-y-2 mb-4">
                            <button
                                onClick={() => fetchFrom5etools('classes')}
                                disabled={isScanning}
                                className="w-full bg-green-600/20 hover:bg-green-600/40 text-green-200 border border-green-500/30 px-3 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                            >
                                📚 Classes
                            </button>
                            <button
                                onClick={() => fetchFrom5etools('races')}
                                disabled={isScanning}
                                className="w-full bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 border border-yellow-500/30 px-3 py-2 rounded text-xs font-bold transition-all disabled:opacity-50"
                            >
                                👥 Raças
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-rpg-gold/10 pt-4 mt-4">
                        <h3 className="text-lg font-bold font-cinzel text-rpg-gold mb-4">Seus Livros (PDF)</h3>
                        {books.length === 0 ? (
                            <p className="text-xs text-rpg-grey italic">Nenhum PDF encontrado na pasta /books.</p>
                        ) : (
                            <div className="space-y-2">
                                {books.map(book => (
                                    <div key={book} className="flex flex-col gap-2 p-3 bg-rpg-panel border border-white/5 rounded">
                                        <span className="text-xs truncate font-medieval" title={book}>{book}</span>
                                        <button
                                            onClick={() => processBook(book)}
                                            disabled={isScanning}
                                            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 px-3 py-1 rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                        >
                                            {isScanning ? '⏳ Processando...' : '🔍 Processar Livro'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Resultados */}
                <div className="md:col-span-2">
                    {results && results.info ? (
                        <div className="space-y-4">
                            <div className="bg-rpg-gold/10 border border-rpg-gold/30 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-rpg-gold">{results.info?.title || 'Livro'}</h4>
                                    <p className="text-xs text-rpg-grey">{results.count} mecânicas detectadas.</p>
                                </div>
                                <span className="text-xs bg-rpg-gold/20 text-rpg-gold px-2 py-1 rounded">{results.info?.pages || 0} páginas</span>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {results.mechanics && results.mechanics.map((m: any, i: number) => (
                                    <div key={i} className="bg-rpg-panel border border-rpg-gold/10 p-4 rounded hover:border-rpg-gold/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${m.type === 'spell' ? 'bg-blue-900/40 text-blue-300' :
                                                    m.type === 'monster' ? 'bg-red-900/40 text-red-300' :
                                                        m.type === 'item' ? 'bg-purple-900/40 text-purple-300' :
                                                            'bg-gray-900/40 text-gray-300'
                                                    }`}>
                                                    {m.type === 'spell' ? 'Magia' : m.type === 'monster' ? 'Monstro' : m.type === 'item' ? 'Item' : 'Regra'}
                                                </span>
                                                <h5 className="font-bold text-rpg-gold-light">{m.name}</h5>
                                            </div>
                                            <button
                                                onClick={() => importMechanic(m)}
                                                className="bg-rpg-gold/80 hover:bg-rpg-gold text-rpg-dark px-3 py-1 rounded text-[10px] font-bold"
                                            >
                                                Importar
                                            </button>
                                        </div>
                                        <div className="text-xs text-rpg-parchment/70 line-clamp-3 font-medieval">
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isScanning ? (
                        <div className="flex flex-col items-center justify-center py-20 text-rpg-grey">
                            <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 border-4 border-rpg-gold/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-rpg-gold border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="font-cinzel text-lg animate-pulse">Processando PDF...</p>
                            <p className="text-xs mt-2 italic">Isso pode levar alguns minutos para PDFs grandes.</p>
                        </div>
                    ) : (
                        <div className="bg-rpg-slate/20 border border-dashed border-rpg-gold/20 rounded-lg h-[500px] flex items-center justify-center text-rpg-grey">
                            <div className="text-center p-8 max-w-md">
                                <p className="text-4xl mb-4 opacity-50">📚</p>
                                <p className="font-medieval mb-4">Selecione um livro ao lado para processar.</p>
                                <div className="text-[10px] text-left space-y-2 bg-rpg-panel/50 p-4 rounded">
                                    <p><strong>Como funciona:</strong></p>
                                    <p>• O sistema lê o PDF automaticamente</p>
                                    <p>• Usa Regex para identificar mecânicas</p>
                                    <p>• Não gasta tokens de IA</p>
                                    <p className="text-rpg-gold mt-2">✨ 100% automático!</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente NPCs
function NpcTab({ searchQuery }: { searchQuery: string }) {
    const { user } = useAuth();
    const [selectedNpc, setSelectedNpc] = useState<NPCTemplate | null>(null);
    const [customNpcs, setCustomNpcs] = useState<NPCTemplate[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newNpc, setNewNpc] = useState<Partial<NPCTemplate>>({
        name: '',
        hp: 10,
        ac: 10,
        challenge: '1/4',
        xp: 50,
        description: '',
        role: 'civilian',
        race: 'Humano'
    });

    const loadCustomNpcs = useCallback(async () => {
        if (!user) return;
        try {
            const docRef = doc(db, 'custom_npcs', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCustomNpcs(docSnap.data().npcs || []);
            }
        } catch (error) {
            console.error('Erro ao carregar NPCs:', error);
        }
    }, [user]);

    useEffect(() => {
        if (user) loadCustomNpcs();
    }, [user, loadCustomNpcs]);

    const saveCustomNpc = async () => {
        if (!user || !newNpc.name) return;
        try {
            const npc: NPCTemplate = {
                ...(newNpc as NPCTemplate),
                name: newNpc.name.trim()
            };

            let updatedNpcs: NPCTemplate[];
            const existingIndex = customNpcs.findIndex(n => n.name === npc.name);

            if (existingIndex !== -1) {
                if (!confirm(`O NPC "${npc.name}" já existe na sua galeria. Deseja sobrescrevê-lo?`)) {
                    return;
                }
                updatedNpcs = [...customNpcs];
                updatedNpcs[existingIndex] = npc;
            } else {
                // Check Global NPCs (Templates)
                const globalParams = searchNpcs(npc.name);
                const globalMatch = globalParams.find(n => n.name.toLowerCase() === npc.name.toLowerCase());
                if (globalMatch) {
                    alert(`O NPC "${npc.name}" já existe como um modelo oficial. Tente usar um nome diferente.`);
                    return;
                }
                updatedNpcs = [...customNpcs, npc];
            }

            await setDoc(doc(db, 'custom_npcs', user.uid), { npcs: updatedNpcs });
            setCustomNpcs(updatedNpcs);
            setIsAddModalOpen(false);
            setNewNpc({ name: '', hp: 10, ac: 10, challenge: '1/4', xp: 50, description: '', role: 'civilian', race: 'Humano' });
            if (selectedNpc?.name === npc.name) setSelectedNpc(npc);
        } catch (error) {
            console.error('Erro ao salvar NPC:', error);
        }
    };

    const deleteCustomNpc = async (npcName: string) => {
        if (!user || !confirm('Tem certeza que deseja excluir este NPC?')) return;
        try {
            const updatedNpcs = customNpcs.filter(n => n.name !== npcName);
            await setDoc(doc(db, 'custom_npcs', user.uid), { npcs: updatedNpcs });
            setCustomNpcs(updatedNpcs);
            if (selectedNpc?.name === npcName) setSelectedNpc(null);
        } catch (error) {
            console.error('Erro ao excluir NPC:', error);
        }
    };

    const openEditModal = (npc: NPCTemplate) => {
        setNewNpc({ ...npc });
        setIsAddModalOpen(true);
    };

    const allNpcs = [...searchNpcs(searchQuery), ...customNpcs.filter(n =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase())
    )];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold font-cinzel text-rpg-gold">👥 Galeria de NPCs</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-rpg-gold text-rpg-dark px-4 py-2 rounded font-bold hover:scale-105 transition-all text-sm"
                    >
                        + Adicionar NPC
                    </button>
                </div>
            </div>

            {/* Modal de Adicionar NPC */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
                    <div className="bg-rpg-panel border-2 border-rpg-gold/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-rpg-panel border-b border-rpg-gold/20 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-cinzel text-rpg-gold">
                                {customNpcs.some(n => n.name === newNpc.name) ? 'Editar NPC' : 'Novo NPC Customizado'}
                            </h3>
                            <button onClick={() => {
                                setIsAddModalOpen(false);
                                setNewNpc({ name: '', hp: 10, ac: 10, challenge: '1/4', xp: 50, description: '', role: 'civilian', race: 'Humano' });
                            }} className="text-rpg-grey hover:text-rpg-gold text-2xl">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome / Profissão"
                                value={newNpc.name}
                                onChange={(e) => setNewNpc({ ...newNpc, name: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Papel</label>
                                    <select
                                        value={newNpc.role}
                                        onChange={(e) => setNewNpc({ ...newNpc, role: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment max-h-48 overflow-y-auto appearance-none"
                                    >
                                        <option value="civilian">Civil</option>
                                        <option value="soldier">Soldado</option>
                                        <option value="specialist">Especialista</option>
                                        <option value="villain">Vilão</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase mb-1 block">Raça</label>
                                    <input
                                        type="text"
                                        value={newNpc.race}
                                        onChange={(e) => setNewNpc({ ...newNpc, race: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">CA</label>
                                    <input
                                        type="number"
                                        value={newNpc.ac}
                                        onChange={(e) => setNewNpc({ ...newNpc, ac: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">HP</label>
                                    <input
                                        type="number"
                                        value={newNpc.hp}
                                        onChange={(e) => setNewNpc({ ...newNpc, hp: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-rpg-grey uppercase">CR</label>
                                    <input
                                        type="text"
                                        value={newNpc.challenge}
                                        onChange={(e) => setNewNpc({ ...newNpc, challenge: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment"
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Descrição..."
                                value={newNpc.description}
                                onChange={(e) => setNewNpc({ ...newNpc, description: e.target.value })}
                                className="w-full bg-rpg-slate border border-rpg-gold/20 rounded px-3 py-2 text-rpg-parchment min-h-[120px]"
                            />
                            <div className="flex gap-2">
                                <button onClick={saveCustomNpc} className="bg-rpg-gold text-rpg-dark px-6 py-2 rounded font-bold hover:scale-105 transition-all">
                                    {customNpcs.some(n => n.name === newNpc.name) ? 'Salvar Alterações' : 'Criar NPC'}
                                </button>
                                <button onClick={() => setIsAddModalOpen(false)} className="bg-rpg-slate text-rpg-parchment px-6 py-2 rounded hover:bg-rpg-slate/80">Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {allNpcs.length === 0 ? (
                        <p className="text-rpg-grey text-center py-8">Nenhum NPC encontrado.</p>
                    ) : (
                        allNpcs.map((npc, idx) => (
                            <div
                                key={`${npc.name}-${idx}`}
                                onClick={() => setSelectedNpc(npc)}
                                className={`bg-rpg-slate border rounded p-4 cursor-pointer transition-all hover:border-rpg-gold/50 ${selectedNpc?.name === npc.name ? 'border-rpg-gold ring-1 ring-rpg-gold/30' : 'border-rpg-gold/10'}`}
                            >
                                <h3 className="font-bold text-rpg-gold flex items-center gap-2">
                                    👤 {npc.name}
                                </h3>
                                <p className="text-sm text-rpg-grey">
                                    {npc.race} • {npc.role === 'civilian' ? 'Civil' : npc.role === 'soldier' ? 'Soldado' : npc.role === 'villain' ? 'Vilão' : 'Especialista'} • CR {npc.challenge}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className={`${selectedNpc ? 'fixed inset-0 z-[60] bg-black/90 p-4 overflow-y-auto' : 'hidden'} md:block md:static md:bg-transparent md:p-0 md:overflow-visible`}>
                    <div className="bg-rpg-slate border border-rpg-gold/20 rounded p-6 md:sticky md:top-4 relative shadow-2xl md:shadow-none min-h-[50vh]">
                        {selectedNpc && (
                            <button
                                onClick={() => setSelectedNpc(null)}
                                className="md:hidden absolute top-4 right-4 text-rpg-gold bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors z-10"
                            >
                                ✕
                            </button>
                        )}
                        {selectedNpc ? (
                            <div>
                                <h3 className="text-2xl font-bold text-rpg-gold mb-2">{selectedNpc.name}</h3>
                                <p className="text-sm text-rpg-grey mb-4">{selectedNpc.race} - {selectedNpc.role}</p>
                                <div className="space-y-3 text-sm">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-black/20 p-2 rounded">
                                            <span className="block text-xs text-rpg-grey">CA</span>
                                            <span className="font-bold text-rpg-gold">{selectedNpc.ac}</span>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded">
                                            <span className="block text-xs text-rpg-grey">HP</span>
                                            <span className="font-bold text-rpg-gold">{selectedNpc.hp}</span>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded">
                                            <span className="block text-xs text-rpg-grey">CR</span>
                                            <span className="font-bold text-rpg-gold">{selectedNpc.challenge}</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-rpg-gold/20">
                                        <p className="text-rpg-parchment leading-relaxed">{selectedNpc.description}</p>
                                    </div>
                                    {customNpcs.some(n => n.name === selectedNpc.name) && (
                                        <div className="pt-4 flex gap-2">
                                            <button
                                                onClick={() => openEditModal(selectedNpc)}
                                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => deleteCustomNpc(selectedNpc.name)}
                                                className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-3 py-1.5 rounded text-xs font-bold transition-all"
                                            >
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-rpg-grey py-12">
                                <p className="text-4xl mb-4">👤</p>
                                <p>Selecione um NPC para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BibliotecaPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('grimorio');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
    const [activeCharacterName, setActiveCharacterName] = useState<string | null>(null);

    useEffect(() => {
        setActiveCharacterId(localStorage.getItem('activeCharacterId'));
        setActiveCharacterName(localStorage.getItem('activeCharacterName'));
    }, []);

    const addToCharacter = async (item: any, type: 'item' | 'spell') => {
        if (!activeCharacterId) return;

        try {
            const charRef = doc(db, 'personagens', activeCharacterId);
            const charSnap = await getDoc(charRef);

            if (!charSnap.exists()) {
                alert("Personagem não encontrado!");
                return;
            }

            const charData = charSnap.data();

            if (type === 'item') {
                const inventory = charData.inventory || { weapons: [], otherEquipment: [], currency: { gp: 0, sp: 0, cp: 0, ep: 0, pp: 0 } };

                if (item.itemType === 'WEAPON') {
                    inventory.weapons = [...(inventory.weapons || []), { ...item, id: `item-${Date.now()}`, quantity: 1 }];
                } else {
                    inventory.otherEquipment = [...(inventory.otherEquipment || []), { ...item, id: `item-${Date.now()}`, quantity: 1, type: item.itemType?.toLowerCase() || 'other' }];
                }

                await updateDoc(charRef, { inventory });
                alert(`✅ ${item.name} adicionado ao inventário de ${activeCharacterName}!`);
            } else if (type === 'spell') {
                const spells = charData.spells || [];
                if (spells.some((s: any) => s.name === item.name)) {
                    alert("Este personagem já conhece esta magia!");
                    return;
                }

                await updateDoc(charRef, { spells: [...spells, item] });
                alert(`✨ ${item.name} adicionado ao grimório de ${activeCharacterName}!`);
            }
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
            alert("Erro ao sincronizar com a ficha. Tente abrir a ficha primeiro.");
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center font-cinzel text-rpg-gold">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">🔒 Acesso Restrito</h1>
                    <p className="text-rpg-parchment mb-8">Apenas membros da Guilda podem acessar a Grande Biblioteca.</p>
                    <Link href="/login" className="bg-rpg-gold text-rpg-dark px-8 py-3 rounded font-bold hover:scale-105 transition-all">
                        Entrar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] font-lato">
            {/* HEADER */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-30 backdrop-blur-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl flex items-center gap-2 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            <span>⚔️</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold font-cinzel text-rpg-gold text-shadow-md">📚 A Grande Biblioteca</h1>
                            <p className="text-[10px] text-rpg-grey uppercase tracking-widest leading-none">Compêndio de Conhecimento Arcano</p>
                        </div>
                    </div>
                    <div className="text-sm text-rpg-grey">
                        Bem-vindo, <span className="text-rpg-gold font-bold">{user.displayName || 'Estudioso'}</span>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <section className="container mx-auto p-4 sm:p-8">
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[
                        { id: 'grimorio' as TabType, label: '📖 Grimório', icon: '✨' },
                        { id: 'bestiario' as TabType, label: '🐉 Bestiário', icon: '⚔️' },
                        { id: 'itens' as TabType, label: '⚗️ Itens', icon: '💎' },
                        { id: 'npcs' as TabType, label: '👥 NPCs', icon: '👤' },
                        { id: 'regras' as TabType, label: '📕 Regras', icon: '⚖️' },
                        { id: 'notas' as TabType, label: '📜 Anotações', icon: '🖋️' },
                        { id: 'arquivista' as TabType, label: '🏛️ Arquivista', icon: '📜' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded font-cinzel font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold/30'
                                : 'bg-rpg-panel text-rpg-grey hover:bg-rpg-slate border border-rpg-gold/10'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* SEARCH BAR */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder={`Buscar em ${activeTab === 'grimorio' ? 'Magias' : activeTab === 'bestiario' ? 'Criaturas' : activeTab === 'itens' ? 'Itens' : activeTab === 'npcs' ? 'NPCs' : 'Anotações'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-rpg-panel border border-rpg-gold/20 rounded px-4 py-3 text-rpg-parchment placeholder-rpg-grey focus:border-rpg-gold focus:outline-none transition-all"
                    />
                </div>

                {/* CONTENT */}
                <div className="bg-rpg-panel border border-rpg-gold/20 rounded-lg p-6 min-h-[500px]">
                    {activeCharacterId && (
                        <div className="mb-4 p-3 bg-rpg-gold/10 border border-rpg-gold/30 rounded flex justify-between items-center animate-pulse-slow">
                            <span className="text-sm">Vinculado a: <strong className="text-rpg-gold">{activeCharacterName}</strong></span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('activeCharacterId');
                                    localStorage.removeItem('activeCharacterName');
                                    setActiveCharacterId(null);
                                    setActiveCharacterName(null);
                                }}
                                className="text-[10px] text-rpg-grey hover:text-red-400"
                            > Desvincular</button>
                        </div>
                    )}

                    {activeTab === 'grimorio' && <GrimorioTab searchQuery={searchQuery} onAddSpell={activeCharacterId ? (spell) => addToCharacter(spell, 'spell') : undefined} />}

                    {activeTab === 'bestiario' && <BestiarioTab searchQuery={searchQuery} />}

                    {activeTab === 'itens' && <ItensTab searchQuery={searchQuery} onAddItem={activeCharacterId ? (item) => addToCharacter(item, 'item') : undefined} />}

                    {activeTab === 'npcs' && <NpcTab searchQuery={searchQuery} />}

                    {activeTab === 'regras' && <RegrasTab searchQuery={searchQuery} />}

                    {activeTab === 'notas' && <NotasTab />}

                    {activeTab === 'arquivista' && <ArquivistaTab />}
                </div>
            </section>
        </div>
    );
}
