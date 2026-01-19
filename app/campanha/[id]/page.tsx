'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Campaign } from '@/types/campaign';
import { Character } from '@/lib/character-data';
import MapGenerator from '@/components/MapGenerator';
import DMIntelligence from '@/components/DMIntelligence';
import Modal from '@/components/Modal';
import { EditableField } from '@/components/EditableField';


type Tab = 'overview' | 'characters' | 'maps' | 'mestre';

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [linkedCharacters, setLinkedCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'overview';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [confirmUnlinkModal, setConfirmUnlinkModal] = useState<{ open: boolean; characterId: string | null; characterName: string | null }>({ open: false, characterId: null, characterName: null });

    useEffect(() => {
        if (!id) return;

        // Listener para personagens
        const qChars = query(
            collection(db, 'personagens'),
            where('campaignId', '==', id)
        );

        const unsubscribe = onSnapshot(qChars, (snapshot) => {
            const chars: Character[] = [];
            snapshot.forEach((doc) => {
                chars.push({ ...doc.data(), id: doc.id } as Character);
            });
            setLinkedCharacters(chars);
        });

        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, 'campaigns', id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.ownerId !== user.uid) {
                        alert("Você não tem permissão para ver esta campanha.");
                        router.push('/');
                        return;
                    }
                    setCampaign({ id: docSnap.id, ...data } as Campaign);
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error("Erro ao carregar campanha:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchCampaign();
        } else {
            // Se não houver usuário no primeiro render, aguardamos o AuthContext
            // Se demorar demais, o userRedirect do AuthContext deve agir, mas por segurança:
            const timeout = setTimeout(() => setIsLoading(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [id, user, router]);

    // Atualiza a URL quando a aba muda, sem recarregar
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (activeTab === 'overview') params.delete('tab');
        else params.set('tab', activeTab);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }, [activeTab]);

    const handleCopyInvite = () => {
        const url = `${window.location.origin}/convite/${id}`;
        navigator.clipboard.writeText(url);
        alert("Link de convite copiado! 🔗\nEnvie para seus jogadores.");
    };

    const handleUpdateCampaign = async (field: keyof Campaign, value: any) => {
        if (!campaign || !id) return;
        try {
            await updateDoc(doc(db, 'campanhas', id as string), {
                [field]: value
            });
            // Atualiza estado local imediatamente
            setCampaign(prev => prev ? { ...prev, [field]: value } : null);
        } catch (error) {
            console.error("Erro ao atualizar campanha:", error);
        }
    };

    const handleUpdateCharacter = async (charId: string, field: keyof Character, value: any) => {
        try {
            await updateDoc(doc(db, 'personagens', charId), {
                [field]: value
            });
        } catch (error) {
            console.error("Erro ao atualizar personagem:", error);
        }
    };

    const handleUnlinkCharacter = async (charId: string, charName: string) => {
        setConfirmUnlinkModal({ open: true, characterId: charId, characterName: charName });
    };

    const executeUnlinkCharacter = async () => {
        if (!confirmUnlinkModal.characterId) return;
        try {
            await updateDoc(doc(db, 'personagens', confirmUnlinkModal.characterId), {
                campaignId: null
            });
            setConfirmUnlinkModal({ open: false, characterId: null, characterName: null });
        } catch (error) {
            console.error("Erro ao remover:", error);
            alert("Erro ao remover personagem.");
        }
    };

    if (!user && !isLoading) {
        return <div className="min-h-screen bg-rpg-dark flex items-center justify-center text-rpg-gold">Acesso Negado.</div>;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rpg-gold"></div>
            </div>
        );
    }

    if (!campaign) return null;

    return (
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">

            {/* Header Simplificado */}
            <header className="bg-rpg-panel p-3 border-b border-rpg-gold/20 sticky top-0 z-[100] shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-rpg-grey hover:text-rpg-gold transition-colors font-cinzel text-sm">
                            &larr; Voltar
                        </Link>
                        <div className="max-w-[200px] sm:max-w-md">
                            <EditableField
                                initialValue={campaign.name}
                                onSave={(val) => handleUpdateCampaign('name', val)}
                                valueClassName="text-lg sm:text-xl font-bold font-cinzel text-rpg-gold uppercase tracking-wider"
                                editClassName="font-cinzel font-bold text-lg"
                            />
                        </div>
                    </div>

                </div>
            </header>

            <main className="container mx-auto p-3 sm:p-6 flex-grow flex flex-col">

                {/* Tabs */}
                <div className="flex border-b border-rpg-gold/20 mb-4 sm:mb-6 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 sm:px-6 sm:py-3 font-cinzel font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'overview'
                            ? 'text-rpg-gold border-b-2 border-rpg-gold bg-rpg-gold/5'
                            : 'text-rpg-grey hover:text-rpg-parchment hover:bg-white/5'
                            }`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('maps')}
                        className={`px-4 py-2 sm:px-6 sm:py-3 font-cinzel font-bold transition-all text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'maps'
                            ? 'text-rpg-gold border-b-2 border-rpg-gold bg-rpg-gold/5'
                            : 'text-rpg-grey hover:text-rpg-parchment hover:bg-white/5'
                            }`}
                    >
                        <span>🗺️</span> Mapas
                    </button>
                    <button
                        onClick={() => setActiveTab('mestre')}
                        className={`px-4 py-2 sm:px-6 sm:py-3 font-cinzel font-bold transition-all text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'mestre'
                            ? 'text-rpg-gold border-b-2 border-rpg-gold bg-rpg-gold/5'
                            : 'text-rpg-grey hover:text-rpg-parchment hover:bg-white/5'
                            }`}
                    >
                        <span>🛡️</span> Mestre
                    </button>
                    <button
                        onClick={() => setActiveTab('characters')}
                        className={`px-4 py-2 sm:px-6 sm:py-3 font-cinzel font-bold transition-all text-sm whitespace-nowrap ${activeTab === 'characters'
                            ? 'text-rpg-gold border-b-2 border-rpg-gold bg-rpg-gold/5'
                            : 'text-rpg-grey hover:text-rpg-parchment hover:bg-white/5'
                            }`}
                    >
                        Personagens
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow animate-fade-in">

                    {activeTab === 'overview' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-6 shadow-lg">
                                <h2 className="text-2xl font-cinzel text-rpg-gold mb-4 border-b border-rpg-gold/10 pb-2">Sinopse</h2>
                                <EditableField
                                    initialValue={campaign.description || ''}
                                    onSave={(val) => handleUpdateCampaign('description', val)}
                                    isTextarea={true}
                                    valueClassName="font-medieval text-lg leading-relaxed text-rpg-parchment/90 whitespace-pre-wrap"
                                    editClassName="font-medieval text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-6 shadow-md">
                                    <h3 className="font-cinzel text-lg text-rpg-gold mb-4">📅 Próxima Sessão</h3>
                                    <input
                                        type="datetime-local"
                                        value={campaign.nextSession || ''}
                                        onChange={(e) => setCampaign({ ...campaign, nextSession: e.target.value })}
                                        className="w-full bg-rpg-slate border border-rpg-gold/30 rounded p-3 text-rpg-parchment font-medieval focus:border-rpg-gold focus:outline-none"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!campaign.id) return;
                                            try {
                                                await updateDoc(doc(db, 'campaigns', campaign.id), {
                                                    nextSession: campaign.nextSession
                                                });
                                                alert("Data salva!");
                                            } catch (e) {
                                                console.error(e);
                                                alert("Erro ao salvar data.");
                                            }
                                        }}
                                        className="mt-3 w-full bg-rpg-gold/10 hover:bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/30 p-2 rounded font-bold font-cinzel text-xs transition-colors"
                                    >
                                        Salvar Data
                                    </button>
                                </div>
                                <div className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-6 shadow-md">
                                    <h3 className="font-cinzel text-lg text-rpg-gold mb-4">📝 Anotações Rápidas</h3>
                                    <textarea
                                        value={campaign.quickNotes || ''}
                                        onChange={(e) => setCampaign({ ...campaign, quickNotes: e.target.value })}
                                        className="w-full h-32 bg-rpg-slate border border-rpg-gold/30 rounded p-3 text-rpg-parchment font-medieval focus:border-rpg-gold focus:outline-none resize-none"
                                        placeholder="Ideias, lembretes, nomes..."
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!campaign.id) return;
                                            try {
                                                await updateDoc(doc(db, 'campaigns', campaign.id), {
                                                    quickNotes: campaign.quickNotes
                                                });
                                                alert("Anotações salvas!");
                                            } catch (e) {
                                                console.error(e);
                                                alert("Erro ao salvar anotações.");
                                            }
                                        }}
                                        className="mt-3 w-full bg-rpg-gold/10 hover:bg-rpg-gold/20 text-rpg-gold border border-rpg-gold/30 p-2 rounded font-bold font-cinzel text-xs transition-colors"
                                    >
                                        Salvar Notas
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maps' && (
                        <div className="h-full space-y-6">
                            <MapGenerator campaign={campaign} characters={linkedCharacters} />
                        </div>
                    )}

                    {activeTab === 'characters' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-rpg-panel border border-rpg-gold/20 p-4 rounded-lg">
                                <div>
                                    <h3 className="text-xl font-cinzel text-rpg-gold">Heróis Reunidos</h3>
                                    <p className="text-sm text-rpg-grey font-medieval">
                                        Gerencie os aventureiros desta saga.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCopyInvite}
                                    className="bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark font-bold px-4 py-2 rounded font-cinzel text-sm shadow-md hover:shadow-glow-gold transition-all flex items-center gap-2"
                                >
                                    <span>🔗</span> Convidar Jogadores
                                </button>
                            </div>

                            {linkedCharacters.length === 0 ? (
                                <div className="text-center py-20 bg-rpg-panel/30 border border-dashed border-rpg-grey/20 rounded-lg">
                                    <p className="font-medieval text-rpg-grey text-xl mb-4">
                                        A taverna está vazia... Ninguém respondeu ao chamado ainda.
                                    </p>
                                    <button
                                        onClick={handleCopyInvite}
                                        className="text-rpg-gold hover:underline font-cinzel text-sm opacity-80"
                                    >
                                        Copiar Link de Convite
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {linkedCharacters.map(char => (
                                        <div key={char.id} className="bg-rpg-panel border border-rpg-gold/10 rounded-lg p-4 shadow-md hover:border-rpg-gold/30 transition-all flex flex-col gap-2 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-2 flex items-center gap-2">
                                                <span className="opacity-50 text-xs font-mono text-rpg-grey">ID: {char.id.slice(0, 4)}</span>
                                                {user?.uid === campaign.ownerId && (
                                                    <button
                                                        onClick={() => handleUnlinkCharacter(char.id, char.name)}
                                                        className="text-red-500/50 hover:text-red-500 hover:scale-110 transition-all p-1"
                                                        title="Remover Jogador da Campanha"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 border-b border-rpg-gold/5 pb-2">
                                                <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-xl border border-rpg-gold/20">
                                                    👤
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-rpg-gold font-cinzel text-lg leading-none">{char.name}</h4>
                                                    <p className="text-xs text-rpg-parchment/70 font-medieval">{char.race} {char.class} • Lvl {char.level}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center text-sm py-2">
                                                <div className="bg-black/20 rounded p-1 flex flex-col items-center justify-center">
                                                    <span className="block text-rpg-grey text-xs">HP</span>
                                                    <div className="flex items-center gap-1 justify-center w-full">
                                                        <EditableField
                                                            initialValue={char.currentHp}
                                                            onSave={(val) => handleUpdateCharacter(char.id, 'currentHp', Number(val))}
                                                            valueClassName="font-bold text-green-400"
                                                            editClassName="w-full text-center text-xs p-0 bg-transparent border-b border-green-400 focus:outline-none text-green-400 font-bold h-5"
                                                        />
                                                        <span className="text-rpg-grey/50 text-[10px]">/</span>
                                                        <span className="font-bold text-rpg-grey text-xs">{char.maxHp}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 rounded p-1 flex flex-col items-center justify-center">
                                                    <span className="block text-rpg-grey text-xs">CA</span>
                                                    <EditableField
                                                        initialValue={char.armorClass}
                                                        onSave={(val) => handleUpdateCharacter(char.id, 'armorClass', Number(val))}
                                                        valueClassName="font-bold text-blue-300"
                                                        editClassName="w-full text-center text-xs p-0 bg-transparent border-b border-blue-300 focus:outline-none text-blue-300 font-bold h-5"
                                                    />
                                                </div>
                                                <div className="bg-black/20 rounded p-1 flex flex-col items-center justify-center">
                                                    <span className="block text-rpg-grey text-xs">Inic.</span>
                                                    <EditableField
                                                        initialValue={char.initiative}
                                                        onSave={(val) => handleUpdateCharacter(char.id, 'initiative', Number(val))}
                                                        valueClassName="font-bold text-yellow-500"
                                                        editClassName="w-full text-center text-xs p-0 bg-transparent border-b border-yellow-500 focus:outline-none text-yellow-500 font-bold h-5"
                                                    />
                                                </div>
                                            </div>

                                            <Link href={`/personagem/${char.id}`} className="mt-auto w-full text-center bg-rpg-slate hover:bg-rpg-slate/80 py-2 rounded text-xs font-bold font-cinzel text-rpg-parchment border border-white/5 hover:border-rpg-gold/20 transition-colors">
                                                Ver Ficha Completa
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'mestre' && (
                        <div className="h-full">
                            <DMIntelligence campaign={campaign} characters={linkedCharacters} />
                        </div>
                    )}

                </div>
            </main>

            {/* UNLINK CHARACTER MODAL */}
            <Modal
                isOpen={confirmUnlinkModal.open}
                onClose={() => setConfirmUnlinkModal({ open: false, characterId: null, characterName: null })}
                title="⚠️ Remover Herói da Campanha"
            >
                <div className="text-center">
                    <p className="text-rpg-parchment mb-4">Tem certeza que deseja remover o herói <strong className="text-rpg-gold">"{confirmUnlinkModal.characterName}"</strong> desta campanha?</p>
                    <p className="text-rpg-grey text-sm mb-6">A ficha do jogador NÃO será apagada, apenas desvinculada desta mesa.</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setConfirmUnlinkModal({ open: false, characterId: null, characterName: null })}
                            className="bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/30 font-bold py-2 px-6 rounded transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={executeUnlinkCharacter}
                            className="bg-rpg-red hover:bg-rpg-red/80 text-white font-bold py-2 px-6 rounded transition-all"
                        >
                            Remover Herói
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
