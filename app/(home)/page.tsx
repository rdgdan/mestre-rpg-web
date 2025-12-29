'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { addDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import Modal from '@/components/Modal';
import { Campaign } from '@/types/campaign';
import { npcProfessions, npcAppearances, npcPersonalities } from '@/lib/npcData';

// Tipos
type NPC = {
  profession: string;
  appearance: string;
  personality: string;
};

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  imageUrl?: string;
}

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

  // States para Listas (Campanhas e Personagens)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States para Gerador de NPC
  const [npcAmount, setNpcAmount] = useState(1);
  const [selectedProfession, setSelectedProfession] = useState('Aleatória');
  const [generatedNpcs, setGeneratedNpcs] = useState<NPC[]>([]);

  // States para Edição de Nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');

  useEffect(() => {
    if (user) {
      setIsLoading(true);

      // Query de Campanhas (Removido orderBy desc para evitar falha por falta de índice)
      const qCampaigns = query(
        collection(db, 'campaigns'),
        where('ownerId', '==', user.uid)
      );

      // Query de Personagens
      const qCharacters = query(
        collection(db, 'personagens'),
        where('ownerId', '==', user.uid)
      );

      let campaignsLoaded = false;
      let charactersLoaded = false;

      const checkLoading = () => {
        if (campaignsLoaded && charactersLoaded) {
          setIsLoading(false);
        }
      };

      // Observer para Campanhas
      const unsubCampaigns = onSnapshot(qCampaigns, (querySnapshot) => {
        const campaignsData: Campaign[] = [];
        querySnapshot.forEach((doc) => {
          campaignsData.push({ id: doc.id, ...doc.data() } as Campaign);
        });
        // Ordenação manual client-side se necessário
        setCampaigns(campaignsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        campaignsLoaded = true;
        checkLoading();
      }, (error) => {
        console.error("Erro ao buscar campanhas:", error);
        campaignsLoaded = true;
        checkLoading();
      });

      // Observer para Personagens
      const unsubCharacters = onSnapshot(qCharacters, (querySnapshot) => {
        const charsData: Character[] = [];
        querySnapshot.forEach((doc) => {
          charsData.push({ id: doc.id, ...doc.data() } as Character);
        });
        setCharacters(charsData.slice(0, 4));
        charactersLoaded = true;
        checkLoading();
      }, (error) => {
        console.error("Erro ao buscar personagens:", error);
        charactersLoaded = true;
        checkLoading();
      });

      return () => {
        unsubCampaigns();
        unsubCharacters();
      };
    } else {
      setIsLoading(false);
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

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName });
      setIsEditingName(false);
      // O Firebase Auth atualiza o objeto user localmente, mas o estado do React no useAuth pode demorar. 
      // Em alguns casos recarregar a página ou forçar um update é necessário se o provider não reagir.
      window.location.reload();
    } catch (err) {
      console.error("Erro ao atualizar nome:", err);
      alert("Não foi possível atualizar o nome.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">

        {/* HEADER / NAVIGATION */}
        <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto flex justify-between items-center">
            <div className="group">
              <h1 className="text-2xl font-bold font-cinzel text-rpg-gold cursor-default transition-colors text-shadow-sm">D&D Campanha e Álcool</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/confrontos" className="text-red-400 hover:text-red-300 transition-colors font-bold font-cinzel text-lg flex items-center gap-2 border-b-2 border-transparent hover:border-red-400 text-shadow-sm">
                <span className="text-2xl">⚔️</span> Confrontos
              </Link>
              <Link href="/biblioteca" className="text-rpg-parchment/80 hover:text-rpg-gold transition-colors font-bold font-cinzel text-lg hidden sm:block">
                📚 Biblioteca
              </Link>
              {user && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center font-medieval">
                    <span className="hidden md:inline text-rpg-grey mr-2">Mestre</span>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="bg-rpg-slate border border-rpg-gold/30 rounded px-2 py-1 text-sm text-rpg-parchment focus:outline-none focus:border-rpg-gold w-32"
                          autoFocus
                        />
                        <button onClick={handleUpdateName} className="text-green-500 hover:text-green-400 text-xl" title="Salvar">✓</button>
                        <button onClick={() => setIsEditingName(false)} className="text-red-500 hover:text-red-400 text-xl" title="Cancelar">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-rpg-parchment font-bold text-lg">{user.displayName || 'Viajante'}</span>
                        <button
                          onClick={() => { setNewName(user.displayName || ''); setIsEditingName(true); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-rpg-grey hover:text-rpg-gold text-xs"
                          title="Editar nome"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-900/40 hover:bg-red-800 text-red-100 hover:text-white p-2 px-4 rounded border border-red-500/50 transition-all font-bold font-cinzel text-sm shadow-md hover:shadow-glow-red"
                  >
                    Sair
                  </button>
                </div>
              )}
            </nav>
          </div>
        </header>

        {/* MAIN DASHBOARD */}
        <main className="container mx-auto p-4 sm:p-8 flex-grow">

          {/* Quick Tools Section */}
          <section className="mb-8 p-4 bg-rpg-panel rounded-lg border border-rpg-gold/10 shadow-lg flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="text-xl font-cinzel text-rpg-gold">Painel do Mestre</h3>
              <p className="text-sm text-rpg-grey font-medieval">Ferramentas rápidas para sua sessão.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setGeneratedNpcs([]); setIsNpcModalOpen(true); }}
                className="bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/20 p-2 px-4 rounded font-bold font-cinzel text-sm transition-all shadow-md hover:border-rpg-gold"
              >
                🎲 Gerador de NPC
              </button>
              <Link href="/biblioteca">
                <button className="bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/20 p-2 px-4 rounded font-bold font-cinzel text-sm transition-all shadow-md hover:border-rpg-gold">
                  📚 Grande Biblioteca
                </button>
              </Link>
            </div>
          </section>

          {/* Split View: Campaigns & Characters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLUMN 1: CAMPAIGNS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-2 flex-grow mr-4">
                  🏰 Campanhas
                </h2>
                <button
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark p-2 px-4 rounded font-bold font-cinzel text-sm transition-all shadow-lg hover:shadow-glow-gold border border-rpg-gold/50 flex-shrink-0"
                >
                  + Nova
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 font-medieval text-rpg-grey animate-pulse">Carregando mapas...</div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-rpg-panel rounded-lg border border-rpg-gold/10 p-5 hover:border-rpg-gold/40 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rpg-gold/5 to-transparent rounded-bl-full pointer-events-none"></div>
                      <h3 className="text-xl font-bold font-cinzel text-rpg-gold group-hover:text-rpg-gol-light mb-1">{campaign.name}</h3>
                      <p className="text-rpg-parchment/70 font-medieval text-sm line-clamp-2">{campaign.description || "Sem descrição."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-rpg-grey/20 rounded-lg bg-rpg-panel/50">
                  <p className="text-rpg-grey font-medieval mb-2">Nenhuma campanha ativa.</p>
                  <button onClick={() => setIsCampaignModalOpen(true)} className="text-rpg-gold hover:underline font-cinzel text-sm">Criar a primeira</button>
                </div>
              )}
            </section>

            {/* COLUMN 2: CHARACTERS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-2 flex-grow mr-4">
                  👤 Personagens
                </h2>
                <Link href="/personagens" className="text-rpg-grey hover:text-rpg-gold text-sm font-medieval underline">
                  Ver todos
                </Link>
              </div>

              {isLoading ? (
                <div className="text-center py-10 font-medieval text-rpg-grey animate-pulse">Invocando almas...</div>
              ) : characters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {characters.map(char => (
                    <Link key={char.id} href={`/personagem/${char.id}`}>
                      <div className="bg-rpg-panel rounded-lg border border-rpg-gold/10 p-4 hover:border-rpg-gold/40 transition-all cursor-pointer h-full flex flex-col shadow-sm hover:shadow-md hover:-translate-y-1 relative overflow-hidden">
                        {char.imageUrl && (
                          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${char.imageUrl})` }}></div>
                        )}
                        <div className="relative z-10">
                          <h3 className="text-lg font-bold font-cinzel text-rpg-parchment truncate">{char.name}</h3>
                          <p className="text-rpg-gold/80 text-xs font-cinzel uppercase tracking-wider mt-1">{char.class} &bull; Lvl {char.level}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/personagens" className="flex items-center justify-center p-4 border border-dashed border-rpg-grey/30 rounded-lg text-rpg-grey hover:text-rpg-gold hover:border-rpg-gold/30 transition-all font-cinzel text-sm">
                    + Ver Lista Completa
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-rpg-grey/20 rounded-lg bg-rpg-panel/50">
                  <p className="text-rpg-grey font-medieval mb-2">Nenhum herói encontrado.</p>
                  <Link href="/personagens" className="text-rpg-gold hover:underline font-cinzel text-sm">Criar ou Importar</Link>
                </div>
              )}
            </section>
          </div>

        </main>

        <footer className="text-center p-6 text-rpg-grey/40 font-medieval text-sm border-t border-rpg-gold/10 bg-rpg-dark/90 text-shadow-sm">
          <p>D&D Campanha e Álcool © 2026 | Forjado com código e hidromel</p>
        </footer>
      </div>

      {/* Modal de Criação de Campanha */}
      <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title="Nova Campanha">
        <form onSubmit={handleSaveCampaign} className="space-y-6">
          {error && <p className="bg-rpg-red/20 border border-rpg-red/40 text-red-200 p-3 rounded-md text-center font-medieval">{error}</p>}
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Nome da Campanha</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval placeholder-rpg-grey/30"
              placeholder="A Maldição de Strahd..."
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Descrição da Aventura</label>
            <textarea
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval h-32 resize-none placeholder-rpg-grey/30"
              placeholder='Uma breve sinopse dos perigos que aguardam...'
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-rpg-gold/10">
            <button
              type="submit"
              className="bg-rpg-gold hover:bg-rpg-gold/80 p-3 px-8 rounded font-bold font-cinzel text-lg text-rpg-dark transition-all transform hover:scale-105 shadow-lg hover:shadow-glow-gold border border-rpg-gold/50"
            >
              Iniciar Saga
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Gerador de NPC */}
      <Modal isOpen={isNpcModalOpen} onClose={() => setIsNpcModalOpen(false)} title="Gerador de NPCs">
        <form onSubmit={handleGenerateNpcs} className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Profissão / Arquétipo</label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval cursor-pointer"
              >
                <option>Aleatória</option>
                {npcProfessions.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-1/4">
              <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Qtd.</label>
              <input
                type="number"
                min="1"
                max="10"
                value={npcAmount}
                onChange={(e) => setNpcAmount(Number(e.target.value))}
                className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval text-center"
              />
            </div>
          </div>
          <div className="text-center pt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 px-8 rounded font-bold font-cinzel text-lg transition-all transform hover:scale-105 shadow-lg border border-white/10">
              Gerar NPCs
            </button>
          </div>
        </form>

        {generatedNpcs.length > 0 && (
          <div className="mt-6 border-t border-rpg-gold/20 pt-4 space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {generatedNpcs.map((npc, index) => (
              <div key={index} className="bg-rpg-slate/50 rounded-lg p-4 border border-rpg-gold/10 shadow-md animate-fade-in hover:border-rpg-gold/30 transition-colors">
                <h3 className="font-medieval text-xl text-rpg-gold font-bold mb-1">{npc.profession}</h3>
                <p className="font-sans text-sm text-rpg-parchment/80 mt-1"><strong>Aparência:</strong> <span className="text-rpg-grey">{npc.appearance}</span></p>
                <p className="font-sans text-sm text-rpg-parchment/80"><strong>Personalidade:</strong> <span className="text-rpg-grey">{npc.personality}</span></p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
