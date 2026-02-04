'use client';

import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { firestoreCache } from '@/lib/cache-service';
import { DEFAULT_CLASSES, dndRaces } from '@/lib/dnd-data';

type CollectionType = 'magias' | 'armas' | 'itens' | 'armaduras' | 'escudos' | 'monsters' | 'npcs' | 'classes' | 'races';

interface Category {
    id: CollectionType;
    label: string;
    icon: string;
}

const CATEGORIES: Category[] = [
    { id: 'magias', label: 'Magias', icon: '✨' },
    { id: 'armas', label: 'Armas', icon: '⚔️' },
    { id: 'armaduras', label: 'Armaduras', icon: '🦺' },
    { id: 'escudos', label: 'Escudos', icon: '🛡️' },
    { id: 'itens', label: 'Equipamentos', icon: '🎒' },
    { id: 'monsters', label: 'Bestiário', icon: '🐉' },
    { id: 'npcs', label: 'NPCs', icon: '🧑‍🌾' },
    { id: 'classes', label: 'Classes', icon: '🧙‍♂️' },
    { id: 'races', label: 'Raças', icon: '🧝' },
];

export default function DatabaseManagementPage() {
    const [forceReload, setForceReload] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<CollectionType>('magias');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [initialCollection, setInitialCollection] = useState<CollectionType | null>(null);
    const [registrationType, setRegistrationType] = useState<CollectionType>('magias');
    const [formData, setFormData] = useState<any>({});
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [duplicateItem, setDuplicateItem] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    // Dynamic lists from DB
    const [dbClasses, setDbClasses] = useState<string[]>([]);
    const [dbRaces, setDbRaces] = useState<string[]>([]);

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isModalOpen]);

    useEffect(() => {
        if (!isLoading) {
            if (!user || user.uid !== 'cynl59ZjdlgUJbuzs8lkufCWI0W2') {
                router.push('/home');
            }
        }
    }, [user, isLoading, router]);

    // Fetch dynamic lists for the modal
    useEffect(() => {
        async function fetchLists() {
            try {
                const classesSnap = await getDocs(collection(db, 'classes'));
                const racesSnap = await getDocs(collection(db, 'races'));
                const classesNames = classesSnap.docs.map(doc => doc.data().name || doc.data().title).filter(Boolean);
                const racesNames = racesSnap.docs.map(doc => doc.data().name || doc.data().title).filter(Boolean);
                setDbClasses(classesNames.length > 0 ? Array.from(new Set([...classesNames, ...DEFAULT_CLASSES])) : DEFAULT_CLASSES);
                setDbRaces(racesNames.length > 0 ? Array.from(new Set([...racesNames, ...dndRaces])) : dndRaces);
            } catch (error) {
                setDbClasses(DEFAULT_CLASSES);
                setDbRaces(dndRaces);
            }
        }
        fetchLists();
    }, [forceReload]);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setIsLoading(true);
            const cachedData = firestoreCache.get(activeTab);
            if (cachedData && !forceReload) {
                setItems(cachedData);
                setIsLoading(false);
                return;
            }
            let collectionName = activeTab;
            if (['escudos', 'armas', 'armaduras', 'itens'].includes(activeTab)) collectionName = 'itens';

            try {
                const q = query(collection(db, collectionName));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (!cancelled) {
                    firestoreCache.set(activeTab, data);
                    setItems(data);
                    setIsLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Erro ao carregar dados:", error);
                    setItems([]);
                    setIsLoading(false);
                }
            }
        }
        fetchData();
        setForceReload(false);
        return () => { cancelled = true; };
    }, [activeTab, forceReload]);

    let filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;
        const search = searchQuery.toLowerCase();
        const nameFields = [item.name, item.title, item.originalName, item.nameLower, item.npcName, item.npcType];
        return nameFields.filter(Boolean).some(field => String(field).toLowerCase().includes(search));
    });

    if (activeTab === 'escudos') filteredItems = filteredItems.filter(item => (item.itemType || '').toUpperCase() === 'ESCUDO' || (item.itemType || '').toUpperCase() === 'SHIELD');
    if (activeTab === 'armas') filteredItems = filteredItems.filter(item => (item.itemType || '').toUpperCase() === 'ARMA' || (item.itemType || '').toUpperCase() === 'WEAPON');
    if (activeTab === 'armaduras') filteredItems = filteredItems.filter(item => (item.itemType || '').toUpperCase() === 'ARMADURA' || (item.itemType || '').toUpperCase() === 'ARMOR');
    if (activeTab === 'itens') filteredItems = filteredItems.filter(item => !['ESCUDO', 'SHIELD', 'ARMA', 'WEAPON', 'ARMADURA', 'ARMOR'].includes((item.itemType || '').toUpperCase()));

    filteredItems.sort((a, b) => (a.name || a.title || '').toLowerCase().localeCompare((b.name || b.title || '').toLowerCase(), 'pt-BR'));

    const openModal = (item?: any) => {
        setDuplicateWarning(null);
        setDuplicateItem(null);
        if (item) {
            setEditingId(item.id);
            setInitialCollection(activeTab);
            setRegistrationType(activeTab);

            const normalizedRequirements = {
                level: item.requirements?.level || 0,
                classes: Array.isArray(item.requirements?.classes) ? item.requirements.classes : (typeof item.requirements?.classes === 'string' ? item.requirements.classes.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
                races: Array.isArray(item.requirements?.races) ? item.requirements.races : (typeof item.requirements?.races === 'string' ? item.requirements.races.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
            };

            setFormData({
                ...item,
                requirements: normalizedRequirements,
                classes: Array.isArray(item.classes) ? item.classes : (typeof item.classes === 'string' ? item.classes.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
                attributes: item.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                noFabrication: item.noFabrication || false,
                noWeight: item.noWeight || false,
                noPrice: item.noPrice || false,
            });
        } else {
            setEditingId(null);
            setInitialCollection(null);
            setRegistrationType(activeTab);
            setFormData({
                name: '',
                description: '',
                requirements: { level: 0, classes: [], races: [] },
                classes: [],
                attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                noFabrication: false,
                noWeight: false,
                noPrice: false,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name && !formData.title) return;

        try {
            const dataToSave = { ...formData, updatedAt: serverTimestamp() };
            let targetCollection = registrationType;
            if (['escudos', 'armas', 'armaduras', 'itens'].includes(registrationType)) {
                targetCollection = 'itens';
                if (registrationType === 'armas') dataToSave.itemType = 'ARMA';
                if (registrationType === 'escudos') dataToSave.itemType = 'ESCUDO';
                if (registrationType === 'armaduras') dataToSave.itemType = 'ARMADURA';
            }

            if (editingId && initialCollection && initialCollection !== targetCollection) {
                await deleteDoc(doc(db, initialCollection, editingId));
                delete dataToSave.id;
                await addDoc(collection(db, targetCollection), { ...dataToSave, createdAt: serverTimestamp(), ownerId: user?.uid });
            } else if (editingId) {
                delete dataToSave.id;
                await updateDoc(doc(db, targetCollection, editingId), dataToSave);
            } else {
                await addDoc(collection(db, targetCollection), { ...dataToSave, createdAt: serverTimestamp(), ownerId: user?.uid });
            }
            setIsModalOpen(false);
            setFormData({});
            setEditingId(null);
            firestoreCache.invalidate(targetCollection);
            setForceReload(true);
        } catch (error) {
            alert("Erro ao salvar no banco de dados.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
            try {
                let collectionName = activeTab;
                if (['escudos', 'armas', 'armaduras', 'itens'].includes(activeTab)) collectionName = 'itens';
                await deleteDoc(doc(db, collectionName, id));
                firestoreCache.invalidate(activeTab);
                setForceReload(true);
            } catch (error) { console.error(error); }
        }
    };

    const handleSyncDefaults = async () => {
        if (!confirm(`Deseja importar as ${activeTab === 'classes' ? 'Classes' : 'Raças'} padrão?`)) return;
        setIsMigrating(true);
        try {
            const batch = writeBatch(db);
            const dataToImport = activeTab === 'classes' ? DEFAULT_CLASSES : dndRaces;
            for (const name of dataToImport) {
                const newDocRef = doc(collection(db, activeTab));
                batch.set(newDocRef, { name, description: `${name} padrão do sistema.`, createdAt: serverTimestamp(), ownerId: user?.uid });
            }
            await batch.commit();
            alert('🎉 Dados importados com sucesso!');
            setForceReload(true);
        } catch (error) { alert("Erro ao sincronizar."); } finally { setIsMigrating(false); }
    };

    const handleMigrateSpells = async () => {
        setIsMigrating(true);
        try {
            const { spellsDatabase } = await import('@/lib/spells-data');
            const snapshot = await getDocs(collection(db, 'magias'));
            const firestoreMap = new Map();
            snapshot.docs.forEach(doc => firestoreMap.set(doc.data().name?.toLowerCase().trim(), { id: doc.id, ...doc.data() }));
            for (const spell of spellsDatabase) {
                const existing = firestoreMap.get(spell.name.toLowerCase().trim());
                if (existing && (!existing.classes || existing.classes.length === 0)) {
                    await updateDoc(doc(db, 'magias', existing.id), { classes: spell.classes });
                }
            }
            alert('🎉 Magias atualizadas!');
            setForceReload(true);
        } catch (error) { console.error(error); } finally { setIsMigrating(false); }
    };

    const updateField = (field: string, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
    const updateNestedField = (parent: string, field: string, value: any) => { setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } })); };

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col">
            <header className="bg-rpg-panel p-4 border-b-2 border-rpg-gold/30 backdrop-blur-sm sticky top-0 z-20">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/home')} className="text-rpg-gold text-2xl hover:scale-110 transition-all">⬅️</button>
                        <h1 className="text-2xl font-cinzel font-bold text-rpg-gold">Banco de Dados Arcano</h1>
                    </div>
                    <button onClick={() => openModal()} className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-6 py-2 rounded-lg font-cinzel font-bold shadow-glow-gold transition-all">+ Novo Registro</button>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                <div className="flex justify-between items-center mb-6 gap-4">
                    {activeTab === 'magias' && (
                        <button onClick={handleMigrateSpells} disabled={isMigrating} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-cinzel font-bold shadow-lg transition-all flex items-center gap-2">
                            {isMigrating ? <span className="animate-spin">⚙️</span> : '🔄'} Migrar Classes
                        </button>
                    )}
                    {(activeTab === 'classes' || activeTab === 'races') && items.length === 0 && (
                        <button onClick={handleSyncDefaults} disabled={isMigrating} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-cinzel font-bold shadow-lg transition-all flex items-center gap-2">
                            {isMigrating ? <span className="animate-spin">⚙️</span> : '📥'} Importar {activeTab === 'classes' ? 'Classes' : 'Raças'} Padrão
                        </button>
                    )}
                    <div className="flex-grow"></div>
                    <button onClick={() => setForceReload(true)} className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-4 py-2 rounded-lg font-cinzel font-bold shadow-glow-gold transition-all">🔄 Atualizar</button>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 bg-black/20 p-2 rounded-xl border border-white/5 overflow-x-auto">
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-cinzel font-bold transition-all whitespace-nowrap ${activeTab === cat.id ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold scale-105' : 'hover:bg-white/10 text-rpg-grey'}`}>
                            <span>{cat.icon}</span> {cat.label}
                        </button>
                    ))}
                </div>

                <div className="mb-6"><input type="text" placeholder={`Buscar em ${CATEGORIES.find(c => c.id === activeTab)?.label}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-rpg-slate/50 border border-rpg-gold/20 p-4 rounded-xl focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval" /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center animate-pulse text-rpg-grey font-medieval text-xl">Consultando os pergaminhos antigos...</div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map(item => {
                            let faltando = !item.name && !item.title;
                            return (
                                <div key={item.id} className={`bg-rpg-panel border p-5 rounded-2xl transition-all group relative overflow-hidden ${faltando ? 'border-red-600 shadow-glow-red' : 'border-rpg-gold/10 hover:border-rpg-gold/40'}`}>
                                    <div className="absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(item)} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400">✏️</button>
                                        <button onClick={() => handleDelete(item.id, item.name || item.title)} className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400">🗑️</button>
                                    </div>
                                    <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">{sanitizeField(item.name || item.title)}</h3>
                                    <p className="text-sm font-medieval line-clamp-3 text-rpg-parchment/70">{typeof item.description === 'string' ? item.description : 'Sem descrição.'}</p>
                                    {['monsters', 'npcs'].includes(activeTab) && (
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-rpg-grey">
                                            <span>❤️ {sanitizeField(item.hp) || '-'} HP</span>
                                            <span>🛡️ {sanitizeField(item.ac) || '-'} CA</span>
                                            <span>🎲 CR {sanitizeField(item.challenge) || '-'}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center text-rpg-grey font-medieval text-lg">Nenhum registro encontrado nesta coleção.</div>
                    )}
                </div>
            </main>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? `Editar Registro` : `Novo Registro Arcano`}>
                <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="bg-black/30 p-4 rounded-xl border border-rpg-gold/20">
                        <label className="block text-xs font-cinzel text-rpg-gold uppercase tracking-widest mb-3">Tipo de Registro</label>
                        <select value={registrationType} onChange={(e) => setRegistrationType(e.target.value as CollectionType)} className="w-full bg-rpg-dark border border-white/10 p-3 rounded-lg text-rpg-parchment font-cinzel focus:outline-none focus:border-rpg-gold">
                            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <InputField label="Nome / Título" value={formData.name || formData.title} onChange={(v: any) => updateField('name', v)} required />
                        <InputField label="Descrição Geral" value={formData.description} onChange={(v: any) => updateField('description', v)} textarea />

                        {!['monsters', 'races', 'classes', 'npcs'].includes(registrationType) && (
                            <div className="bg-white/5 p-4 rounded-xl space-y-4 border border-white/5">
                                <h4 className="text-xs font-cinzel text-rpg-gold uppercase tracking-widest opacity-70">Requisitos e Restrições</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3">
                                        <InputField label="Nível Mínimo" type="number" value={formData.requirements?.level} onChange={(v: any) => updateNestedField('requirements', 'level', parseInt(v))} />
                                    </div>
                                    <div className="md:col-span-9">
                                        <MultiSelectField
                                            label="Classes Permitidas"
                                            options={dbClasses}
                                            selected={registrationType === 'magias' ? (formData.classes || []) : (formData.requirements?.classes || [])}
                                            onChange={(newS: string[]) => registrationType === 'magias' ? updateField('classes', newS) : updateNestedField('requirements', 'classes', newS)}
                                        />
                                    </div>
                                </div>
                                <MultiSelectField
                                    label="Raças Permitidas"
                                    options={dbRaces}
                                    selected={formData.requirements?.races || []}
                                    onChange={(newS: string[]) => updateNestedField('requirements', 'races', newS)}
                                    placeholder="Vazio para todas"
                                />
                            </div>
                        )}

                        {registrationType === 'magias' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Círculo" type="number" value={formData.level} onChange={(v: any) => updateField('level', parseInt(v))} required />
                                <InputField label="Escola" value={formData.school} onChange={(v: any) => updateField('school', v)} required />
                                <InputField label="Tempo de Conjuração" value={formData.castingTime} onChange={(v: any) => updateField('castingTime', v)} />
                                <InputField label="Alcance" value={formData.range} onChange={(v: any) => updateField('range', v)} />
                                <InputField label="Componentes" value={formData.components} onChange={(v: any) => updateField('components', v)} />
                                <InputField label="Duração" value={formData.duration} onChange={(v: any) => updateField('duration', v)} />
                            </div>
                        )}

                        {registrationType === 'armaduras' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="CA" type="number" value={formData.ac} onChange={(v: any) => updateField('ac', parseInt(v))} required />
                                <InputField label="Tipo" value={formData.armorType} onChange={(v: any) => updateField('armorType', v)} placeholder="Leve, Média, Pesada..." />
                                <InputField label="Max Dex" type="number" value={formData.maxDex} onChange={(v: any) => updateField('maxDex', parseInt(v))} />
                                <InputField label="Força Min" type="number" value={formData.minStr} onChange={(v: any) => updateField('minStr', parseInt(v))} />
                                <div className="flex items-center gap-2"><input type="checkbox" checked={formData.stealthDisadvantage} onChange={e => updateField('stealthDisadvantage', e.target.checked)} id="sd" /><label htmlFor="sd" className="text-xs text-rpg-gold uppercase">Desvantagem Furtividade</label></div>
                            </div>
                        )}

                        {['monsters', 'npcs'].includes(registrationType) && (
                            <>
                                <div className="grid grid-cols-3 gap-2">
                                    <InputField label="HP" type="number" value={formData.hp} onChange={(v: any) => updateField('hp', parseInt(v))} />
                                    <InputField label="CA" type="number" value={formData.ac} onChange={(v: any) => updateField('ac', parseInt(v))} />
                                    <InputField label="CR" value={formData.challenge} onChange={(v: any) => updateField('challenge', v)} />
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black/20 p-3 rounded-lg">
                                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(at => (
                                        <div key={at} className="text-center">
                                            <label className="text-[10px] text-rpg-gold uppercase">{at}</label>
                                            <input type="number" value={formData.attributes?.[at] || 10} onChange={e => updateNestedField('attributes', at, parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded text-center text-xs p-1" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {['armaduras', 'armas', 'escudos', 'itens', 'magias'].includes(registrationType) && (
                            <div className="bg-white/5 p-4 rounded-xl grid grid-cols-2 gap-4">
                                <div><InputField label="Peso (kg)" type="number" value={formData.weight} onChange={(v: any) => updateField('weight', parseFloat(v))} disabled={formData.noWeight} /><div className="flex items-center gap-1 mt-1"><input type="checkbox" checked={formData.noWeight} onChange={e => updateField('noWeight', e.target.checked)} id="nw" /><label htmlFor="nw" className="text-[10px] text-rpg-grey uppercase">Sem Peso</label></div></div>
                                <div><InputField label="Preço (po)" type="number" value={formData.price} onChange={(v: any) => updateField('price', parseFloat(v))} disabled={formData.noPrice} /><div className="flex items-center gap-1 mt-1"><input type="checkbox" checked={formData.noPrice} onChange={e => updateField('noPrice', e.target.checked)} id="np" /><label htmlFor="np" className="text-[10px] text-rpg-grey uppercase">Grátis</label></div></div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-rpg-gold/20 sticky bottom-0 bg-rpg-panel">
                        <button type="submit" className="w-full bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark py-4 rounded-xl font-cinzel font-bold text-lg shadow-glow-gold transition-all">Consagrar no Banco de Dados</button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(218,165,32,0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(218,165,32,0.5); }
            `}</style>
        </div>
    );
}

