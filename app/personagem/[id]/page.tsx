
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    ATTRIBUTE_DISPLAY_NAMES,
    SKILLS,
    createBlankCharacter,
    hydrateCharacter,
    calculateComputedStats,
    Character,
    ATTRIBUTE_KEYS
} from '@/lib/character-data';
import { Weapon, OtherEquipmentItem, dndWeapons, dndEquipments, parseDamageString } from '@/lib/items-data';
import { dndClasses, dndRaces } from '@/lib/dnd-data';
import SelectionModal from '@/components/ui/SelectionModal';
import WeaponModal from '@/components/ui/WeaponModal';
import EquipmentModal from '@/components/ui/EquipmentModal';
import SpellModal from '@/components/ui/SpellModal';
import SpellSelectModal from '@/components/ui/SpellSelectModal';
import LevelUpModal from '@/components/ui/LevelUpModal';
import { CLASS_PROGRESSION } from '@/lib/class-features';

// --- Componentes Auxiliares ---
const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-rpg-panel border border-rpg-gold/20 shadow-md h-full backdrop-blur-sm">
        <span className="text-sm font-semibold text-rpg-gold text-center font-medieval tracking-wide">{label}</span>
        <span className="text-3xl font-bold text-rpg-parchment font-cinzel mt-1">{value}</span>
    </div>
);

const AttributeInput = ({ label, value, onChange }: { label: string; value: number; onChange: (newValue: number) => void }) => (
    <div className="w-full p-3 text-center transition-all duration-300 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-lg hover:border-rpg-gold/50 backdrop-blur-sm group">
        <label className="block text-xs font-bold tracking-wider text-rpg-gold uppercase font-cinzel group-hover:text-rpg-gold-light">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} onFocus={(e) => e.target.select()} className="w-20 p-1 text-3xl font-bold text-center text-rpg-parchment bg-transparent border-b-2 border-rpg-gold/20 focus:outline-none focus:border-rpg-gold font-medieval" />
        <div className="mt-1 text-xl font-bold text-rpg-parchment font-medieval bg-rpg-dark/50 rounded px-2 w-10 mx-auto border border-white/5">{Math.floor((value - 10) / 2)}</div>
    </div>
);

interface SkillCheckboxProps {
    skillKey: string;
    displayName: string;
    attribute: string;
    isProficient: boolean;
    proficiencyBonus: number;
    attributeMod: number;
    onChange: (key: string, checked: boolean) => void;
}

const SkillCheckbox = ({ skillKey, displayName, attribute, isProficient, proficiencyBonus, attributeMod, onChange }: SkillCheckboxProps) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-rpg-dark/40 transition-colors border-b border-rpg-gold/5">
        <label htmlFor={skillKey} className="flex items-center cursor-pointer">
            <input id={skillKey} type="checkbox" checked={isProficient} onChange={(e) => onChange(skillKey, e.target.checked)} className="w-4 h-4 rounded-sm text-rpg-gold focus:ring-rpg-gold bg-rpg-dark border-rpg-gold/30" />
            <span className={`ml-3 text-sm ${isProficient ? 'text-rpg-gold font-bold' : 'text-rpg-grey'}`}>{displayName} <span className="text-xs text-rpg-grey/50">({attribute.slice(0, 3).toUpperCase()})</span></span>
        </label>
        <span className="font-medieval text-lg font-bold text-rpg-parchment">{isProficient ? attributeMod + proficiencyBonus : attributeMod}</span>
    </div>
);

interface TabButtonProps {
    activeTab: string;
    tabName: string;
    onClick: (base: string) => void;
}

const TabButton = ({ activeTab, tabName, onClick }: TabButtonProps) => (
    <button onClick={() => onClick(tabName)} className={`flex-grow px-4 py-3 text-sm font-bold rounded-t-lg transition-all duration-200 font-cinzel tracking-wider border-t border-x ${activeTab === tabName ? 'bg-rpg-panel text-rpg-gold border-rpg-gold/30 shadow-[0_-5px_15px_-5px_rgba(218,165,32,0.1)]' : 'bg-rpg-slate text-rpg-grey border-transparent hover:text-rpg-parchment hover:bg-rpg-dark'}`}>
        {tabName}
    </button>
);

