'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { addDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Modal from '@/components/Modal';
import { Campaign } from '@/types/campaign';
import { npcProfessions, npcAppearances, npcPersonalities } from '@/lib/npcData';

// Tipos
type NPC = {
  profession: string;
  appearance: string;
  personality: string;
};

const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // States para Modais
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);

  // States para Formulário de Campanha
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // States para Lista de Campanhas
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States para Gerador de NPC
  const [npcAmount, setNpcAmount] = useState(1);
  const [selectedProfession, setSelectedProfession] = useState('Aleatória');
  const [generatedNpcs, setGeneratedNpcs] = useState<NPC[]>([]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(
        collection(db, 'campaigns'), 
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const campaignsData: Campaign[] = [];
        querySnapshot.forEach((doc) => {
          campaignsData.push({ id: doc.id, ...doc.data() } as Campaign);
        });
        setCampaigns(campaignsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Erro ao buscar campanhas:", error);
        setError("Não foi possível carregar as campanhas.");
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSaveCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Você precisa estar logado para criar uma campanha.");
      return;
    }
    if (!campaignName.trim()) {
      setError("O nome da campanha não pode ficar em branco.");
      return;
    }

    try {
        await addDoc(collection(db, 'campaigns'), {
            name: campaignName,
            description: campaignDescription,
            ownerId: user.uid,
            createdAt: new Date(),
        });
        setCampaignName('');
        setCampaignDescription('');
        setError(null);
        setIsCampaignModalOpen(false);
    } catch (error) {
        console.error("Erro ao salvar campanha:", error);
        setError("Não foi possível salvar a campanha. Tente novamente.");
    }
  }

  const handleGenerateNpcs = (e: FormEvent) => {
    e.preventDefault();
    const npcs: NPC[] = [];
    for (let i = 0; i < npcAmount; i++) {
      npcs.push({
        profession: selectedProfession === 'Aleatória' ? getRandomItem(npcProfessions) : selectedProfession,
        appearance: getRandomItem(npcAppearances),
        personality: getRandomItem(npcPersonalities),
      });
    }
    setGeneratedNpcs(npcs);
  }

  return (
    <>
      <div className="min-h-screen bg-background-start text-text flex flex-col">
          <header className="bg-surface p-4 shadow-lg border-b-2 border-accent/20">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/">
                  <h1 className="text-2xl font-bold font-serif text-accent cursor-pointer">D&D Campanha e Álcool</h1>
                </Link>
                <nav className="flex items-center gap-6">
                    <Link href="/books" className="text-text/90 hover:text-primary transition-colors font-bold font-serif text-lg">
                        Biblioteca
                    </Link>
                    <Link href="/personagens" className="text-text/90 hover:text-primary transition-colors font-bold font-serif text-lg">
                        Personagens
                    </Link>
                    {user && (
                        <div className="flex items-center font-sans">
                            <span className="mr-4 hidden sm:inline">Olá, {user.displayName || user.email}</span>
                            <button 
                                onClick={handleLogout} 
                                className="bg-primary hover:bg-primary/80 p-2 px-4 rounded font-bold font-serif text-text transition-all transform hover:scale-105 shadow-md hover:shadow-glow-primary"
                            >
                                Sair
                            </button>
                        </div>
                    )}
                </nav>
              </div>
          </header>
          <main className="container mx-auto p-4 sm:p-8 flex-grow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
                <h2 className="text-4xl font-bold font-serif text-center md:text-left">Suas Campanhas</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => { setGeneratedNpcs([]); setIsNpcModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 px-6 rounded font-bold font-serif text-lg transition-all transform hover:scale-105 shadow-lg w-full sm:w-auto"
                    >
                        Gerador de NPC
                    </button>
                    <button 
                        onClick={() => setIsCampaignModalOpen(true)}
                        className="bg-accent hover:brightness-90 text-background-start p-3 px-6 rounded font-bold font-serif text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-glow-accent w-full sm:w-auto"
                    >
                        Criar Nova Campanha
                    </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-10 font-sans text-text/80">Carregando suas aventuras...</div>
              ) : campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-surface/80 rounded-lg border border-text/10 shadow-xl p-6 flex flex-col hover:border-accent/50 transition-all transform hover:-translate-y-1">
                      <h3 className="text-2xl font-bold font-serif mb-2 text-accent">{campaign.name}</h3>
                      <p className="text-text/80 font-sans flex-grow leading-relaxed">{campaign.description || "Nenhuma descrição fornecida."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center bg-surface/80 p-12 rounded-lg border border-text/10 shadow-xl">
                  <h3 className="text-2xl font-serif mb-4">Nenhuma campanha encontrada</h3>
                  <p className="text-lg text-text/80 font-sans leading-relaxed">
                      Parece que sua jornada ainda não começou. Clique em &quot;Criar Nova Campanha&quot; para forjar sua primeira saga!
                  </p>
                </div>
              )}
          </main>
          <footer className="text-center p-4 text-text/50 font-sans text-sm">
              <p>D&D Campaign Manager © 2026</p>
          </footer>
      </div>

      {/* Modal de Criação de Campanha */}
      <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title="Criar Nova Campanha">
        <form onSubmit={handleSaveCampaign} className="space-y-6">
          {error && <p className="bg-primary/20 text-text p-3 rounded-md text-center font-sans">{error}</p>}
          <div>
            <label className="block mb-2 font-serif text-text/90">Nome da Campanha</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-serif text-text/90">Descrição</label>
            <textarea
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans h-32 resize-none"
              placeholder='Uma breve sinopse da sua aventura...'
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/80 p-3 px-8 rounded font-bold font-serif text-lg text-text transition-all transform hover:scale-105 shadow-lg hover:shadow-glow-primary"
            >
              Salvar Campanha
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Gerador de NPC */}
      <Modal isOpen={isNpcModalOpen} onClose={() => setIsNpcModalOpen(false)} title="Gerador de NPCs">
        <form onSubmit={handleGenerateNpcs} className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block mb-2 font-serif text-text/90">Profissão</label>
              <select 
                value={selectedProfession} 
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans"
              >
                <option>Aleatória</option>
                {npcProfessions.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-1/4">
              <label className="block mb-2 font-serif text-text/90">Quantidade</label>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={npcAmount} 
                onChange={(e) => setNpcAmount(Number(e.target.value))}
                className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans"
              />
            </div>
          </div>
          <div className="text-center pt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 px-8 rounded font-bold font-serif text-lg transition-all transform hover:scale-105 shadow-lg">
              Gerar
            </button>
          </div>
        </form>

        {generatedNpcs.length > 0 && (
          <div className="mt-6 border-t border-text/20 pt-4 space-y-4 max-h-80 overflow-y-auto pr-2">
            {generatedNpcs.map((npc, index) => (
              <div key={index} className="bg-background-end/50 rounded-lg p-4 border border-text/10 shadow-md animate-fade-in">
                <h3 className="font-serif text-xl text-accent">{npc.profession}</h3>
                <p className="font-sans text-sm text-text/80 mt-1"><strong>Aparência:</strong> {npc.appearance}</p>
                <p className="font-sans text-sm text-text/80"><strong>Personalidade:</strong> {npc.personality}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
