'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Campaign } from '@/types/campaign';
import CampaignOracle from '@/components/CampaignOracle';

type Tab = 'overview' | 'characters' | 'oracle';

export default function CampaignDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

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
            <header className="bg-rpg-panel p-4 border-b border-rpg-gold/20 sticky top-0 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-rpg-grey hover:text-rpg-gold transition-colors font-cinzel">
                            &larr; Voltar
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold font-cinzel text-rpg-gold truncate max-w-[200px] sm:max-w-md">
                            {campaign.name}
                        </h1>
                    </div>

                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-8 flex-grow flex flex-col">

                {/* Tabs */}
                <div className="flex border-b border-rpg-gold/20 mb-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-cinzel font-bold transition-all ${activeTab === 'overview'
                            ? 'text-rpg-gold border-b-2 border-rpg-gold bg-rpg-gold/5'
                            : 'text-rpg-grey hover:text-rpg-parchment hover:bg-white/5'
                            }`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('oracle')}
                        className={`px-6 py-3 font-cinzel font-bold transition-all flex items-center gap-2 ${activeTab === 'oracle'
                            ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-900/10'
                            : 'text-rpg-grey hover:text-purple-300 hover:bg-purple-900/5'
                            }`}
                    >
                        <span>🔮</span> Oráculo I.A.
                    </button>
                    <button
                        onClick={() => setActiveTab('characters')}
                        className={`px-6 py-3 font-cinzel font-bold transition-all ${activeTab === 'characters'
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
                                <p className="font-medieval text-lg leading-relaxed text-rpg-parchment/90 whitespace-pre-wrap">
                                    {campaign.description || "O mestre ainda não escreveu os desígnios desta aventura..."}
                                </p>
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

                    {activeTab === 'oracle' && (
                        <div className="h-full">
                            <CampaignOracle campaign={campaign} />
                        </div>
                    )}

                    {activeTab === 'characters' && (
                        <div className="text-center py-20 bg-rpg-panel/30 border border-dashed border-rpg-grey/20 rounded-lg">
                            <p className="font-medieval text-rpg-grey text-xl">
                                Os heróis ainda estão se reunindo na taverna... <br />
                                <span className="text-sm opacity-60">(Funcionalidade de vincular personagens em breve)</span>
                            </p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
