'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Character } from '@/lib/character-data';
import Link from 'next/link';

interface CampaignPreview {
    id: string;
    name: string;
    description: string;
    ownerId: string;
}

export default function InvitePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();

    const [campaign, setCampaign] = useState<CampaignPreview | null>(null);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchCampaignAndChars = async () => {
            if (!id) return;

            try {
                // 1. Buscar Campanha
                const campRef = doc(db, 'campaigns', id as string);
                const campSnap = await getDoc(campRef);

                if (!campSnap.exists()) {
                    setError("Campanha não encontrada ou link inválido.");
                    setIsLoading(false);
                    return;
                }

                setCampaign({ id: campSnap.id, ...campSnap.data() } as CampaignPreview);

                // 2. Se logado, buscar personagens do usuário
                if (user) {
                    const qChars = query(
                        collection(db, 'personagens'),
                        where('ownerId', '==', user.uid)
                    );
                    const querySnapshot = await getDocs(qChars);
                    const chars: Character[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data() as Character;
                        chars.push({ ...data, id: doc.id });
                    });
                    setCharacters(chars);
                }

            } catch (err) {
                console.error(err);
                setError("Erro ao carregar dados do convite.");
            } finally {
                setIsLoading(false);
            }
        };

        // Aguarda um momento para o AuthContext inicializar
        const timer = setTimeout(() => {
            fetchCampaignAndChars();
        }, 100);

        return () => clearTimeout(timer);
    }, [id, user]);

    const handleJoin = async () => {
        if (!selectedCharId || !user || !campaign) return;

        try {
            const charRef = doc(db, 'personagens', selectedCharId);
            await updateDoc(charRef, {
                campaignId: campaign.id
            });
            setSuccess(true);
            setTimeout(() => {
                router.push('/home');
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("Erro ao entrar na campanha. Tente novamente.");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rpg-gold"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-3xl font-cinzel text-red-400 mb-4">📜 Convite Inválido</h1>
                <p className="text-rpg-parchment font-medieval text-lg mb-8">{error}</p>
                <Link href="/" className="bg-rpg-gold text-rpg-dark font-bold px-6 py-2 rounded">Voltar para Home</Link>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center text-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <div className="bg-rpg-panel border border-rpg-gold/20 p-8 rounded-lg max-w-md w-full shadow-2xl">
                    <h1 className="text-2xl font-cinzel text-rpg-gold mb-2">Convite para Aventura</h1>
                    <h2 className="text-xl font-bold text-rpg-parchment mb-6">&quot;{campaign?.name}&quot;</h2>

                    <p className="text-rpg-grey font-medieval mb-8">
                        Você foi convocado para uma jornada épica. <br />
                        Faça login ou crie sua conta para aceitar o chamado.
                    </p>

                    <Link
                        href={`/login?redirect=/convite/${id}`}
                        className="block w-full bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark font-bold py-3 rounded mb-3 transition-colors uppercase font-cinzel"
                    >
                        Entrar com minha conta
                    </Link>
                    <Link
                        href={`/register?redirect=/convite/${id}`}
                        className="block w-full bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/30 font-bold py-3 rounded transition-colors uppercase font-cinzel text-sm"
                    >
                        Criar nova conta
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rpg-dark flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <div className="bg-rpg-panel border border-rpg-gold/20 p-6 sm:p-10 rounded-lg max-w-2xl w-full shadow-2xl relative overflow-hidden">

                {/* Background decorative */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-rpg-gold/50 to-transparent"></div>

                <div className="text-center mb-8">
                    <span className="text-4xl mb-4 block">📜</span>
                    <h1 className="text-3xl font-cinzel text-rpg-gold mb-2">Chamado para Aventura</h1>
                    <p className="text-rpg-parchment/80 font-medieval text-lg">
                        O mestre convoca seus heróis para a campanha:
                    </p>
                    <h2 className="text-2xl font-bold text-white mt-2 p-2 bg-black/20 rounded border border-white/5 inline-block px-6">
                        {campaign?.name}
                    </h2>
                    <p className="text-rpg-grey text-sm mt-4 italic max-w-md mx-auto">
                        &quot;{campaign?.description || 'Uma jornada sem descrição...'}&quot;
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="text-green-400 text-5xl mb-4">✨</div>
                        <h3 className="text-2xl font-cinzel text-rpg-parchment mb-2">Vínculo Estabelecido!</h3>
                        <p className="text-rpg-grey">Redirecionando para o seu painel...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h3 className="font-cinzel text-rpg-gold text-lg border-b border-rpg-gold/10 pb-2">
                            Selecione seu Herói
                        </h3>

                        {characters.length === 0 ? (
                            <div className="text-center py-6 bg-black/20 rounded border border-dashed border-rpg-grey/20">
                                <p className="text-rpg-grey mb-4">Você não possui personagens criados.</p>
                                <Link href="/personagens" className="text-rpg-gold hover:underline">Criar Personagem</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {characters.map(char => (
                                    <div
                                        key={char.id}
                                        onClick={() => setSelectedCharId(char.id)}
                                        className={`p-3 rounded border cursor-pointer transition-all flex items-center gap-3 ${selectedCharId === char.id
                                            ? 'bg-rpg-gold/20 border-rpg-gold ring-1 ring-rpg-gold'
                                            : 'bg-rpg-slate border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-lg overflow-hidden">
                                            {char.inventory?.otherEquipment?.find(i => i.isEquipped && i.type === 'armor') ? '🛡️' : '👤'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-rpg-parchment truncate">{char.name}</h4>
                                            <p className="text-xs text-rpg-grey truncate">{char.class} • Lvl {char.level}</p>
                                        </div>
                                        {char.campaignId === campaign?.id && (
                                            <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">Já na campanha</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleJoin}
                            disabled={!selectedCharId}
                            className={`w-full font-bold py-4 rounded font-cinzel text-lg transition-all transform shadow-lg ${selectedCharId
                                ? 'bg-rpg-gold hover:bg-rpg-gold/90 text-rpg-dark hover:scale-[1.02]'
                                : 'bg-rpg-grey/20 text-rpg-grey cursor-not-allowed'
                                }`}
                        >
                            Aceitar Destino
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