// --- DEBOUNCE --- 
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout !== null) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

// --- Componente Principal --- 
export default function CharacterSheetPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('Principal');

    // Modais e Estados de Dados
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'class' | 'race' | 'weapon', title: string } | null>(null);
    const [classes, setClasses] = useState<string[]>([]);
    const [races, setRaces] = useState<string[]>([]);
    const [weapons, setWeapons] = useState<any[]>([]);
    const [isDbDataLoading, setIsDbDataLoading] = useState(true);

    const [isWeaponModalOpen, setWeaponModalOpen] = useState(false);
    const [weaponToEdit, setWeaponToEdit] = useState<Weapon | null>(null);
    const [isEquipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<OtherEquipmentItem | null>(null);
    const [allEquipment, setAllEquipment] = useState<{ name: string }[]>([]);

    const [isSpellSelectOpen, setSpellSelectOpen] = useState(false);
    const [isSpellModalOpen, setSpellModalOpen] = useState(false);
    const [spellToEdit, setSpellToEdit] = useState(null);

    const [weaponSearchTerm, setWeaponSearchTerm] = useState('');
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');

    const [isLevelUpModalOpen, setLevelUpModalOpen] = useState(false);
    const lastLevelRef = useRef<number | null>(null);

    const dataFetchInitiated = useRef(false);
    const characterLoaded = useRef(false);
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const debouncedSave = useMemo(() => debounce(async (charToSave: Character) => {
        if (!user || !charToSave.id || charToSave.id === 'novo') return;
        try {
            const docRef = doc(db, 'personagens', charToSave.id);
            await setDoc(docRef, JSON.parse(JSON.stringify(charToSave)), { merge: true });
        } catch (err) {
            console.error("Erro ao salvar personagem:", err);
        }
    }, 1500), [user]);

    const updateCharacter = (updater: (char: Character) => Character) => {
        setCharacter(prevChar => {
            if (!prevChar) return null;
            const updatedChar = updater(prevChar);
            const finalChar = calculateComputedStats(updatedChar);
            debouncedSave(finalChar);
            return finalChar;
        });
    };

    // --- Carregamento de Dados ---
    useEffect(() => {
        if (dataFetchInitiated.current) return;
        dataFetchInitiated.current = true;

        const fetchGameData = async () => {
            setIsDbDataLoading(true);
            try {
                const populateCollection = async (collectionName: string, defaultData: any[], sortField = 'name') => {
                    const collectionRef = collection(db, collectionName);
                    let snapshot = await getDocs(collectionRef);
                    if (snapshot.empty && defaultData.length > 0) {
                        const batch = writeBatch(db);
                        const uniqueData = Array.from(new Map(defaultData.map(item => [item.name, item])).values());
                        uniqueData.forEach(item => batch.set(doc(collectionRef), item));
                        await batch.commit();
                        snapshot = await getDocs(collectionRef);
                    }
                    return snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id })).sort((a, b) => a[sortField]?.localeCompare(b[sortField]));
                };

                const [classData, raceData, weaponData, equipmentData] = await Promise.all([
                    populateCollection('classes', dndClasses.map(name => ({ name }))),
                    populateCollection('races', dndRaces.map(name => ({ name }))),
                    populateCollection('armas', dndWeapons),
                    populateCollection('equipamentos', dndEquipments)
                ]);

                setClasses(classData.map(c => c.name));
                setRaces(raceData.map(r => r.name));
                setWeapons(weaponData);
                setAllEquipment(equipmentData);
            } catch (err) {
                console.error("Falha ao carregar dados do jogo:", err);
                setError("Falha ao carregar dados essenciais do jogo.");
            } finally {
                setIsDbDataLoading(false);
            }
        };
        fetchGameData();
    }, []);

    useEffect(() => {
        if (loadingAuth || !user || characterLoaded.current) return;
        if (id === 'novo' && character) return;

        const loadChar = async () => {
            setIsLoading(true);
            try {
                if (id === 'novo') {
                    setCharacter(createBlankCharacter(user.uid));
                    characterLoaded.current = true;
                } else {
                    const docRef = doc(db, 'personagens', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
                        setCharacter(hydrateCharacter(docSnap.data() as Partial<Character>, docSnap.id));
                        characterLoaded.current = true;
                    } else {
                        setError("Ficha não encontrada ou acesso negado.");
                        router.push('/personagens');
                    }
                }
            } catch (e) { setError("Falha ao carregar a ficha."); console.error(e); }
            finally { setIsLoading(false); }
        }
        loadChar();
    }, [id, user, loadingAuth, router, character]);

    // Monitoramento de Level Up
    useEffect(() => {
        if (!character || isLoading) return;

        if (lastLevelRef.current !== null && character.level > lastLevelRef.current) {
            setLevelUpModalOpen(true);
        }
        lastLevelRef.current = character.level;
    }, [character, isLoading]);

    const handleApplyLevelUp = (choices: { attributes: Record<string, number>; hpIncrease: number }) => {
        if (!character) return;

        updateCharacter(prev => {
            const newAttributes = { ...prev.attributes };
            // Mapear nomes do modal para os nomes reais do objeto de atributos se necessário
            // No modal usei nomes em inglês minúsculos, que devem bater com o objeto
            Object.entries(choices.attributes).forEach(([attr, bonus]) => {
                if (bonus > 0) {
                    newAttributes[attr as keyof typeof newAttributes] = (newAttributes[attr as keyof typeof newAttributes] || 10) + bonus;
                }
            });

            return {
                ...prev,
                attributes: newAttributes,
                maxHp: (prev.maxHp || 0) + choices.hpIncrease,
                currentHp: (prev.currentHp || 0) + choices.hpIncrease // Também cura o HP ganho
            };
        });
    };

    // --- Lógica de Campos ---
    const handleFieldChange = (field: keyof Omit<Character, 'attributes' | 'skills' | 'inventory'>, value: any) => {
        updateCharacter(char => ({ ...char, [field]: value }));
    };
    const handleNestedChange = (path: string, value: any) => {
        updateCharacter(char => {
            const newChar = JSON.parse(JSON.stringify(char));
            let current: any = newChar;
            const keys = path.split('.');
            for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]] = current[keys[i]] || {}; }
            current[keys[keys.length - 1]] = value;
            return newChar;
        });
    };

    // --- Lógica de Itens ---
    const handleOpenWeaponModal = (weapon: Weapon | null) => { setWeaponToEdit(weapon); setWeaponModalOpen(true); };
    const handleSaveWeapon = (weapon: Weapon) => {
        updateCharacter(char => {
            const newWeapons = [...char.inventory.weapons];
            const index = newWeapons.findIndex(w => w.id === weapon.id);
            if (index > -1) newWeapons[index] = weapon; else newWeapons.push(weapon);
            return { ...char, inventory: { ...char.inventory, weapons: newWeapons } };
        });
        setWeaponModalOpen(false);
    };
    const handleRemoveWeapon = (weaponId: string) => {
        updateCharacter(char => ({
            ...char, inventory: { ...char.inventory, weapons: char.inventory.weapons.filter(w => w.id !== weaponId) }
        }));
    };

    const handleOpenEquipmentModal = (item: OtherEquipmentItem | null) => { setEquipmentToEdit(item); setEquipmentModalOpen(true); };
    const handleSaveEquipment = (item: OtherEquipmentItem) => {
        updateCharacter(char => {
            const newEquipment = [...char.inventory.otherEquipment];
            const index = newEquipment.findIndex(e => e.id === item.id);
            if (index > -1) newEquipment[index] = item;
            else {
                const existing = newEquipment.find(e => e.name.toLowerCase() === item.name.toLowerCase());
                if (existing) existing.quantity += item.quantity; else newEquipment.push(item);
            }
            return { ...char, inventory: { ...char.inventory, otherEquipment: newEquipment } };
        });
        setEquipmentModalOpen(false);
    };
    const handleRemoveEquipment = (itemId: string) => {
        updateCharacter(char => ({
            ...char, inventory: { ...char.inventory, otherEquipment: char.inventory.otherEquipment.filter(e => e.id !== itemId) }
        }));
    };

    const handleAddNewGlobalItem = async (itemName: string) => {
        try {
            await setDoc(doc(collection(db, 'equipamentos')), { name: itemName });
            setAllEquipment(prev => [...prev, { name: itemName }].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) { console.error("Erro ao adicionar item global:", err); }
    };

    const openSelectionModal = (type: 'class' | 'race' | 'weapon') => {
        setModalConfig({ type, title: type === 'class' ? 'Selecione a Classe' : type === 'race' ? 'Selecione a Raça' : 'Selecione uma Arma' });
        setSelectionModalOpen(true);
    };

    const handleSelectItem = (item: any) => {
        if (!modalConfig) return;
        setSelectionModalOpen(false);
        if (modalConfig.type === 'class' || modalConfig.type === 'race') {
            handleFieldChange(modalConfig.type, item);
        } else if (modalConfig.type === 'weapon') {
            const base = weapons.find(w => w.name === item);
            if (base) {
                const parsed = parseDamageString(base.damage);
                handleOpenWeaponModal({
                    ...base,
                    id: new Date().toISOString(),
                    quantity: 1,
                    isMagical: false,
                    magicalBonus: 0,
                    magicalEffect: '',
                    ...parsed,
                    isProficient: true
                });
            }
        }
    };

    // --- Magias ---
    const handleSaveSpell = (spell: any) => {
        updateCharacter(char => {
            const filtered = (char.spells || []).filter(s => s.name.trim().toLowerCase() !== spell.name.trim().toLowerCase());
            return { ...char, spells: [...filtered, spell] };
        });
        setSpellModalOpen(false);
        setSpellToEdit(null);
        setSpellSelectOpen(false);
    };

    const handleRemoveSpell = (spellName: string) => {
        updateCharacter(char => ({
            ...char, spells: (char.spells || []).filter(s => s.name.trim().toLowerCase() !== spellName.trim().toLowerCase())
        }));
    };

    if (isLoading || loadingAuth || !character) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="text-2xl text-white">Carregando...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="p-4 text-center text-2xl text-red-500 bg-slate-800 rounded-lg">{error}</div></div>;

    const filteredWeapons = character.inventory.weapons.filter(w => w.name.toLowerCase().includes(weaponSearchTerm.toLowerCase()));
    const filteredEquipment = character.inventory.otherEquipment.filter(e => e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase()));

    return (
        <div className="min-h-screen p-4 text-rpg-parchment md:p-8 bg-dnd-gradient font-sans selection:bg-rpg-gold/30 selection:text-rpg-gold">
            <div className="max-w-7xl mx-auto">
                {/* Header e Navigation */}
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/personagens" className="px-4 py-2 text-sm font-bold rounded-md bg-rpg-panel border border-rpg-gold/20 text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold shadow-lg hover:shadow-glow-gold transition-all">&larr; Voltar ao Salão</Link>
                    {id === 'novo' && (<button onClick={() => { }} className="px-6 py-2 font-bold rounded-md bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark hover:from-yellow-400 hover:to-rpg-gold shadow-lg transform hover:scale-105 transition-all">Salvar Novo Personagem</button>)}
                </div>

                <header className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6 p-6 bg-rpg-panel/50 rounded-xl border border-rpg-gold/10 shadow-2xl backdrop-blur-md">
                    <div className="flex-grow">
                        <input type="text" value={character.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full text-5xl font-extrabold bg-transparent border-b-2 border-rpg-gold/30 font-cinzel text-rpg-gold focus:outline-none focus:border-rpg-gold transition-all placeholder-rpg-grey/30" placeholder="Nome do Personagem" />
                    </div>
                    <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:w-40"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-center sm:text-left">Classe</label><button onClick={() => openSelectionModal('class')} className="w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-left hover:border-rpg-gold/50 font-medieval text-sm">{character.class || 'Selecione...'}</button></div>
                        <div className="w-20"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-center">Nível</label><input type="number" value={character.level || ''} onChange={e => handleFieldChange('level', e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-rpg-slate border border-rpg-gold/20 rounded-md px-2 py-2 text-center font-bold w-full font-medieval text-sm" /></div>
                        <div className="w-32"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-center">Experiência</label><input type="number" value={character.experience === 0 ? '0' : (character.experience || '')} onChange={(e) => handleFieldChange('experience', e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-rpg-dark/50 border border-rpg-gold/20 rounded-md px-2 py-2 text-center font-bold w-full font-medieval text-sm text-rpg-gold" /></div>
                        <div className="w-full sm:w-40"><label className="block text-[10px] font-bold text-rpg-gold uppercase tracking-wider mb-1 font-cinzel text-center sm:text-left">Raça</label><button onClick={() => openSelectionModal('race')} className="w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-left hover:border-rpg-gold/50 font-medieval text-sm">{character.race || 'Selecione...'}</button></div>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <div className="mb-6 border-b border-rpg-gold/20">
                    <div className="flex flex-wrap gap-1">
                        {['Principal', 'Equipamento', 'Habilidades', 'Magias', 'Personalidade'].map(tab => (
                            <TabButton key={tab} activeTab={activeTab} tabName={tab} onClick={setActiveTab} />
                        ))}
                    </div>
                </div>

                <main>
                    {/* ABA PRINCIPAL */}
                    {activeTab === 'Principal' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex gap-2 overflow-x-auto pb-4">
                                {ATTRIBUTE_KEYS.map((key) => (
                                    <AttributeInput key={key} label={ATTRIBUTE_DISPLAY_NAMES[key].slice(0, 3)} value={character.attributes[key]} onChange={(val) => handleNestedChange(`attributes.${key}`, val)} />
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-all">
                                    <h4 className="text-xs font-bold text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">Pontos de Vida</h4>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <input type="number" value={character.currentHp === 0 ? '0' : (character.currentHp || '')} onChange={(e) => handleFieldChange('currentHp', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-16 text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-rpg-parchment font-medieval" />
                                        <span className="text-xl text-rpg-grey/50">/</span>
                                        <input type="number" value={character.maxHp === 0 ? '0' : (character.maxHp || '')} onChange={(e) => handleFieldChange('maxHp', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-16 text-xl font-bold text-center bg-transparent text-rpg-grey font-medieval" />
                                    </div>
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.max(0, c.currentHp - 1) }))} className="px-2 py-1 bg-rpg-red/20 text-red-200 border border-rpg-red/30 rounded text-xs font-bold hover:bg-rpg-red/40 transition-colors">-1</button>
                                        <button onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.min(c.maxHp, c.currentHp + 1) }))} className="px-2 py-1 bg-green-900/30 text-green-200 border border-green-700/30 rounded text-xs font-bold hover:bg-green-700/40 transition-colors">+1</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-all">
                                    <h4 className="text-xs font-bold text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">PV Temporários</h4>
                                    <input type="number" value={character.temporaryHp === 0 ? '0' : (character.temporaryHp || '')} onChange={(e) => handleFieldChange('temporaryHp', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-blue-200 font-medieval" />
                                </div>
                                <StatBlock label="Classe de Armadura" value={character.armorClass} />
                                <StatBlock label="Iniciativa" value={character.initiative >= 0 ? `+${character.initiative}` : character.initiative} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-colors">
                                    <h4 className="text-sm font-semibold text-rpg-gold text-center font-medieval tracking-wide">Deslocamento</h4>
                                    <div className="flex items-center justify-center gap-1">
                                        <input type="number" value={character.speed === 0 ? '0' : (character.speed || '')} onChange={(e) => handleFieldChange('speed', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-16 text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-rpg-parchment font-medieval" />
                                        <span className="text-rpg-grey font-medieval">m</span>
                                    </div>
                                </div>
                                <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg text-center flex flex-col justify-center shadow-lg backdrop-blur-sm">
                                    <span className="text-sm text-rpg-gold font-bold uppercase mb-2 tracking-widest">Bônus de Proficiência</span>
                                    <span className="text-5xl font-bold text-rpg-parchment font-medieval">+{character.proficiencyBonus}</span>
                                </div>
                            </div>

                            <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md">
                                <h4 className="font-bold text-rpg-gold mb-3 font-cinzel tracking-wide text-lg border-b border-rpg-gold/10 pb-2 text-center sm:text-left">Resistências à Morte</h4>
                                <div className="flex justify-between items-center mb-2"><span className="text-sm text-rpg-grey font-bold uppercase tracking-widest">Sucessos</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" checked={character.deathSaves?.successes >= i} onChange={(e) => handleNestedChange('deathSaves.successes', e.target.checked ? i : i - 1)} className="w-5 h-5 rounded-full accent-green-600 cursor-pointer" />)}</div></div>
                                <div className="flex justify-between items-center"><span className="text-sm text-rpg-grey font-bold uppercase tracking-widest">Falhas</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" checked={character.deathSaves?.failures >= i} onChange={(e) => handleNestedChange('deathSaves.failures', e.target.checked ? i : i - 1)} className="w-5 h-5 rounded-full accent-rpg-red cursor-pointer" />)}</div></div>
                            </div>
                        </div>
                    )}

                    {/* ABA EQUIPAMENTO */}
                    {activeTab === 'Equipamento' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Moedas</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-md">
                                    {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                                        <div key={key}>
                                            <label className="block text-[10px] font-bold text-rpg-gold uppercase text-center mb-1 font-cinzel">{key}</label>
                                            <input type="number" value={character.inventory.currency[key]} onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value) || 0)} className="w-full p-2 text-xl font-bold text-center bg-rpg-slate rounded-md border border-rpg-gold/10 font-medieval focus:border-rpg-gold/50 outline-none" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Armas</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => openSelectionModal('weapon')} className="px-3 py-1 text-xs font-bold bg-rpg-slate border border-rpg-gold/20 rounded hover:bg-rpg-dark transition-all uppercase tracking-tighter">Biblioteca</button>
                                        <button onClick={() => handleOpenWeaponModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Nova Arma</button>
                                    </div>
                                </div>
                                <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-4 space-y-3 shadow-inner">
                                    {filteredWeapons.length > 0 ? filteredWeapons.map((weapon) => {
                                        const abilityMod = (weapon.properties?.includes('Acuidade') && character.attributeModifiers.dexterity > character.attributeModifiers.strength) || weapon.properties?.includes('Munição') ? character.attributeModifiers.dexterity : character.attributeModifiers.strength;
                                        const atkBonus = (weapon.isProficient !== false ? character.proficiencyBonus : 0) + abilityMod + (weapon.magicalBonus || 0);
                                        const dmgBonus = abilityMod + (weapon.magicalBonus || 0);

                                        return (
                                            <div key={weapon.id} className={`p-4 bg-rpg-slate/80 border ${weapon.isMagical ? 'border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]' : 'border-rpg-gold/10'} rounded-lg flex flex-col md:flex-row justify-between gap-4 hover:border-rpg-gold/30 transition-all group shadow-md relative overflow-hidden`}>
                                                {weapon.isMagical && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent -rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />}
                                                <div className="flex-grow">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h4 className={`font-bold text-lg font-medieval ${weapon.isMagical ? 'text-purple-200' : 'text-rpg-parchment'}`}>{weapon.name}</h4>
                                                        {weapon.isMagical && <span className="bg-purple-600 text-[8px] text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-lg">Mágico ✨</span>}
                                                        <span className="bg-rpg-gold text-rpg-dark px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">ATK: {atkBonus >= 0 ? `+${atkBonus}` : atkBonus}</span>
                                                        <span className="bg-rpg-red text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-black/30 shadow-sm">DANO: {weapon.damage}{dmgBonus !== 0 ? ` + ${dmgBonus}` : ''}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-rpg-grey uppercase tracking-wider bg-black/20 px-2 py-1 rounded inline-block">{weapon.damageType} | {weapon.properties?.join(', ')}</p>
                                                    {weapon.magicalEffect && <p className="text-[10px] text-purple-300 italic mt-1 font-sans">{weapon.magicalEffect}</p>}
                                                </div>
                                                <div className="flex gap-2 items-center self-end md:self-center">
                                                    <button onClick={() => handleOpenWeaponModal(weapon)} className="px-3 py-1 text-xs font-medium bg-rpg-slate/50 border border-rpg-grey/30 hover:border-rpg-gold text-rpg-grey hover:text-rpg-parchment rounded-md transition-colors uppercase">Editar</button>
                                                    <button onClick={() => handleRemoveWeapon(weapon.id)} className="px-3 py-1 text-xs font-medium bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded-md transition-colors">×</button>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-center text-rpg-grey py-8 italic">O cinto de utilidades está vazio.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel flex items-center gap-2"><span className="w-2 h-2 bg-rpg-gold rounded-full"></span> Mochila & Itens</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenEquipmentModal(null)} className="px-3 py-1 text-xs font-bold bg-rpg-gold text-rpg-dark rounded hover:brightness-110 transition-all uppercase tracking-tighter shadow-glow-gold/20">+ Novo Item</button>
                                    </div>
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
                                            </div>
                                            <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEquipmentModal(item)} className="p-1 text-rpg-grey hover:text-rpg-gold transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleRemoveEquipment(item.id)} className="p-1 text-rpg-red/50 hover:text-rpg-red transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="col-span-full text-center text-rpg-grey py-8 italic bg-rpg-slate/20 rounded-lg border border-dashed border-rpg-gold/10">A mochila parece leve... nenhum item registrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA HABILIDADES */}
                    {activeTab === 'Habilidades' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-5 rounded-lg shadow-md backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-rpg-gold mb-4 border-b border-rpg-gold/20 pb-2 font-cinzel uppercase tracking-widest">Perícias</h3>
                                <div className="space-y-1 h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {SKILLS.map((skill) => (
                                        <SkillCheckbox
                                            key={skill.key}
                                            skillKey={skill.key}
                                            displayName={skill.displayName}
                                            attribute={skill.attribute}
                                            isProficient={character.skills[skill.key]}
                                            proficiencyBonus={character.proficiencyBonus}
                                            attributeMod={character.attributeModifiers[skill.attribute]}
                                            onChange={(k: any, v: any) => handleNestedChange(`skills.${k}`, v)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-5 rounded-lg shadow-md backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-rpg-gold mb-4 border-b border-rpg-gold/20 pb-2 font-cinzel uppercase tracking-widest">Características e Talentos</h3>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                    {character.features && character.features.length > 0 ? (
                                        character.features.map((feature, idx) => (
                                            <div key={idx} className="bg-rpg-slate/60 p-3 rounded-md border-l-2 border-rpg-gold/30 hover:bg-rpg-slate/80 transition-colors">
                                                <h4 className="font-bold text-rpg-parchment mb-1 font-medieval text-lg">{feature.name}</h4>
                                                <p className="text-sm text-rpg-grey leading-relaxed">{feature.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-rpg-grey italic p-4 text-center">Nenhuma característica registrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA MAGIAS */}
                    {activeTab === 'Magias' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatBlock label="Atributo de Conjuração" value={character.spellcasting?.ability ? ATTRIBUTE_DISPLAY_NAMES[character.spellcasting.ability].slice(0, 3).toUpperCase() : '-'} />
                                <StatBlock label="CD de Resistência" value={character.spellcasting?.saveDc || 0} />
                                <StatBlock label="Bônus de Ataque" value={`+${character.spellcasting?.attackBonus || 0}`} />
                            </div>
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setSpellSelectOpen(true)} className="px-4 py-2 rounded bg-rpg-gold text-rpg-dark font-bold hover:bg-yellow-400 transition-all shadow-glow-gold/10 uppercase text-xs tracking-wider">+ Selecionar Magia</button>
                            </div>
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-6 rounded-lg shadow-md min-h-[400px]">
                                <h3 className="text-xl font-bold text-rpg-gold mb-5 font-cinzel border-b border-rpg-gold/10 pb-2 uppercase tracking-widest">Grimório</h3>
                                {character.spells && character.spells.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {character.spells.map((spell, idx) => (
                                            <div key={idx} className="bg-rpg-slate/60 p-4 rounded-md border-l-4 border-purple-900 hover:border-rpg-gold hover:bg-rpg-slate/80 transition-all group shadow-sm">
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <span className="font-bold text-rpg-parchment font-medieval text-xl group-hover:text-rpg-gold transition-colors">{spell.name}</span>
                                                    <span className="text-[10px] text-purple-300 uppercase tracking-widest font-black bg-purple-900/40 px-2 py-0.5 rounded">Nível {spell.level}</span>
                                                </div>
                                                <p className="text-sm text-rpg-grey/90 leading-relaxed font-sans">{spell.description}</p>
                                                <div className="flex gap-2 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleRemoveSpell(spell.name)} className="px-3 py-1 text-[10px] font-black bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded uppercase tracking-tighter">Esquecer Magia</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-rpg-grey/40">
                                        <p className="text-6xl mb-4">📜</p>
                                        <p className="italic font-medieval text-xl">Sua mente está limpa de encantamentos.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ABA PERSONALIDADE */}
                    {activeTab === 'Personalidade' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Traços de Personalidade</label>
                                    <textarea value={character.personalityTraits} onChange={e => handleFieldChange('personalityTraits', e.target.value)} className="w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner" placeholder="Peculiaridades e maneirismos..." />
                                </div>
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Ideais</label>
                                    <textarea value={character.ideals} onChange={e => handleFieldChange('ideals', e.target.value)} className="w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner" placeholder="No que você acredita?" />
                                </div>
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Vínculos</label>
                                    <textarea value={character.bonds} onChange={e => handleFieldChange('bonds', e.target.value)} className="w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner" placeholder="O que te move?" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Defeitos</label>
                                    <textarea value={character.flaws} onChange={e => handleFieldChange('flaws', e.target.value)} className="w-full h-28 bg-rpg-panel/40 border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner" placeholder="Suas fraquezas..." />
                                </div>
                                <div className="group flex-grow">
                                    <label className="block text-rpg-gold font-bold mb-2 font-cinzel uppercase text-sm tracking-widest group-hover:text-rpg-gold-light transition-colors">Anotações & História</label>
                                    <textarea value={character.notes} onChange={e => handleFieldChange('notes', e.target.value)} className="w-full h-[400px] bg-rpg-panel/40 border border-rpg-gold/10 rounded-lg p-5 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold/30 focus:border-rpg-gold/50 transition-all font-sans leading-relaxed resize-none shadow-inner custom-scrollbar" placeholder="Escreva a lenda do seu herói aqui..." />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Modais */}
                <SelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} title={modalConfig?.title || ''} items={modalConfig?.type === 'class' ? classes : (modalConfig?.type === 'race' ? races : weapons.map(w => w.name))} onSelectItem={handleSelectItem} isLoading={isDbDataLoading} />
                <WeaponModal isOpen={isWeaponModalOpen} onClose={() => setWeaponModalOpen(false)} onSave={handleSaveWeapon} weaponToEdit={weaponToEdit} />
                <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setEquipmentModalOpen(false)} onSave={handleSaveEquipment} allEquipment={allEquipment} onAddNewGlobalItem={handleAddNewGlobalItem} itemToEdit={equipmentToEdit} />
                <SpellSelectModal isOpen={isSpellSelectOpen} onClose={() => setSpellSelectOpen(false)} onSelect={handleSaveSpell} onCreate={() => { setSpellSelectOpen(false); setSpellToEdit(null); setSpellModalOpen(true); }} />
                <SpellModal isOpen={isSpellModalOpen} onClose={() => { setSpellModalOpen(false); setSpellToEdit(null); }} onSave={handleSaveSpell} spellToEdit={spellToEdit} />
                <LevelUpModal
                    isOpen={isLevelUpModalOpen}
                    onClose={() => setLevelUpModalOpen(false)}
                    onApply={handleApplyLevelUp}
                    level={character.level}
                    charClassName={character.class}
                    progression={CLASS_PROGRESSION[character.class]?.[character.level]}
                />
            </div>
        </div>
    );
}
