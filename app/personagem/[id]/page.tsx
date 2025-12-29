
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, getDocs, collection, writeBatch, addDoc } from 'firebase/firestore';
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
import { Weapon, OtherEquipmentItem, dndWeapons, dndEquipments } from '@/lib/items-data';
import { dndClasses, dndRaces } from '@/lib/dnd-data';
import SelectionModal from '@/components/ui/SelectionModal';
import WeaponModal from '@/components/ui/WeaponModal';
import EquipmentModal from '@/components/ui/EquipmentModal'; // PASSO 1: Importar o novo modal

// --- Componentes Auxiliares (sem alterações) ---
const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-rpg-panel border border-rpg-gold/20 shadow-md h-full backdrop-blur-sm">
        <span className="text-sm font-semibold text-rpg-gold text-center font-medieval tracking-wide">{label}</span>
        <span className="text-3xl font-bold text-rpg-parchment font-cinzel mt-1">{value}</span>
    </div>
);
const AttributeInput = ({ label, value, onChange }: { label: string; value: number; onChange: (newValue: number) => void }) => (
    <div className="w-full p-3 text-center transition-all duration-300 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-lg hover:border-rpg-gold/50 backdrop-blur-sm group">
        <label className="block text-xs font-bold tracking-wider text-rpg-gold uppercase font-cinzel group-hover:text-rpg-gold-light">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="w-20 p-1 text-3xl font-bold text-center text-rpg-parchment bg-transparent border-b-2 border-rpg-gold/20 focus:outline-none focus:border-rpg-gold font-medieval" />
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
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ type: 'class' | 'race' | 'weapon', title: string } | null>(null);
    const [classes, setClasses] = useState<string[]>([]);
    const [races, setRaces] = useState<string[]>([]);
    const [weapons, setWeapons] = useState<any[]>([]);
    const [isDbDataLoading, setIsDbDataLoading] = useState(true);

    const [isWeaponModalOpen, setWeaponModalOpen] = useState(false);
    const [weaponToEdit, setWeaponToEdit] = useState<Weapon | null>(null);
    const dataFetchInitiated = useRef(false);
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    // PASSO 2: Novos estados para o equipamento
    const [allEquipment, setAllEquipment] = useState<{ name: string }[]>([]);
    const [isEquipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<OtherEquipmentItem | null>(null);
    const [weaponSearchTerm, setWeaponSearchTerm] = useState('');
    const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');

    const debouncedSave = useCallback(debounce(async (charToSave: Character) => {
        if (!user || !charToSave.id || charToSave.id === 'novo') return;
        try {
            const docRef = doc(db, 'personagens', charToSave.id);
            const dataToSave = JSON.parse(JSON.stringify(charToSave));
            await setDoc(docRef, dataToSave, { merge: true });
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

    // --- useEffect de carregamento de dados --- 
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
                        console.log(`Populando coleção '${collectionName}'...`);
                        const batch = writeBatch(db);
                        const uniqueData = Array.from(new Map(defaultData.map(item => [item.name, item])).values());
                        uniqueData.forEach(item => {
                            const docRef = doc(collectionRef);
                            batch.set(docRef, item);
                        });
                        await batch.commit();
                        snapshot = await getDocs(collectionRef);
                    }
                    const data = snapshot.docs.map(doc => ({ ...doc.data() as any, id: doc.id }));
                    return data.sort((a, b) => a[sortField]?.localeCompare(b[sortField]));
                };

                // PASSO 3: Carregar dados de equipamentos
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
        if (loadingAuth || !user || (id === 'novo' && character)) return;
        const loadChar = async () => {
            setIsLoading(true);
            try {
                if (id === 'novo') {
                    setCharacter(createBlankCharacter(user.uid));
                } else {
                    const docRef = doc(db, 'personagens', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
                        setCharacter(hydrateCharacter(docSnap.data() as Partial<Character>, docSnap.id));
                    } else {
                        setError("Ficha não encontrada ou acesso negado.");
                        router.push('/personagens');
                    }
                }
            } catch (e) { setError("Falha ao carregar a ficha."); console.error(e); }
            finally { setIsLoading(false); }
        }
        loadChar();
    }, [id, user, loadingAuth, router]);

    // --- Lógica de Gerenciamento do Personagem (nested changes, etc.) --- 
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
    const handleSaveNewCharacter = async () => {
        if (!character || character.id !== 'novo' || !user) return;
        try {
            const newCharDocRef = doc(collection(db, 'personagens'));
            const finalChar = { ...character, id: newCharDocRef.id, ownerId: user.uid };
            await setDoc(newCharDocRef, finalChar);
            router.push(`/personagem/${newCharDocRef.id}`);
        } catch (error) { console.error("Erro ao criar novo personagem:", error); setError("Não foi possível salvar a nova ficha."); }
    };

    // --- Lógica de Armas ---
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

    // PASSO 4: Lógica de gerenciamento de equipamentos
    const handleOpenEquipmentModal = (item: OtherEquipmentItem | null) => { setEquipmentToEdit(item); setEquipmentModalOpen(true); };

    const handleSaveEquipment = (item: OtherEquipmentItem) => {
        updateCharacter(char => {
            const newEquipment = [...char.inventory.otherEquipment];
            const index = newEquipment.findIndex(e => e.id === item.id);
            if (index > -1) {
                newEquipment[index] = item;
            } else {
                const existing = newEquipment.find(e => e.name.toLowerCase() === item.name.toLowerCase());
                if (existing) { // Se já existe, apenas soma a quantidade
                    existing.quantity += item.quantity;
                } else { // Se não existe, adiciona
                    newEquipment.push(item);
                }
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
            const newItemRef = doc(collection(db, 'equipamentos'));
            await setDoc(newItemRef, { name: itemName });
            setAllEquipment(prev => [...prev, { name: itemName }].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            console.error("Erro ao adicionar novo item global: ", err);
        }
    };

    const openSelectionModal = (type: 'class' | 'race' | 'weapon') => {
        let title = type === 'class' ? 'Selecione a Classe' : type === 'race' ? 'Selecione a Raça' : 'Selecione uma Arma da Lista';
        setModalConfig({ type, title });
        setSelectionModalOpen(true);
    };

    const handleSelectItem = (item: any) => {
        if (!modalConfig) return;
        setSelectionModalOpen(false);
        if (modalConfig.type === 'class' || modalConfig.type === 'race') {
            handleFieldChange(modalConfig.type, item);
        } else if (modalConfig.type === 'weapon') {
            const selectedWeaponBase = weapons.find(w => w.name === item);
            if (selectedWeaponBase) {
                handleOpenWeaponModal({ ...selectedWeaponBase, id: new Date().toISOString(), quantity: 1, isMagical: false, magicalBonus: 0, magicalEffect: '' });
            }
        }
    };

    if (isLoading || loadingAuth || !character) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="text-2xl text-white">Carregando...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="p-4 text-center text-2xl text-red-500 bg-slate-800 rounded-lg">{error}</div></div>;

    // --- Filtros de Pesquisa para o Render ---
    const filteredWeapons = character.inventory.weapons.filter(w => w.name.toLowerCase().includes(weaponSearchTerm.toLowerCase()));
    const filteredEquipment = character.inventory.otherEquipment.filter(e => e.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase()));

    return (
        <div className="min-h-screen p-4 text-rpg-parchment md:p-8 bg-dnd-gradient font-sans selection:bg-rpg-gold/30 selection:text-rpg-gold">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/personagens" legacyBehavior><a className="px-4 py-2 text-sm font-bold rounded-md transition-all duration-300 bg-rpg-panel border border-rpg-gold/20 text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold shadow-lg hover:shadow-glow-gold">&larr; Voltar ao Salão</a></Link>
                    {id === 'novo' && (<button onClick={handleSaveNewCharacter} className="px-6 py-2 font-bold rounded-md transition-all duration-300 bg-gradient-to-r from-rpg-gold to-yellow-600 text-rpg-dark hover:from-yellow-400 hover:to-rpg-gold shadow-lg hover:shadow-glow-gold transform hover:scale-105">Salvar Novo Personagem</button>)}
                </div>

                <header className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6 p-6 bg-rpg-panel/50 rounded-xl border border-rpg-gold/10 shadow-2xl backdrop-blur-md">
                    <input type="text" value={character.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full text-5xl font-extrabold bg-transparent border-b-2 border-rpg-gold/30 font-cinzel text-rpg-gold focus:outline-none focus:border-rpg-gold transition-all placeholder-rpg-grey/30" placeholder="Nome do Personagem" />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full md:w-auto">
                        <div className="w-full sm:flex-1"><label className="block text-xs font-bold text-rpg-gold uppercase tracking-wider mb-1">Classe</label><button onClick={() => openSelectionModal('class')} className="w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-4 py-2 text-left text-rpg-parchment placeholder-rpg-grey/50 focus:outline-none focus:ring-2 focus:ring-rpg-gold transition-all hover:border-rpg-gold/50 font-medieval">{character.class || 'Selecione...'}</button></div>
                        <div className="w-full sm:w-24"><label htmlFor="level-input" className="block text-xs font-bold text-rpg-gold uppercase tracking-wider mb-1">Nível</label><input id="level-input" type="number" value={character.level} onChange={e => handleFieldChange('level', parseInt(e.target.value, 10) || 1)} className="bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-rpg-parchment text-center font-bold focus:outline-none focus:ring-2 focus:ring-rpg-gold w-full font-medieval text-lg" /></div>
                        <div className="w-full sm:w-32"><label htmlFor="xp-input" className="block text-xs font-bold text-rpg-gold uppercase tracking-wider mb-1">XP Atual</label><input id="xp-input" type="number" value={character.experience} onChange={e => handleFieldChange('experience', parseInt(e.target.value, 10) || 0)} className="bg-rpg-slate border border-rpg-gold/20 rounded-md px-3 py-2 text-rpg-parchment text-center font-bold focus:outline-none focus:ring-2 focus:ring-rpg-gold w-full font-medieval text-lg" /></div>
                        <div className="w-full sm:flex-1"><label className="block text-xs font-bold text-rpg-gold uppercase tracking-wider mb-1">Raça</label><button onClick={() => openSelectionModal('race')} className="w-full bg-rpg-slate border border-rpg-gold/20 rounded-md px-4 py-2 text-left text-rpg-parchment placeholder-rpg-grey/50 focus:outline-none focus:ring-2 focus:ring-rpg-gold transition-all hover:border-rpg-gold/50 font-medieval">{character.race || 'Selecione...'}</button></div>
                    </div>
                </header>

                <div className="mb-6 border-b border-rpg-gold/20"><div className="flex flex-wrap gap-1">{['Principal', 'Equipamento', 'Habilidades', 'Magias', 'Personalidade'].map(tab => <TabButton key={tab} activeTab={activeTab} tabName={tab} onClick={setActiveTab} />)}</div></div>
                <main>
                    {activeTab === 'Principal' && (
                        <div className="space-y-6">
                            {/* Atributos */}
                            <div className="flex gap-2 overflow-x-auto pb-4">
                                {ATTRIBUTE_KEYS.map((key) => (
                                    <AttributeInput
                                        key={key}
                                        label={ATTRIBUTE_DISPLAY_NAMES[key].slice(0, 3)}
                                        value={character.attributes[key]}
                                        onChange={(val) => handleNestedChange(`attributes.${key}`, val)}
                                    />
                                ))}
                            </div>

                            {/* Status Principais */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/20 rounded-lg shadow-md text-center backdrop-blur-sm group hover:border-rpg-gold/40 transition-colors">
                                    <h4 className="text-xs font-bold text-rpg-gold uppercase mb-2 tracking-widest font-cinzel">Pontos de Vida</h4>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <input type="number" value={character.currentHp} onChange={(e) => handleFieldChange('currentHp', parseInt(e.target.value) || 0)} className="w-20 text-4xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/30 text-rpg-parchment font-medieval focus:border-rpg-gold focus:outline-none" />
                                        <span className="text-2xl text-rpg-grey/50 font-medieval">/</span>
                                        <input type="number" value={character.maxHp} onChange={(e) => handleFieldChange('maxHp', parseInt(e.target.value) || 0)} className="w-16 text-2xl font-bold text-center bg-transparent text-rpg-grey border-b border-transparent focus:border-rpg-grey font-medieval" />
                                    </div>
                                    <div className="flex justify-center gap-2 mb-2">
                                        <button onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.max(0, c.currentHp - 1) }))} className="px-3 py-1 bg-rpg-red/20 hover:bg-rpg-red/40 text-red-200 border border-rpg-red/30 rounded text-xs font-bold transition-colors">-1</button>
                                        <button onClick={() => updateCharacter(c => ({ ...c, currentHp: Math.min(c.maxHp, c.currentHp + 1) }))} className="px-3 py-1 bg-green-900/30 hover:bg-green-800/50 text-green-200 border border-green-700/30 rounded text-xs font-bold transition-colors">+1</button>
                                        <button onClick={() => updateCharacter(c => ({ ...c, currentHp: c.maxHp }))} className="px-3 py-1 bg-blue-900/30 hover:bg-blue-800/50 text-blue-200 border border-blue-700/30 rounded text-xs font-bold transition-colors">Curar Tudo</button>
                                    </div>
                                    <div className="mt-2 text-xs text-rpg-grey">Temp: <input type="number" value={character.temporaryHp} onChange={(e) => handleFieldChange('temporaryHp', parseInt(e.target.value) || 0)} className="w-10 bg-transparent border-b border-rpg-grey/30 text-center focus:border-rpg-gold focus:outline-none" /></div>
                                </div>
                                <div className="h-40"><StatBlock label="Classe de Armadura" value={character.armorClass} /></div>
                                <div className="h-40"><StatBlock label="Iniciativa" value={character.initiative >= 0 ? `+${character.initiative}` : character.initiative} /></div>
                                <div className="bg-rpg-panel border border-rpg-gold/20 p-4 rounded-lg shadow-md h-40 flex flex-col items-center justify-center backdrop-blur-sm">
                                    <span className="text-sm font-semibold text-rpg-gold text-center mb-1 font-medieval tracking-wide">Deslocamento</span>
                                    <div className="flex items-baseline">
                                        <input type="number" value={character.speed} onChange={(e) => handleFieldChange('speed', parseFloat(e.target.value) || 0)} className="w-20 text-3xl font-bold text-center bg-transparent border-b-2 border-rpg-gold/20 focus:border-rpg-gold focus:outline-none text-rpg-parchment font-medieval" />
                                        <span className="text-sm text-rpg-grey ml-1 font-medieval">m</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-lg">
                                    <h4 className="font-bold text-rpg-gold mb-3 font-cinzel tracking-wide text-lg border-b border-rpg-gold/10 pb-2">Resistências (Death Saves)</h4>
                                    <div className="flex justify-between items-center mb-2"><span className="text-sm text-rpg-grey font-bold">Sucessos</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" checked={character.deathSaves?.successes >= i} onChange={(e) => handleNestedChange('deathSaves.successes', e.target.checked ? i : i - 1)} className="w-5 h-5 rounded-full text-green-600 bg-rpg-dark border-rpg-grey/30 focus:ring-green-500 cursor-pointer" />)}</div></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-rpg-grey font-bold">Falhas</span> <div className="flex gap-2">{[1, 2, 3].map(i => <input key={i} type="checkbox" checked={character.deathSaves?.failures >= i} onChange={(e) => handleNestedChange('deathSaves.failures', e.target.checked ? i : i - 1)} className="w-5 h-5 rounded-full text-rpg-red bg-rpg-dark border-rpg-grey/30 focus:ring-rpg-red cursor-pointer" />)}</div></div>
                                </div>
                                <div className="p-5 bg-rpg-panel border border-rpg-gold/10 rounded-lg text-center flex flex-col justify-center shadow-lg">
                                    <span className="text-sm text-rpg-gold font-bold uppercase tracking-wider mb-2">Bônus de Proficiência</span>
                                    <span className="text-5xl font-bold text-rpg-parchment font-medieval drop-shadow-lg">+{character.proficiencyBonus}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASSO 5: Reconstrução da Aba de Equipamento */}
                    {activeTab === 'Equipamento' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-rpg-gold mb-3 font-cinzel">Tesouro</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-inner">
                                    {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold tracking-wider text-rpg-gold uppercase text-center mb-1 font-medieval">{key}</label>
                                            <input type="number" value={character.inventory.currency[key]} onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value, 10) || 0)} className="w-full p-2 text-xl font-bold text-center text-rpg-parchment bg-rpg-slate rounded-md focus:outline-none focus:ring-2 focus:ring-rpg-gold font-medieval border border-rpg-gold/20" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel">Armas</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => openSelectionModal('weapon')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-rpg-slate hover:bg-rpg-dark border border-rpg-grey/30 text-rpg-parchment shadow-md">Adicionar da Lista</button>
                                        <button onClick={() => handleOpenWeaponModal(null)} className="px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 bg-rpg-gold text-rpg-dark hover:bg-rpg-gold-light shadow-lg hover:shadow-glow-gold">Criar Arma</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-inner space-y-3 min-h-[200px]">
                                    <input type="text" placeholder="Pesquisar armas..." value={weaponSearchTerm} onChange={(e) => setWeaponSearchTerm(e.target.value)} className="w-full p-2 mb-3 bg-rpg-slate rounded-md placeholder-rpg-grey/50 border border-rpg-gold/10 text-rpg-parchment focus:border-rpg-gold outline-none" />
                                    {filteredWeapons.map((weapon) => (
                                        <div key={weapon.id} className="p-3 bg-rpg-slate/80 border border-rpg-gold/5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-rpg-gold/30 transition-colors">
                                            <div className="flex-grow">
                                                <p className="font-bold text-rpg-parchment font-medieval text-lg">{weapon.name} <span className="font-normal text-rpg-grey text-sm font-sans">(x{weapon.quantity || 1})</span> {weapon.isMagical && <span className="text-sm font-normal text-rpg-gold font-sans"> (+{weapon.magicalBonus})</span>}</p>
                                                <p className="text-sm text-rpg-grey/80">{weapon.damage} {weapon.damageType} {weapon.properties.length > 0 && `| ${weapon.properties.join(', ')}`}</p>
                                                {weapon.isMagical && weapon.magicalEffect && <p className="text-xs text-rpg-gold/80 mt-1 italic"><em>{weapon.magicalEffect}</em></p>}
                                            </div>
                                            <div className="flex gap-2 self-end md:self-center"><button onClick={() => handleOpenWeaponModal(weapon)} className="px-3 py-1 text-xs font-medium bg-rpg-slate/50 border border-rpg-grey/30 hover:border-rpg-gold text-rpg-grey hover:text-rpg-parchment rounded-md transition-colors">Editar</button><button onClick={() => handleRemoveWeapon(weapon.id)} className="px-3 py-1 text-xs font-medium bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded-md transition-colors">Remover</button></div>
                                        </div>
                                    ))}
                                    {filteredWeapons.length === 0 && <p className="text-center text-rpg-grey py-8 italic">{character.inventory.weapons.length > 0 ? 'Nenhuma arma encontrada na busca.' : 'O cinto está vazio. Adicione uma arma para o combate.'}</p>}
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                                    <h3 className="text-xl font-bold text-rpg-gold font-cinzel">Outros Equipamentos</h3>
                                    <button onClick={() => handleOpenEquipmentModal(null)} className="px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 bg-rpg-gold text-rpg-dark hover:bg-rpg-gold-light shadow-lg hover:shadow-glow-gold">Adicionar Item</button>
                                </div>
                                <div className="p-4 bg-rpg-panel border border-rpg-gold/10 rounded-lg shadow-inner space-y-3 min-h-[200px]">
                                    <input type="text" placeholder="Pesquisar equipamentos..." value={equipmentSearchTerm} onChange={(e) => setEquipmentSearchTerm(e.target.value)} className="w-full p-2 mb-3 bg-rpg-slate rounded-md placeholder-rpg-grey/50 border border-rpg-gold/10 text-rpg-parchment focus:border-rpg-gold outline-none" />
                                    {filteredEquipment.map((item) => (
                                        <div key={item.id} className="p-3 bg-rpg-slate/80 border border-rpg-gold/5 rounded-lg flex justify-between items-center gap-3 hover:border-rpg-gold/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!item.isEquipped}
                                                    onChange={(e) => {
                                                        const isEquipped = e.target.checked;
                                                        const updatedEquipment = character.inventory.otherEquipment.map(i =>
                                                            i.id === item.id ? { ...i, isEquipped } : i
                                                        );
                                                        if (isEquipped && (item.type === 'armor' || item.type === 'shield')) {
                                                            updatedEquipment.forEach(i => {
                                                                if (i.id !== item.id && i.type === item.type) i.isEquipped = false;
                                                            });
                                                        }
                                                        handleNestedChange('inventory.otherEquipment', updatedEquipment);
                                                    }}
                                                    className="w-5 h-5 rounded border-rpg-grey/50 text-rpg-gold bg-rpg-dark focus:ring-rpg-gold cursor-pointer"
                                                    title="Equipar/Usar"
                                                />
                                                <div>
                                                    <p className={`font-bold font-medieval text-lg ${item.isEquipped ? 'text-rpg-gold' : 'text-rpg-parchment'}`}>{item.name} <span className="font-normal text-rpg-grey text-sm font-sans">(x{item.quantity || 1})</span></p>
                                                    {item.armorClass && <span className="text-xs text-rpg-grey">CA {item.armorClass} ({item.type === 'armor' ? 'Armadura' : 'Escudo'})</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2"><button onClick={() => handleOpenEquipmentModal(item)} className="px-3 py-1 text-xs font-medium bg-rpg-slate/50 border border-rpg-grey/30 hover:border-rpg-gold text-rpg-grey hover:text-rpg-parchment rounded-md transition-colors">Editar</button><button onClick={() => handleRemoveEquipment(item.id)} className="px-3 py-1 text-xs font-medium bg-rpg-red/20 border border-rpg-red/30 hover:bg-rpg-red/40 text-red-200 rounded-md transition-colors">Remover</button></div>
                                        </div>
                                    ))}
                                    {filteredEquipment.length === 0 && <p className="text-center text-rpg-grey py-8 italic">{character.inventory.otherEquipment.length > 0 ? 'Nenhum item encontrado na busca.' : 'A mochila está vazia.'}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Habilidades' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-4 rounded-lg shadow-md backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-rpg-gold mb-4 border-b border-rpg-gold/20 pb-2 font-cinzel">Perícias</h3>
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
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-4 rounded-lg shadow-md backdrop-blur-sm">
                                <h3 className="text-xl font-bold text-rpg-gold mb-4 border-b border-rpg-gold/20 pb-2 font-cinzel">Características e Talentos</h3>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {character.features && character.features.length > 0 ? (
                                        character.features.map((feature, idx) => (
                                            <div key={idx} className="bg-rpg-slate/60 p-3 rounded-md border-l-2 border-rpg-gold/30 hover:bg-rpg-slate/80 transition-colors">
                                                <h4 className="font-bold text-rpg-parchment mb-1 font-medieval text-lg">{feature.name}</h4>
                                                <p className="text-sm text-rpg-grey">{feature.description}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-rpg-grey italic p-4 text-center">Nenhuma característica registrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Magias' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatBlock label="Habilidade de Conjuração" value={character.spellcasting?.ability ? ATTRIBUTE_DISPLAY_NAMES[character.spellcasting.ability] : '-'} />
                                <StatBlock label="CD de Resistência" value={character.spellcasting?.saveDc || 0} />
                                <StatBlock label="Bônus de Ataque" value={`+${character.spellcasting?.attackBonus || 0}`} />
                            </div>
                            <div className="bg-rpg-panel border border-rpg-gold/10 p-4 rounded-lg shadow-md min-h-[400px]">
                                <h3 className="text-xl font-bold text-rpg-gold mb-4 font-cinzel border-b border-rpg-gold/10 pb-2">Lista de Magias</h3>
                                {character.spells && character.spells.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {character.spells.map((spell, idx) => (
                                            <div key={idx} className="bg-rpg-slate p-3 rounded-md border-l-4 border-purple-900 hover:border-rpg-gold hover:bg-rpg-slate/80 transition-all">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-bold text-rpg-parchment font-medieval text-lg">{spell.name}</span>
                                                    <span className="text-xs text-purple-300 uppercase tracking-widest font-bold">Nível {spell.level}</span>
                                                </div>
                                                <p className="text-sm text-rpg-grey mt-1">{spell.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-rpg-grey text-center py-20 italic">O grimório está vazio.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Personalidade' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-rpg-gold font-bold mb-1 font-cinzel">Traços de Personalidade</label>
                                    <textarea value={character.personalityTraits} onChange={e => handleFieldChange('personalityTraits', e.target.value)} className="w-full h-24 bg-rpg-slate border border-rpg-gold/10 rounded-md p-3 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-rpg-gold font-bold mb-1 font-cinzel">Ideais</label>
                                    <textarea value={character.ideals} onChange={e => handleFieldChange('ideals', e.target.value)} className="w-full h-24 bg-rpg-slate border border-rpg-gold/10 rounded-md p-3 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-rpg-gold font-bold mb-1 font-cinzel">Vínculos</label>
                                    <textarea value={character.bonds} onChange={e => handleFieldChange('bonds', e.target.value)} className="w-full h-24 bg-rpg-slate border border-rpg-gold/10 rounded-md p-3 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold focus:border-transparent" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-rpg-gold font-bold mb-1 font-cinzel">Defeitos</label>
                                    <textarea value={character.flaws} onChange={e => handleFieldChange('flaws', e.target.value)} className="w-full h-24 bg-rpg-slate border border-rpg-gold/10 rounded-md p-3 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold focus:border-transparent" />
                                </div>
                                <div className="flex-grow">
                                    <label className="block text-rpg-gold font-bold mb-1 font-cinzel">Anotações & História</label>
                                    <textarea value={character.notes} onChange={e => handleFieldChange('notes', e.target.value)} className="w-full h-64 bg-rpg-slate border border-rpg-gold/10 rounded-md p-4 text-rpg-parchment focus:outline-none focus:ring-2 focus:ring-rpg-gold focus:border-transparent font-sans leading-relaxed" />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Modais */}
                {isSelectionModalOpen && modalConfig && <SelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} title={modalConfig.title} items={modalConfig.type === 'class' ? classes : (modalConfig.type === 'race' ? races : weapons.map(w => w.name))} onSelectItem={handleSelectItem} onAddItem={modalConfig.type === 'weapon' ? async () => { handleOpenWeaponModal(null); } : undefined} isLoading={isDbDataLoading} />}
                <WeaponModal isOpen={isWeaponModalOpen} onClose={() => setWeaponModalOpen(false)} onSave={handleSaveWeapon} weaponToEdit={weaponToEdit} />
                {/* PASSO 6: Renderizar o novo modal */}
                <EquipmentModal
                    isOpen={isEquipmentModalOpen}
                    onClose={() => setEquipmentModalOpen(false)}
                    onSave={handleSaveEquipment}
                    allEquipment={allEquipment}
                    onAddNewGlobalItem={handleAddNewGlobalItem}
                    itemToEdit={equipmentToEdit}
                />
            </div>
        </div>
    );
}
