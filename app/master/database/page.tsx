'use client';

import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { dndMonsters } from '@/lib/monsters-data';
import { RACES } from '@/lib/races-data'; // Agora disponível
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CollectionType = 'magias' | 'armas' | 'itens' | 'armaduras' | 'escudos' | 'monsters' | 'npcs' | 'classes' | 'races';

interface Category {
    id: CollectionType;
    label: string;
    icon: string;
}

const CATEGORIES: Category[] = [
    { id: 'magias', label: 'Magias', icon: '✨' },
    { id: 'armas', label: 'Armas', icon: '⚔️' },
    { id: 'escudos', label: 'Escudos', icon: '🛡️' },
    { id: 'itens', label: 'Equipamentos', icon: '🎒' },
    { id: 'monsters', label: 'Bestiário', icon: '🐉' },
    { id: 'npcs', label: 'NPCs', icon: '🧑‍🌾' },
    { id: 'classes', label: 'Classes', icon: '🧙‍♂️' },
    { id: 'races', label: 'Raças', icon: '🧝' },
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
    const [initialCollection, setInitialCollection] = useState<CollectionType | null>(null);
    const [registrationType, setRegistrationType] = useState<CollectionType>('magias');
    const [formData, setFormData] = useState<any>({});
    const [searchQuery, setSearchQuery] = useState('');

    // Redireciona se não for o Mestre (ID específico)
    useEffect(() => {
        if (!isLoading) {
            if (!user || user.uid !== 'WR0168EySccvAQXnvPoozEEpb1u2') {
                router.push('/home');
            }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        // Limpa lista e ativa loading ao trocar de aba
        setItems([]);
        setIsLoading(true);
        // Define a coleção base para cada aba
        let collectionName = activeTab;
        if (activeTab === 'escudos' || activeTab === 'armas' || activeTab === 'armaduras' || activeTab === 'itens') {
            collectionName = 'itens';
        }
        // Corrige nomes para coleções monsters/races/npcs
        if (activeTab === 'monsters') {
            collectionName = 'monsters';
        }
        if (activeTab === 'npcs') {
            collectionName = 'npcs';
        }
        if (activeTab === 'races') {
            collectionName = 'races';
        }
        const q = query(collection(db, collectionName));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = { id: doc.id, ...doc.data() };
                // Debug: logar todos os campos do documento
                if (activeTab === 'monsters' || activeTab === 'races' || activeTab === 'npcs') {
                    console.log('Doc:', docData);
                }
                return docData;
            });
            setItems(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao carregar dados:", error);
            setItems([]);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [activeTab]);

    // Filtro por aba (aplicado após buscar os dados da coleção base)
    let filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;
        const search = searchQuery.toLowerCase();
        // Para monstros, raças e npcs, busca em múltiplos campos
        const nameFields = [item.name, item.title, item.originalName, item.nameLower, item.originalNameLower, item.race, item.raceName, item.npcName, item.npcType];
        return nameFields.filter(Boolean).some(field => String(field).toLowerCase().includes(search));
    });

    // Filtros específicos para cada aba de item
    if (activeTab === 'escudos') {
        filteredItems = filteredItems.filter(item => {
            const type = (item.itemType || '').toUpperCase();
            return type === 'ESCUDO' || type === 'SHIELD';
        });
    }
    if (activeTab === 'armas') {
        filteredItems = filteredItems.filter(item => {
            const type = (item.itemType || '').toUpperCase();
            return type === 'ARMA' || type === 'WEAPON';
        });
    }
    if (activeTab === 'armaduras') {
        filteredItems = filteredItems.filter(item => {
            const type = (item.itemType || '').toUpperCase();
            return type === 'ARMADURA' || type === 'ARMOR';
        });
    }
    if (activeTab === 'itens') {
        filteredItems = filteredItems.filter(item => {
            const type = (item.itemType || '').toUpperCase();
            return type !== 'ESCUDO' && type !== 'SHIELD' && type !== 'ARMA' && type !== 'WEAPON' && type !== 'ARMADURA' && type !== 'ARMOR';
        });
    }

    const openModal = (item?: any) => {
        if (item) {
            setEditingId(item.id);
            setInitialCollection(activeTab);
            setRegistrationType(activeTab);
            setFormData({
                ...item,
                requirements: item.requirements || { level: 0, classes: '', races: '' },
                attributes: item.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
            });
        } else {
            setEditingId(null);
            setInitialCollection(null);
            setRegistrationType(activeTab);
            setFormData({
                name: '',
                description: '',
                requirements: { level: 0, classes: '', races: '' },
                attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
            });
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
            // Corrigir coleção alvo para escudos, armas, armaduras e itens
            let targetCollection = registrationType;
            if (
                registrationType === 'escudos' ||
                registrationType === 'armas' ||
                registrationType === 'armaduras' ||
                registrationType === 'itens'
            ) {
                targetCollection = 'itens';
            }

            // Se estiver editando e mudar a coleção, deleta o antigo e cria novo
            if (editingId && initialCollection && initialCollection !== targetCollection) {
                await deleteDoc(doc(db, initialCollection, editingId));
                delete dataToSave.id;
                await addDoc(collection(db, targetCollection), {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                    ownerId: user?.uid
                });
            } else if (editingId) {
                const docId = editingId;
                delete dataToSave.id;
                await updateDoc(doc(db, targetCollection, docId), dataToSave);
            } else {
                await addDoc(collection(db, targetCollection), {
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

    const updateNestedField = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openModal()}
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-6 py-2 rounded-lg font-cinzel font-bold shadow-glow-gold transition-all"
                        >
                            + Novo Registro
                        </button>
                    </div>
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
                                <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">{sanitizeField(item.name) || sanitizeField(item.title)}</h3>
                                <p className="text-sm text-rpg-parchment/70 font-medieval line-clamp-3">
                                    {(() => {
                                        if (typeof item.description === 'string') return item.description;
                                        if (item.description && typeof item.description === 'object') {
                                            if (Array.isArray(item.description)) return item.description.join(', ');
                                            return JSON.stringify(item.description);
                                        }
                                        if (typeof item.type === 'string') return item.type;
                                        if (item.type && typeof item.type === 'object') {
                                            if (Array.isArray(item.type)) return item.type.join(', ');
                                            if (item.type.type && typeof item.type.type === 'string') return item.type.type;
                                            return JSON.stringify(item.type);
                                        }
                                        if (activeTab === 'magias') return `Círculo ${sanitizeField(item.level)}`;
                                        return 'Sem descrição adicional.';
                                    })()}
                                </p>
                                {(activeTab === 'monsters' || activeTab === 'npcs') && (
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-rpg-grey">
                                        <span>❤️ {sanitizeField(item.hp) ?? '-'} HP</span>
                                        <span>🛡️ {sanitizeField(item.ac) ?? '-'} CA</span>
                                        <span>🎲 CR {sanitizeField(item.challenge) ?? '-'}</span>
                                        {item.type && <span>🧬 {sanitizeField(item.type)}</span>}
                                        {item.npcType && <span>👤 {sanitizeField(item.npcType)}</span>}
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
                title={editingId ? `Editar Registro` : `Novo Registro Arcano`}
            >
                <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                    {/* Seletor de Tipo Dinâmico */}
                    <div className="bg-black/30 p-4 rounded-xl border border-rpg-gold/20">
                        <label className="block text-xs font-cinzel text-rpg-gold uppercase tracking-widest mb-3">Tipo de Registro</label>
                        <select
                            value={registrationType}
                            onChange={(e) => setRegistrationType(e.target.value as CollectionType)}
                            className="w-full bg-rpg-dark border border-white/10 p-3 rounded-lg text-rpg-parchment font-cinzel focus:outline-none focus:border-rpg-gold"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <InputField label="Nome / Título" value={formData.name || formData.title} onChange={v => updateField('name', v)} required />
                        <InputField label="Descrição Geral" value={formData.description} onChange={v => updateField('description', v)} textarea />

                        {/* Campos de Requisitos (Geral) */}
                        {registrationType !== 'monsters' && registrationType !== 'races' && (
                            <div className="bg-white/5 p-4 rounded-xl space-y-4 border border-white/5">
                                <h4 className="text-xs font-cinzel text-rpg-gold/60 uppercase tracking-widest">Requisitos e Restrições</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Nível Mínimo" type="number" value={formData.requirements?.level} onChange={v => updateNestedField('requirements', 'level', parseInt(v))} />
                                    <InputField label="Classes Permitidas" value={formData.requirements?.classes} onChange={v => updateNestedField('requirements', 'classes', v)} placeholder="Guerreiro, Mago..." />
                                </div>
                                <InputField label="Raças Permitidas" value={formData.requirements?.races} onChange={v => updateNestedField('requirements', 'races', v)} placeholder="Elfo, Anão... (Vazio para todas)" />
                            </div>
                        )}

                        {/* Magias */}
                        {registrationType === 'magias' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Círculo (Nível)" type="number" value={formData.level} onChange={v => updateField('level', parseInt(v))} />
                                <InputField label="Escola" value={formData.school} onChange={v => updateField('school', v)} placeholder="Evocação, Necromancia..." />
                                <InputField label="Tempo de Conjuração" value={formData.castingTime} onChange={v => updateField('castingTime', v)} placeholder="1 ação, 10 minutos..." />
                                <InputField label="Alcance" value={formData.range} onChange={v => updateField('range', v)} placeholder="9 metros, Toque..." />
                                <InputField label="Componentes" value={formData.components} onChange={v => updateField('components', v)} placeholder="V, S, M (ouro)..." />
                                <InputField label="Duração" value={formData.duration} onChange={v => updateField('duration', v)} placeholder="Instantânea, 1 hora..." />
                            </div>
                        )}

                        {/* Armas */}
                        {registrationType === 'armas' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Dano" value={formData.damage} onChange={v => updateField('damage', v)} placeholder="1d8 + FOR" />
                                <InputField label="Tipo de Dano" value={formData.damageType} onChange={v => updateField('damageType', v)} placeholder="Cortante, Impacto..." />
                                <InputField label="Peso (kg)" value={formData.weight} onChange={v => updateField('weight', v)} placeholder="1.5" />
                                <InputField label="Categoria" value={formData.category} onChange={v => updateField('category', v)} placeholder="Simples, Marcial..." />
                                <div className="sm:col-span-2">
                                    <InputField label="Propriedades" value={formData.properties} onChange={v => updateField('properties', v)} placeholder="Acuidade, Versátil, Arremesso..." />
                                </div>
                            </div>
                        )}

                        {/* Escudos */}
                        {registrationType === 'escudos' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Bônus na CA" type="number" value={formData.armorClass} onChange={v => updateField('armorClass', parseInt(v))} placeholder="2" />
                                <InputField label="Peso (kg)" value={formData.weight} onChange={v => updateField('weight', v)} placeholder="3.0" />
                                <div className="sm:col-span-2">
                                    <InputField label="Propriedades Especiais" value={formData.properties} onChange={v => updateField('properties', v)} placeholder="Escudo de Madeira, Resistência a Fogo..." />
                                </div>
                            </div>
                        )}

                        {/* Bestiário (Monstros) */}
                        {registrationType === 'monsters' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <InputField label="Pontos de Vida (HP)" type="number" value={formData.hp} onChange={v => updateField('hp', parseInt(v))} />
                                    <InputField label="Classe de Armadura (CA)" type="number" value={formData.ac} onChange={v => updateField('ac', parseInt(v))} />
                                    <InputField label="ND (Challenge Rating)" value={formData.challenge} onChange={v => updateField('challenge', v)} placeholder="1/4, 5, 20..." />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Tipo" value={formData.type} onChange={v => updateField('type', v)} placeholder="Morto-vivo, Aberração..." />
                                    <InputField label="Velocidade" value={formData.speed} onChange={v => updateField('speed', v)} placeholder="9m, voo 18m..." />
                                </div>

                                {/* Atributos do Monstro */}
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-xs font-cinzel text-rpg-gold/60 uppercase tracking-widest mb-4 text-center">Atributos Primários</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        <MiniInputField label="FOR" value={formData.attributes?.str} onChange={v => updateNestedField('attributes', 'str', parseInt(v))} />
                                        <MiniInputField label="DES" value={formData.attributes?.dex} onChange={v => updateNestedField('attributes', 'dex', parseInt(v))} />
                                        <MiniInputField label="CON" value={formData.attributes?.con} onChange={v => updateNestedField('attributes', 'con', parseInt(v))} />
                                        <MiniInputField label="INT" value={formData.attributes?.int} onChange={v => updateNestedField('attributes', 'int', parseInt(v))} />
                                        <MiniInputField label="SAB" value={formData.attributes?.wis} onChange={v => updateNestedField('attributes', 'wis', parseInt(v))} />
                                        <MiniInputField label="CAR" value={formData.attributes?.cha} onChange={v => updateNestedField('attributes', 'cha', parseInt(v))} />
                                    </div>
                                </div>

                                <InputField label="Ações e Habilidades Especiais" value={formData.actions} onChange={v => updateField('actions', v)} textarea placeholder="Resistência Lendária, Mordida (2d6)..." />
                            </>
                        )}

                        {/* Outros Equipamentos */}
                        {registrationType === 'itens' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Peso (kg)" value={formData.weight} onChange={v => updateField('weight', v)} />
                                <InputField label="Custo (PO)" value={formData.value} onChange={v => updateField('value', v)} />
                                <InputField label="Raridade" value={formData.rarity} onChange={v => updateField('rarity', v)} placeholder="Comum, Raro, Lendário..." />
                                <InputField label="Tipo de Item" value={formData.itemType} onChange={v => updateField('itemType', v)} placeholder="Poção, Armadura, Ferramenta..." />
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-rpg-gold/20 sticky bottom-0 bg-rpg-panel">
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

function MiniInputField({ label, value, onChange }: any) {
    return (
        <div className="flex flex-col items-center">
            <label className="text-[10px] font-bold text-rpg-grey mb-1">{label}</label>
            <input
                type="number"
                value={value || 10}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-2 rounded text-center text-sm text-rpg-parchment focus:border-rpg-gold focus:outline-none"
            />
        </div>
    );
}

// Função utilitária para garantir que só strings/números sejam renderizados
function sanitizeField(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(sanitizeField).join(', ');
    if (typeof val === 'object') {
        // Se for um objeto com campo 'type' string, retorna ele
        if (typeof val.type === 'string') return val.type;
        // Se for objeto simples, retorna JSON
        return JSON.stringify(val);
    }
    return '';
}
