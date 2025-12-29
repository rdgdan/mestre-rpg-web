
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
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800 shadow-md h-full">
        <span className="text-sm font-semibold text-slate-300 text-center">{label}</span>
        <span className="text-2xl font-bold text-white">{value}</span>
    </div>
);
const AttributeInput = ({ label, value, onChange }: { label: string; value: number; onChange: (newValue: number) => void }) => (
    <div className="w-full p-3 text-center transition-colors duration-200 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-700">
        <label className="block text-xs font-bold tracking-wider text-accent uppercase">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="w-20 p-1 text-3xl font-bold text-center text-white bg-transparent border-b-2 border-slate-600 focus:outline-none focus:border-primary" />
        <div className="mt-1 text-xl font-bold text-white">{Math.floor((value - 10) / 2)}</div>
    </div>
);
const SkillCheckbox = ({ skillKey, displayName, attribute, isProficient, proficiencyBonus, attributeMod, onChange }) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700">
        <label htmlFor={skillKey} className="flex items-center cursor-pointer">
            <input id={skillKey} type="checkbox" checked={isProficient} onChange={(e) => onChange(skillKey, e.target.checked)} className="w-4 h-4 rounded-sm text-primary focus:ring-primary-dark bg-slate-600 border-slate-500" />
            <span className="ml-3 text-sm text-white">{displayName} <span className="text-xs text-slate-400">({attribute.slice(0, 3).toUpperCase()})</span></span>
        </label>
        <span className="font-mono text-lg font-bold text-white">{isProficient ? attributeMod + proficiencyBonus : attributeMod}</span>
    </div>
);
const TabButton = ({ activeTab, tabName, onClick }) => (
    <button onClick={() => onClick(tabName)} className={`flex-grow px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${activeTab === tabName ? 'bg-slate-800 text-primary shadow-inner' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'}`}>
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
    const [allEquipment, setAllEquipment] = useState<{name: string}[]>([]);
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
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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
                if(existing) { // Se já existe, apenas soma a quantidade
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
            setAllEquipment(prev => [...prev, { name: itemName }].sort((a,b) => a.name.localeCompare(b.name)));
        } catch(err) {
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
        <div className="min-h-screen p-4 text-white md:p-8 bg-gradient-to-br from-gray-900 to-slate-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link href="/personagens" legacyBehavior><a className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-primary">&larr; Voltar ao Salão</a></Link>
                    {id === 'novo' && (<button onClick={handleSaveNewCharacter} className="px-6 py-2 font-bold rounded-md transition-all duration-200 bg-primary text-slate-900 hover:bg-primary-dark shadow-lg">Salvar Novo Personagem</button>)}
                </div>

                <header className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
                    <input type="text" value={character.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full text-4xl font-extrabold bg-transparent border-b-2 border-transparent font-cinzel text-accent focus:outline-none focus:border-primary" placeholder="Nome do Personagem"/>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-full md:w-auto">
                         <div className="w-full sm:flex-1"><label className="block text-xs font-medium text-slate-400">Classe</label><button onClick={() => openSelectionModal('class')} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-left text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary">{character.class || 'Selecione...'}</button></div>
                         <div className="w-full sm:w-24"><label htmlFor="level-input" className="block text-xs font-medium text-slate-400">Nível</label><input id="level-input" type="number" value={character.level} onChange={e => handleFieldChange('level', parseInt(e.target.value, 10) || 1)} className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary w-full"/></div>
                         <div className="w-full sm:flex-1
"><label className="block text-xs font-medium text-slate-400">Raça</label><button onClick={() => openSelectionModal('race')} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-left text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary">{character.race || 'Selecione...'}</button></div>
                    </div>
                </header>

                <div className="mb-4 border-b border-slate-700"><div className="flex flex-wrap gap-1">{['Principal', 'Equipamento', 'Habilidades', 'Magias', 'Personalidade'].map(tab => <TabButton key={tab} activeTab={activeTab} tabName={tab} onClick={setActiveTab} />)}</div></div>
                <main>
                     {activeTab === 'Principal' && ( <div className="space-y-6"> {/* Conteúdo da Aba Principal */} </div> )}

                     {/* PASSO 5: Reconstrução da Aba de Equipamento */}
                    {activeTab === 'Equipamento' && (
                        <div className="space-y-8">
                             <div>
                                <h3 className="text-xl font-bold text-accent mb-3">Tesouro</h3>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 p-4 bg-slate-800 rounded-lg shadow-inner">
                                    {(Object.keys(character.inventory.currency) as Array<keyof typeof character.inventory.currency>).map(key => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold tracking-wider text-accent uppercase text-center mb-1">{key}</label>
                                            <input type="number" value={character.inventory.currency[key]} onChange={e => handleNestedChange(`inventory.currency.${key}`, parseInt(e.target.value, 10) || 0)} className="w-full p-2 text-xl font-bold text-center text-white bg-slate-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                                    <h3 className="text-xl font-bold text-accent">Armas</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => openSelectionModal('weapon')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-slate-700 hover:bg-slate-600 shadow-md">Adicionar da Lista</button>
                                        <button onClick={() => handleOpenWeaponModal(null)} className="px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 bg-primary text-slate-900 hover:bg-primary-dark shadow-lg">Criar Arma</button>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-800 rounded-lg shadow-inner space-y-3">
                                     <input type="text" placeholder="Pesquisar armas..." value={weaponSearchTerm} onChange={(e) => setWeaponSearchTerm(e.target.value)} className="w-full p-2 mb-3 bg-slate-900 rounded-md placeholder-slate-400" />
                                    {filteredWeapons.map((weapon) => (
                                        <div key={weapon.id} className="p-3 bg-slate-900/70 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                            <div className="flex-grow">
                                                <p className="font-bold text-white">{weapon.name} <span className="font-normal text-slate-400">(x{weapon.quantity || 1})</span> {weapon.isMagical && <span className="text-sm font-normal text-primary"> (+{weapon.magicalBonus})</span>}</p>
                                                <p className="text-sm text-slate-300">{weapon.damage} {weapon.damageType} {weapon.properties.length > 0 && `| ${weapon.properties.join(', ')}`}</p>
                                                {weapon.isMagical && weapon.magicalEffect && <p className="text-xs text-slate-400 mt-1"><em>{weapon.magicalEffect}</em></p>}
                                            </div>
                                            <div className="flex gap-2 self-end md:self-center"><button onClick={() => handleOpenWeaponModal(weapon)} className="px-3 py-1 text-xs font-medium bg-slate-600 rounded-md hover:bg-slate-500">Editar</button><button onClick={() => handleRemoveWeapon(weapon.id)} className="px-3 py-1 text-xs font-medium bg-red-800 rounded-md hover:bg-red-700">Remover</button></div>
                                        </div>
                                    ))}
                                    {filteredWeapons.length === 0 && <p className="text-center text-slate-400 py-4">{character.inventory.weapons.length > 0 ? 'Nenhuma arma encontrada na busca.' : 'Nenhuma arma equipada.'}</p>}
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                                    <h3 className="text-xl font-bold text-accent">Outros Equipamentos e Itens</h3>
                                    <button onClick={() => handleOpenEquipmentModal(null)} className="px-4 py-2 text-sm font-bold rounded-md transition-colors duration-200 bg-primary text-slate-900 hover:bg-primary-dark shadow-lg">Adicionar Item</button>
                                </div>
                                <div className="p-4 bg-slate-800 rounded-lg shadow-inner space-y-3">
                                     <input type="text" placeholder="Pesquisar equipamentos..." value={equipmentSearchTerm} onChange={(e) => setEquipmentSearchTerm(e.target.value)} className="w-full p-2 mb-3 bg-slate-900 rounded-md placeholder-slate-400" />
                                    {filteredEquipment.map((item) => (
                                        <div key={item.id} className="p-3 bg-slate-900/70 rounded-lg flex justify-between items-center gap-3">
                                            <p className="font-bold text-white">{item.name} <span className="font-normal text-slate-400">(x{item.quantity || 1})</span></p>
                                            <div className="flex gap-2"><button onClick={() => handleOpenEquipmentModal(item)} className="px-3 py-1 text-xs font-medium bg-slate-600 rounded-md hover:bg-slate-500">Editar</button><button onClick={() => handleRemoveEquipment(item.id)} className="px-3 py-1 text-xs font-medium bg-red-800 rounded-md hover:bg-red-700">Remover</button></div>
                                        </div>
                                    ))}
                                    {filteredEquipment.length === 0 && <p className="text-center text-slate-400 py-4">{character.inventory.otherEquipment.length > 0 ? 'Nenhum item encontrado na busca.' : 'Nenhum item na mochila.'}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ... outras abas ... */}
                </main>

                {/* Modais */}
                {isSelectionModalOpen && modalConfig && <SelectionModal isOpen={isSelectionModalOpen} onClose={() => setSelectionModalOpen(false)} title={modalConfig.title} items={modalConfig.type === 'class' ? classes : (modalConfig.type === 'race' ? races : weapons.map(w => w.name))} onSelectItem={handleSelectItem} onAddItem={modalConfig.type === 'weapon' ? () => handleOpenWeaponModal(null) : undefined} isLoading={isDbDataLoading} />}
                <WeaponModal isOpen={isWeaponModalOpen} onClose={() => setWeaponModalOpen(false)} onSave={handleSaveWeapon} weaponToEdit={weaponToEdit} />
                {/* PASSO 6: Renderizar o novo modal */}
                <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setEquipmentModalOpen(false)} onSave={handleSaveEquipment} allEquipment={allEquipment} onAddNewGlobalItem={handleAddNewGlobalItem} />
            </div>
        </div>
    );
}