function InputField({ label, value, onChange, required, type = 'text', placeholder = '', textarea = false, disabled = false }: any) {
    return (
        <div className={disabled ? 'opacity-50' : ''}>
            <label className="block text-xs font-cinzel text-rpg-gold uppercase tracking-widest mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            {textarea ? (
                <textarea value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval h-24 resize-none" />
            ) : (
                <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval" />
            )}
        </div>
    );
}

function MultiSelectField({ label, options, selected, onChange, placeholder }: any) {
    const isS = (o: string) => (selected || []).includes(o);
    const toggle = (o: string) => {
        const cur = Array.isArray(selected) ? selected : [];
        onChange(isS(o) ? cur.filter(x => x !== o) : [...cur, o]);
    };
    return (
        <div className="space-y-2">
            <label className="block text-xs font-cinzel text-rpg-gold uppercase tracking-widest mb-1">{label}</label>
            {placeholder && (selected || []).length === 0 && <p className="text-[10px] text-rpg-grey italic mb-1">{placeholder}</p>}
            <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((o: string) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => toggle(o)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${isS(o)
                                ? 'bg-rpg-gold text-rpg-dark border-rpg-gold shadow-glow-gold'
                                : 'bg-rpg-panel/50 text-rpg-parchment/60 border-white/5 hover:border-rpg-gold/50 hover:text-rpg-parchment'
                            }`}
                    >
                        {o}
                    </button>
                ))}
            </div>
        </div>
    );
}

function sanitizeField(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
}
