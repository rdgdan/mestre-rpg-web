'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    addDoc,
    orderBy
} from 'firebase/firestore';
import Modal from '@/components/Modal';

interface EncounterListItem {
    id: string;
    title: string;
    combatants: any[];
    createdAt: any;
    lastUpdate?: string;
}

export default function ConfrontosLobbyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newEncounterTitle, setNewEncounterTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; encounterId: string | null; encounterTitle: string | null }>({ open: false, encounterId: null, encounterTitle: null });

    // Proteção de rota
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Carregar encontros
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'encounters'),
            where('ownerId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as EncounterListItem[];
            setEncounters(list);
            setLoading(false);
        }, (err) => {
            console.error("Erro ao carregar encontros:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCreateEncounter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newEncounterTitle.trim()) return;

        setIsCreating(true);
        try {
            const docRef = await addDoc(collection(db, 'encounters'), {
                title: newEncounterTitle.trim(),
                ownerId: user.uid,
                combatants: [],
                phase: 'preparation',
                round: 1,
                turnIndex: 0,
                createdAt: new Date().toISOString()
            });

            router.push(`/confrontos/${docRef.id}`);
        } catch (err) {
            console.error("Erro ao criar encontro:", err);
            alert("Erro ao criar encontro. Tente novamente.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteEncounter = async (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setConfirmDeleteModal({ open: true, encounterId: id, encounterTitle: title });
    };

    const executeDeleteEncounter = async () => {
        if (!confirmDeleteModal.encounterId) return;
        try {
            await deleteDoc(doc(db, 'encounters', confirmDeleteModal.encounterId));
            await deleteDoc(doc(db, 'arenas_online', confirmDeleteModal.encounterId));
            setConfirmDeleteModal({ open: false, encounterId: null, encounterTitle: null });
        } catch (err) {
            console.error("Erro ao deletar:", err);
            alert("Erro ao excluir encontro.");
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-rpg-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-rpg-gold font-cinzel animate-pulse">Abrindo Biblioteca de Crônicas...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] flex flex-col font-lato">

            {/* HEADER */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-30 backdrop-blur-md">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-gold hover:text-rpg-gold-light transition-all text-2xl" title="Página Inicial">🏰</Link>
                        <div>
                            <h1 className="text-2xl font-bold font-cinzel text-rpg-gold text-shadow-md">Sala de Confrontos</h1>
                            <p className="text-[10px] text-rpg-grey uppercase tracking-widest leading-none">Gerencie suas batalhas épicas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-rpg-gold hover:bg-rpg-gold-light text-rpg-dark px-6 py-2 rounded font-bold font-cinzel text-sm shadow-glow-gold/20 transition-all hover:scale-105 active:scale-95"
                        >
                            + Novo Confronto
                        </button>
                        <Link
                            href="/"
                            className="text-rpg-grey hover:text-white font-medieval text-sm flex items-center gap-2 px-3 py-2 border border-white/5 rounded hover:bg-white/5 transition-all"
                        >
                            <span>&larr;</span> Sair
                        </Link>
                    </div>
                </div>
            </header>

            {/* CONTENT */}
            <main className="container mx-auto p-4 sm:p-8 flex-grow">
                {encounters.length === 0 ? (
                    <div className="max-w-xl mx-auto mt-20 text-center p-12 bg-rpg-panel border border-dashed border-rpg-gold/30 rounded-3xl backdrop-blur-sm">
                        <div className="text-6xl mb-6 opacity-30">🏹</div>
                        <h2 className="text-2xl font-cinzel text-rpg-gold mb-4">Sua Arena está Silenciosa</h2>
                        <p className="text-rpg-grey mb-10 leading-relaxed font-medieval text-lg">
                            Parece que não há batalhas agendadas. Que tal dar início a uma nova lenda hoje?
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-rpg-gold text-rpg-dark px-10 py-4 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-glow-gold/20 active:scale-95 flex items-center gap-3 mx-auto"
                        >
                            <span>⚔️</span> CRIAR PRIMEIRO CONFRONTO
                        </button>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {encounters.map((enc) => (
                            <Link
                                key={enc.id}
                                href={`/confrontos/${enc.id}`}
                                className="group relative bg-rpg-panel border border-rpg-gold/10 rounded-2xl p-6 hover:border-rpg-gold/40 transition-all hover:shadow-glow-gold/5 flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-rpg-dark/50 p-3 rounded-xl border border-rpg-gold/20 group-hover:border-rpg-gold/50 transition-colors">
                                        <span className="text-2xl">⚔️</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteEncounter(enc.id, enc.title, e)}
                                        className="text-red-500/50 hover:text-red-500 p-2 transition-all"
                                        title="Excluir Confronto"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold font-cinzel text-rpg-parchment group-hover:text-rpg-gold transition-colors mb-2">
                                    {enc.title}
                                </h3>
                                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-rpg-grey">
                                    <span>{enc.combatants?.length || 0} Combatentes</span>
                                    <span>{new Date(enc.createdAt).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* CREATE MODAL */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Novo Confronto"
            >
                <form onSubmit={handleCreateEncounter} className="space-y-6">
                    <div>
                        <label className="block text-rpg-gold text-[10px] font-bold mb-2 font-cinzel tracking-widest uppercase">
                            Nome do Encontro
                        </label>
                        <input
                            type="text"
                            autoFocus
                            required
                            value={newEncounterTitle}
                            onChange={(e) => setNewEncounterTitle(e.target.value)}
                            placeholder="Ex: Emboscada na Floresta, A Tumba Antiga..."
                            className="w-full bg-rpg-dark border border-rpg-gold/30 rounded-xl p-4 text-rpg-parchment outline-none focus:border-rpg-gold shadow-inner"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-6 py-2 text-rpg-grey hover:text-white font-cinzel tracking-widest text-xs"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="bg-rpg-gold text-rpg-dark px-8 py-2 rounded-xl font-bold font-cinzel hover:bg-rpg-gold-light transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isCreating ? 'CRIANDO...' : 'INICIAR AVENTURA'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* DELETE MODAL */}
            <Modal
                isOpen={confirmDeleteModal.open}
                onClose={() => setConfirmDeleteModal({ open: false, encounterId: null, encounterTitle: null })}
                title="⚠️ Excluir Confronto"
            >
                <div className="p-6 text-center">
                    <p className="text-lg text-rpg-parchment mb-6">
                        Deseja excluir permanentemente o confronto <span className="font-bold text-rpg-gold">"{confirmDeleteModal.encounterTitle}"</span>? Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={executeDeleteEncounter}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                        >
                            ✓ Excluir
                        </button>
                        <button
                            onClick={() => setConfirmDeleteModal({ open: false, encounterId: null, encounterTitle: null })}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
                        >
                            ✗ Cancelar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
