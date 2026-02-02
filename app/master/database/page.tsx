'use client';

import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { dndMonsters } from '@/lib/monsters-data';
import { RACES } from '@/lib/races-data'; // Agora disponível
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { firestoreCache } from '@/lib/cache-service';

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

    // Bloquear scroll do body quando o modal estiver aberto
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    // Redireciona se não for o Mestre (ID específico)
    useEffect(() => {
        if (!isLoading) {
            if (!user || user.uid !== 'cynl59ZjdlgUJbuzs8lkufCWI0W2') {
                router.push('/home');
            }
        }
    }, [user, isLoading, router]);

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
            // Define a coleção base para cada aba
            let collectionName = activeTab;
            if (activeTab === 'escudos' || activeTab === 'armas' || activeTab === 'armaduras' || activeTab === 'itens') {
                collectionName = 'itens';
            }
            if (activeTab === 'monsters') collectionName = 'monsters';
            if (activeTab === 'npcs') collectionName = 'npcs';
            if (activeTab === 'races') collectionName = 'races';
            try {
                const q = query(collection(db, collectionName));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => {
                    const docData = { id: doc.id, ...doc.data() };
                    if (activeTab === 'monsters' || activeTab === 'races' || activeTab === 'npcs') {
                        console.log('Doc:', docData);
                    }
                    return docData;
                });
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
        // Sempre recarrega do banco ao salvar/editar
        setDuplicateWarning(null);
        setDuplicateItem(null);
        if (item) {
            setEditingId(item.id);
            setInitialCollection(activeTab);
            setRegistrationType(activeTab);
            setFormData({
                ...item,
                requirements: item.requirements || { level: 0, classes: '', races: '' },
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
                requirements: { level: 0, classes: '', races: '' },
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

        // Validação de duplicidade por tradução (name ou title)
        const translation = (formData.translation || '').trim().toLowerCase();
        const nameToCheck = (formData.name || formData.title || '').trim().toLowerCase();
        let duplicate = null;
        if (translation) {
            duplicate = items.find(item =>
                (item.translation || '').trim().toLowerCase() === translation &&
                (!editingId || item.id !== editingId)
            );
        } else if (nameToCheck) {
            duplicate = items.find(item =>
                ((item.translation || item.name || item.title || '').trim().toLowerCase() === nameToCheck) &&
                (!editingId || item.id !== editingId)
            );
        }
        if (duplicate) {
            setDuplicateWarning('Já existe um registro com a mesma tradução ou nome. Deseja sobrescrever ou cancelar?');
            setDuplicateItem(duplicate);
            return;
        }

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
            // Limpa cache global para forçar reload
            firestoreCache.invalidate(registrationType);
            setForceReload(true);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar no banco de dados.");
        }
    };

    // Ação para sobrescrever duplicata
    const handleOverwriteDuplicate = async () => {
        if (!duplicateItem) return;
        try {
            const dataToSave = {
                ...formData,
                updatedAt: serverTimestamp(),
            };
            let targetCollection = registrationType;
            if (
                registrationType === 'escudos' ||
                registrationType === 'armas' ||
                registrationType === 'armaduras' ||
                registrationType === 'itens'
            ) {
                targetCollection = 'itens';
            }
            await updateDoc(doc(db, targetCollection, duplicateItem.id), dataToSave);
            setIsModalOpen(false);
            setFormData({});
            setEditingId(null);
            setDuplicateWarning(null);
            setDuplicateItem(null);
            // Limpa cache global para forçar reload
            firestoreCache.invalidate(registrationType);
            setForceReload(true);
        } catch (error) {
            console.error("Erro ao sobrescrever duplicata:", error);
            alert("Erro ao sobrescrever duplicata.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
            try {
                await deleteDoc(doc(db, activeTab, id));
                // Limpa cache global para forçar reload
                firestoreCache.invalidate(activeTab);
                setForceReload(true);
            } catch (error) {
                console.error("Erro ao excluir:", error);
            }
        }
    };

    // Função de migração de magias
    const handleMigrateSpells = async () => {
        if (!confirm('🔄 Migrar campo "classes" das magias do código para o Firestore?\n\nIsso vai atualizar as magias que não têm o campo classes.')) {
            return;
        }

        setIsMigrating(true);
        setMigrationLog(['🚀 Iniciando migração...']);

        try {
            // Magias do código com classes
            const { spellsDatabase } = await import('@/lib/spells-data');

            const log: string[] = ['📥 Buscando magias do Firestore...'];
            setMigrationLog([...log]);

            // Buscar magias do Firestore
            const snapshot = await getDocs(collection(db, 'magias'));
            const firestoreMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const key = data.name?.toLowerCase().trim();
                if (key) firestoreMap.set(key, { id: doc.id, ...data });
            });

            log.push(`✅ ${firestoreMap.size} magias encontradas`);
            log.push('🔄 Processando...');
            setMigrationLog([...log]);

            let updated = 0;
            let skipped = 0;
            let notFound = 0;

            for (const spell of spellsDatabase) {
                const key = spell.name.toLowerCase().trim();
                const existing = firestoreMap.get(key);

                if (!existing) {
                    log.push(`⚠️ Não encontrado: ${spell.name}`);
                    notFound++;
                    continue;
                }

                const hasClasses = existing.classes && Array.isArray(existing.classes) && existing.classes.length > 0;
                if (hasClasses) {
                    skipped++;
                    continue;
                }

                await updateDoc(doc(db, 'magias', existing.id), {
                    classes: spell.classes
                });

                log.push(`✅ ${spell.name} → [${spell.classes.join(', ')}]`);
                updated++;
                setMigrationLog([...log]);
            }

            log.push('');
            log.push('📊 RESUMO:');
            log.push(`✅ Atualizadas: ${updated}`);
            log.push(`⏭️ Puladas: ${skipped}`);
            log.push(`⚠️ Não encontradas: ${notFound}`);
            log.push('');
            log.push('🎉 Migração concluída!');
            setMigrationLog([...log]);

            // Limpar cache e recarregar
            firestoreCache.invalidate('magias');
            setForceReload(true);

        } catch (error) {
            console.error('Erro na migração:', error);
            setMigrationLog(prev => [...prev, '', '❌ Erro: ' + String(error)]);
        } finally {
            setIsMigrating(false);
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
                <div className="flex justify-between items-center mb-4 gap-4">
                    {/* Botão de Migração de Magias */}
                    {activeTab === 'magias' && (
                        <button
                            onClick={handleMigrateSpells}
                            disabled={isMigrating}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-cinzel font-bold shadow-lg transition-all flex items-center gap-2"
                            title="Migrar campo 'classes' das magias do código para o Firestore"
                        >
                            {isMigrating ? (
                                <>
                                    <span className="animate-spin">⚙️</span>
                                    Migrando...
                                </>
                            ) : (
                                <>
                                    🔄 Migrar Classes
                                </>
                            )}
                        </button>
                    )}

                    <div className="flex-grow"></div>

                    {/* Botão Atualizar */}
                    <button
                        onClick={() => setForceReload(true)}
                        className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-4 py-2 rounded-lg font-cinzel font-bold shadow-glow-gold transition-all"
                        title="Atualizar dados do banco"
                    >
                        🔄 Atualizar
                    </button>
                </div>

                {/* Log de Migração */}
                {migrationLog.length > 0 && (
                    <div className="mb-4 bg-black/40 border border-purple-500/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <h3 className="text-purple-400 font-bold mb-2">📋 Log de Migração:</h3>
                        {migrationLog.map((line, i) => (
                            <div key={i} className="text-sm text-rpg-parchment/80 font-mono">
                                {line}
                            </div>
                        ))}
                    </div>
                )}
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
                        filteredItems.map(item => {
                            // Validação de campos obrigatórios e descrição genérica
                            let faltando = false;
                            // Nome/título e descrição são sempre obrigatórios
                            if (!item.name && !item.title) faltando = true;
                            if (!item.description || (typeof item.description === 'string' && item.description.trim() === '')) faltando = true;
                            // Descrição genérica
                            const desc = (item.description || '').toLowerCase();
                            if (desc.includes('no mundo de d&d') || desc.includes('descrição') || desc.length < 10) faltando = true;

                            // Campos extras por tipo
                            if (["magias", "armas", "armaduras", "escudos", "itens"].includes(activeTab)) {
                                // Peso
                                if (!item.noWeight && (item.weight === undefined || item.weight === '' || item.weight === null)) faltando = true;
                                // Preço
                                if (!item.noPrice && (item.price === undefined || item.price === '' || item.price === null)) faltando = true;
                                // Fabricação (apenas para magias)
                                if (activeTab === 'magias' && !item.noFabrication && (item.fabrication === undefined || item.fabrication === '' || item.fabrication === null)) faltando = true;
                            }

                            // Não exigir requisitos (nível, classes, raças) para exibição geral

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-rpg-panel border p-5 rounded-2xl transition-all group relative overflow-hidden ${faltando ? 'border-red-600 shadow-glow-red animate-pulse' : 'border-rpg-gold/10 hover:border-rpg-gold/40'}`}
                                >
                                    <div className="absolute top-0 right-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(item)} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400">✏️</button>
                                        <button onClick={() => handleDelete(item.id, item.name || item.title)} className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-400">🗑️</button>
                                    </div>
                                    <h3 className="text-xl font-bold font-cinzel text-rpg-gold mb-2">{sanitizeField(item.name) || sanitizeField(item.title)}</h3>
                                    <p className={`text-sm font-medieval line-clamp-3 ${faltando ? 'text-red-400 font-bold' : 'text-rpg-parchment/70'}`}>
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
                                    {faltando && (
                                        <div className="mt-2 text-xs text-red-500 font-bold">⚠️ Registro incompleto ou genérico</div>
                                    )}
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
                            );
                        })
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
                {duplicateWarning && (
                    <div className="bg-red-900/80 border border-red-500 text-red-200 p-4 rounded-xl mb-4 flex flex-col gap-2">
                        <span className="font-bold">{duplicateWarning}</span>
                        <div className="flex gap-2">
                            <button type="button" onClick={handleOverwriteDuplicate} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold">Sobrescrever</button>
                            <button type="button" onClick={() => { setDuplicateWarning(null); setDuplicateItem(null); }} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold">Cancelar</button>
                        </div>
                    </div>
                )}
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
                        <InputField label="Nome / Título" value={formData.name || formData.title} onChange={(v: any) => updateField('name', v)} required />
                        <InputField label="Descrição Geral" value={formData.description} onChange={(v: any) => updateField('description', v)} textarea />

                        {/* Campos de Requisitos (Geral) */}
                        {registrationType !== 'monsters' && registrationType !== 'races' && (
                            <div className="bg-white/5 p-4 rounded-xl space-y-4 border border-white/5">
                                <h4 className="text-xs font-cinzel text-rpg-gold/60 uppercase tracking-widest">Requisitos e Restrições</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="Nível Mínimo" type="number" value={formData.requirements?.level} onChange={(v: any) => updateNestedField('requirements', 'level', parseInt(v))} />
                                    <InputField label="Classes Permitidas" value={formData.requirements?.classes} onChange={(v: any) => updateNestedField('requirements', 'classes', v)} placeholder="Guerreiro, Mago..." />
                                </div>
                                <InputField label="Raças Permitidas" value={formData.requirements?.races} onChange={(v: any) => updateNestedField('requirements', 'races', v)} placeholder="Elfo, Anão... (Vazio para todas)" />
                            </div>
                        )}

                        {/* Magias */}
                        {registrationType === 'magias' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputField label="Círculo (Nível)" type="number" value={formData.level} onChange={(v: any) => updateField('level', parseInt(v))} required />
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="isCantrip"
                                            checked={formData.level === 0}
                                            onChange={(e) => updateField('level', e.target.checked ? 0 : 1)}
                                            className="w-4 h-4 rounded border-gray-300 text-rpg-gold focus:ring-rpg-gold"
                                        />
                                        <label htmlFor="isCantrip" className="text-xs font-cinzel text-rpg-gold cursor-pointer">É um Truque (Nível 0)</label>
                                    </div>
                                </div>
                                <InputField label="Escola" value={formData.school} onChange={(v: any) => updateField('school', v)} placeholder="Evocação, Necromancia..." required />
                                <InputField label="Tempo de Conjuração" value={formData.castingTime} onChange={(v: any) => updateField('castingTime', v)} placeholder="1 ação, 10 minutos..." required />
                                <InputField label="Alcance" value={formData.range} onChange={(v: any) => updateField('range', v)} placeholder="9 metros, Toque..." required />
                                <InputField label="Componentes" value={formData.components} onChange={(v: any) => updateField('components', v)} placeholder="V, S, M (ouro)..." required />
                                <InputField label="Duração" value={formData.duration} onChange={(v: any) => updateField('duration', v)} placeholder="Instantânea, 1 hora..." required />
                            </div>
                        )}

                        {/* Armaduras */}
                        {registrationType === 'armaduras' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="Tipo de Armadura" value={formData.armorType} onChange={(v: any) => updateField('armorType', v)} placeholder="Leve, Média, Pesada..." required />
                                <InputField label="Classe de Armadura (CA)" type="number" value={formData.ac} onChange={(v: any) => updateField('ac', parseInt(v))} required />
                                <InputField label="Bônus de Destreza Máximo" type="number" value={formData.maxDex} onChange={(v: any) => updateField('maxDex', parseInt(v))} placeholder="Deixe vazio para ilimitado" />
                                <InputField label="Força Mínima" type="number" value={formData.minStr} onChange={(v: any) => updateField('minStr', parseInt(v))} placeholder="0 para nenhuma" />

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.stealthDisadvantage || false}
                                        onChange={e => updateField('stealthDisadvantage', e.target.checked)}
                                        id="stealthDisadvantage"
                                        className="w-4 h-4 rounded border-gray-300 text-rpg-gold focus:ring-rpg-gold"
                                    />
                                    <label htmlFor="stealthDisadvantage" className="text-sm font-cinzel text-rpg-gold">Desvantagem em Furtividade</label>
                                </div>
                            </div>
                        )}

                        {/* Atributos (Monstros/NPCs) */}
                        {(registrationType === 'monsters' || registrationType === 'npcs') && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="HP" type="number" value={formData.hp} onChange={(v: any) => updateField('hp', parseInt(v))} />
                                    <InputField label="CA" type="number" value={formData.ac} onChange={(v: any) => updateField('ac', parseInt(v))} />
                                    <InputField label="CR (Desafio)" type="number" value={formData.challenge} onChange={(v: any) => updateField('challenge', v)} />
                                    <InputField label="Tipo de Criatura" value={formData.type} onChange={(v: any) => updateField('type', v)} placeholder="Morto-vivo, Humanoide..." />
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-xs font-cinzel text-rpg-gold/60 uppercase tracking-widest mb-4 text-center">Atributos Primários</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        <MiniInputField label="FOR" value={formData.attributes?.str} onChange={(v: any) => updateNestedField('attributes', 'str', parseInt(v))} />
                                        <MiniInputField label="DES" value={formData.attributes?.dex} onChange={(v: any) => updateNestedField('attributes', 'dex', parseInt(v))} />
                                        <MiniInputField label="CON" value={formData.attributes?.con} onChange={(v: any) => updateNestedField('attributes', 'con', parseInt(v))} />
                                        <MiniInputField label="INT" value={formData.attributes?.int} onChange={(v: any) => updateNestedField('attributes', 'int', parseInt(v))} />
                                        <MiniInputField label="SAB" value={formData.attributes?.wis} onChange={(v: any) => updateNestedField('attributes', 'wis', parseInt(v))} />
                                        <MiniInputField label="CAR" value={formData.attributes?.cha} onChange={(v: any) => updateNestedField('attributes', 'cha', parseInt(v))} />
                                    </div>
                                </div>
                                <InputField label="Ações e Habilidades Especiais" value={formData.actions} onChange={(v: any) => updateField('actions', v)} textarea placeholder="Resistência Lendária, Mordida (2d6)..." />
                            </>
                        )}

                        {/* Campos de Itens/Equipamentos (Preço, Peso, Fabricação) */}
                        {['armaduras', 'armas', 'escudos', 'itens', 'magias'].includes(registrationType) && (
                            <div className="bg-white/5 p-4 rounded-xl space-y-4 border border-white/5">
                                <h4 className="text-xs font-cinzel text-rpg-gold/60 uppercase tracking-widest">Informações Adicionais</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <InputField label="Preço (po)" type="number" value={formData.price} onChange={(v: any) => updateField('price', parseFloat(v))} disabled={formData.noPrice} />
                                        <div className="flex items-center gap-2 mt-2">
                                            <input type="checkbox" checked={formData.noPrice} onChange={e => updateField('noPrice', e.target.checked)} id="noPrice" />
                                            <label htmlFor="noPrice" className="text-xs text-rpg-grey">Grátis / Sem preço</label>
                                        </div>
                                    </div>
                                    <div>
                                        <InputField label="Peso (kg)" type="number" value={formData.weight} onChange={(v: any) => updateField('weight', parseFloat(v))} disabled={formData.noWeight} />
                                        <div className="flex items-center gap-2 mt-2">
                                            <input type="checkbox" checked={formData.noWeight} onChange={e => updateField('noWeight', e.target.checked)} id="noWeight" />
                                            <label htmlFor="noWeight" className="text-xs text-rpg-grey">Sem peso / Insignificante</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <InputField label="Requisitos de Fabricação" value={formData.fabrication} onChange={(v: any) => updateField('fabrication', v)} placeholder="Materiais, tempo, perícia..." disabled={formData.noFabrication} />
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" checked={formData.noFabrication} onChange={e => updateField('noFabrication', e.target.checked)} id="noFabrication" />
                                        <label htmlFor="noFabrication" className="text-xs text-rpg-grey">Não requer fabricação</label>
                                    </div>
                                </div>
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
        </div >
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
        if (typeof val.type === 'string') return val.type;
        if (typeof val.name === 'string') return val.name;
        if (typeof val.value === 'string') return val.value;
        return JSON.stringify(val);
    }
    return String(val);
}
