'use client';

import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CollectionType = 'magias' | 'armas' | 'itens' | 'monstros' | 'classes' | 'racas';

interface Category {
    id: CollectionType;
    label: string;
    icon: string;
}

const CATEGORIES: Category[] = [
    { id: 'magias', label: 'Magias', icon: '✨' },
    { id: 'armas', label: 'Armas', icon: '⚔️' },
    { id: 'itens', label: 'Equipamentos', icon: '🎒' },
    { id: 'monstros', label: 'Bestiário', icon: '🐉' },
    { id: 'classes', label: 'Classes', icon: '🧙‍♂️' },
    { id: 'racas', label: 'Raças', icon: '🧝' },
];

export default function DatabaseManagementPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<CollectionType>('magias');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [searchQuery, setSearchQuery] = useState('');

    // Redireciona se não for o Mestre (ID específico)
    useEffect(() => {
        if (!isLoading) {
            if (!user || user.uid !== 'cynl59ZjdlgUJbuzs8lkufCWI0W2') {
                router.push('/home');
            }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, activeTab));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao carregar dados:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab]);

    const filteredItems = items.filter(item =>
        (item.name || item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openModal = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            setFormData({ ...item });
        } else {
            setEditingId(null);
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name && !formData.title) return;

        try {
            const dataToSave = {
                ...formData,
                updatedAt: serverTimestamp(),
            };
            delete dataToSave.id;

            if (editingId) {
                await updateDoc(doc(db, activeTab, editingId), dataToSave);
            } else {
                await addDoc(collection(db, activeTab), {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                    ownerId: user?.uid
                });
            }
            setIsModalOpen(false);
            setFormData({});
            setEditingId(null);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar no banco de dados.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
            try {
                await deleteDoc(doc(db, activeTab, id));
            } catch (error) {
                console.error("Erro ao excluir:", error);
            }
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col">
            {/* Header */}
            <header className="bg-rpg-panel p-4 border-b-2 border-rpg-gold/30 backdrop-blur-sm sticky top-0 z-20">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/home')} className="text-rpg-gold hover:text-rpg-gold-light transition-all">
                            <span className="text-2xl">⬅️</span>
                        </button>
                        <h1 className="text-2xl font-cinzel font-bold text-rpg-gold">Banco de Dados Arcano</h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-6 py-2 rounded-lg font-cinzel font-bold shadow-glow-gold transition-all"
                    >
                        + Novo Registro
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-black/20 p-2 rounded-xl border border-white/5">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-cinzel font-bold transition-all ${activeTab === cat.id
                                ? 'bg-rpg-gold text-rpg-dark shadow-glow-gold scale-105'
                                : 'hover:bg-white/10 text-rpg-grey'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder={`Buscar em ${CATEGORIES.find(c => c.id === activeTab)?.label}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-rpg-slate/50 border border-rpg-gold/20 p-4 rounded-xl focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval"
                    />
                </div>

                {/* Content List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center animate-pulse text-rpg-grey font-medieval">
                            Consultando os pergaminhos antigos...
                        </div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-rpg-panel border border-rpg-gold/10 p-5 rounded-2xl hover:border-rpg-gold/40 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(item)} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400">✏️</button>
                                    <button onClick={() => handleDelete(item.id, item.name || item.title)} className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400">🗑️</button>
                                </div>
                                <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">{item.name || item.title}</h3>
                                <p className="text-sm text-rpg-parchment/70 font-medieval line-clamp-3">
                                    {item.description || item.type || (activeTab === 'magias' ? `Círculo ${item.level}` : 'Sem descrição adicional.')}
                                </p>
                                {activeTab === 'monstros' && (
                                    <div className="mt-3 flex gap-3 text-xs font-bold text-rpg-grey">
                                        <span>❤️ {item.hp} HP</span>
                                        <span>🛡️ {item.ac} CA</span>
                                        <span>🎲 CR {item.challenge}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-rpg-grey font-medieval">
                            Nenhum registro encontrado nesta coleção.
                        </div>
                    )}
                </div>
            </main>

            {/* Modal CRUD */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? `Editar ${CATEGORIES.find(c => c.id === activeTab)?.label}` : `Novo ${CATEGORIES.find(c => c.id === activeTab)?.label}`}
            >
                <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        <InputField label="Nome" value={formData.name} onChange={v => updateField('name', v)} required />

                        {activeTab === 'magias' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Nível" type="number" value={formData.level} onChange={v => updateField('level', parseInt(v))} />
                                    <InputField label="Escola" value={formData.school} onChange={v => updateField('school', v)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Tempo" value={formData.castingTime} onChange={v => updateField('castingTime', v)} />
                                    <InputField label="Alcance" value={formData.range} onChange={v => updateField('range', v)} />
                                </div>
                                <InputField label="Descrição" value={formData.description} onChange={v => updateField('description', v)} textarea />
                            </>
                        )}

                        {activeTab === 'armas' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Dano" value={formData.damage} onChange={v => updateField('damage', v)} placeholder="1d8" />
                                    <InputField label="Tipo de Dano" value={formData.damageType} onChange={v => updateField('damageType', v)} />
                                </div>
                                <InputField label="Propriedades" value={formData.properties} onChange={v => updateField('properties', v)} placeholder="Acuidade, Versátil..." />
                            </>
                        )}

                        {activeTab === 'monstros' && (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <InputField label="HP" type="number" value={formData.hp} onChange={v => updateField('hp', parseInt(v))} />
                                    <InputField label="CA" type="number" value={formData.ac} onChange={v => updateField('ac', parseInt(v))} />
                                    <InputField label="CR" value={formData.challenge} onChange={v => updateField('challenge', v)} />
                                </div>
                                <InputField label="Tipo" value={formData.type} onChange={v => updateField('type', v)} placeholder="Aberração, Fera..." />
                                <InputField label="Descrição" value={formData.description} onChange={v => updateField('description', v)} textarea />
                            </>
                        )}

                        {(activeTab === 'itens' || activeTab === 'classes' || activeTab === 'racas') && (
                            <>
                                <InputField label="Descrição" value={formData.description} onChange={v => updateField('description', v)} textarea />
                            </>
                        )}
                    </div>

                    <div className="pt-6 border-t border-rpg-gold/20">
                        <button
                            type="submit"
                            className="w-full bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark py-4 rounded-xl font-cinzel font-bold text-lg shadow-glow-gold transition-all"
                        >
                            Consagrar no Banco de Dados
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(218, 165, 32, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(218, 165, 32, 0.5);
        }
      `}</style>
        </div>
    );
}

function InputField({ label, value, onChange, required, type = 'text', placeholder = '', textarea = false }: any) {
    return (
        <div>
            <label className="block text-xs font-cinzel text-rpg-gold uppercase tracking-widest mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {textarea ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval h-32 resize-none"
                />
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-rpg-gold text-rpg-parchment font-medieval"
                />
            )}
        </div>
    );
}
