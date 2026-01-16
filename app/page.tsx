'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { addDoc, collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Modal from '@/components/Modal';
import { Campaign } from '@/types/campaign';
import { fetchNpcTraitsFromFirestore, syncNpcTraitsToFirestore } from '@/lib/npc-traits-sync';

// Tipos
type NPC = {
  profession: string;
  appearance: string;
  personality: string;
  race: string;
};

interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  imageUrl?: string;
}

const getRandomItem = (arr: string[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : "Indefinido";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // States para Modais
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // States para Formulário de Campanha (Criação e Edição)
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // States para Listas (Campanhas e Personagens)
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States para Gerador de NPC
  const [npcAmount, setNpcAmount] = useState(1);
  const [selectedProfession, setSelectedProfession] = useState('Aleatória');
  const [generatedNpcs, setGeneratedNpcs] = useState<NPC[]>([]);
  const [npcTraits, setNpcTraits] = useState({
    professions: [] as string[],
    appearances: [] as string[],
    personalities: [] as string[],
    races: [] as string[]
  });

  // States para Edição de Nome do Usuário
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');

  useEffect(() => {
    // Carregar traits do Firestore
    const loadTraits = async () => {
      const traits = await fetchNpcTraitsFromFirestore();
      setNpcTraits(traits);
    };
    loadTraits();
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);

      // Query de Campanhas
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

  const handleOpenNewCampaign = () => {
    setEditingCampaignId(null);
    setCampaignName('');
    setCampaignDescription('');
    setError(null);
    setIsCampaignModalOpen(true);
  };

  const handleOpenEditCampaign = (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCampaignId(campaign.id);
    setCampaignName(campaign.name);
    setCampaignDescription(campaign.description);
    setError(null);
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Você precisa estar logado.");
      return;
    }
    if (!campaignName.trim()) {
      setError("O nome da campanha é obrigatório.");
      return;
    }

    try {
      if (editingCampaignId) {
        // Atualizar existente
        const campaignRef = doc(db, 'campaigns', editingCampaignId);
        await updateDoc(campaignRef, {
          name: campaignName,
          description: campaignDescription,
          updatedAt: new Date()
        });
      } else {
        // Criar nova
        await addDoc(collection(db, 'campaigns'), {
          name: campaignName,
          description: campaignDescription,
          ownerId: user.uid,
          createdAt: new Date(),
        });
      }

      setCampaignName('');
      setCampaignDescription('');
      setEditingCampaignId(null);
      setError(null);
      setIsCampaignModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar campanha:", error);
      setError("Erro ao salvar. Tente novamente.");
    }
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Tem certeza que deseja apagar a campanha "${campaignName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'campaigns', campaignId));
    } catch (error) {
      console.error("Erro ao excluir campanha:", error);
      alert("Erro ao excluir campanha.");
    }
  };

  const handleGenerateNpcs = (e: FormEvent) => {
    e.preventDefault();
    const npcs: NPC[] = [];
    for (let i = 0; i < npcAmount; i++) {
      const profession = selectedProfession === 'Aleatória'
        ? getRandomItem(npcTraits.professions)
        : selectedProfession;
      const race = getRandomItem(npcTraits.races || []);
      const appearance = getRandomItem(npcTraits.appearances);
      const personality = getRandomItem(npcTraits.personalities);

      npcs.push({
        profession: profession,
        appearance: appearance,
        personality: personality,
        race: race || 'Humano'
      });
    }
    setGeneratedNpcs(npcs);
  }

  const handleSyncTraits = async () => {
    if (!confirm('Deseja sincronizar as listas de traços (Profissões, Aparências, etc.) com o banco de dados? Isso buscará as versões mais recentes sem duplicar.')) return;
    setIsSyncing(true);
    try {
      const traits = await syncNpcTraitsToFirestore();
      setNpcTraits(traits);
      alert('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      alert('Erro ao sincronizar traços.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName });
      setIsEditingName(false);
      window.location.reload();
    } catch (err) {
      console.error("Erro ao atualizar nome:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Não foi possível atualizar o nome: ${errorMessage}`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">

        {/* HEADER / NAVIGATION */}
        <header className="bg-rpg-panel p-3 sm:p-4 shadow-lg border-b-2 border-rpg-gold/30 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
            <div className="group text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold font-cinzel text-rpg-gold cursor-default transition-colors text-shadow-sm">D&D Campanha e Álcool</h1>
            </div>
            <nav className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
              <Link href="/confrontos" className="text-red-400 hover:text-red-300 transition-colors font-bold font-cinzel text-sm sm:text-lg flex items-center gap-1 sm:gap-2 border-b-2 border-transparent hover:border-red-400 text-shadow-sm">
                <span className="text-xl sm:text-2xl">⚔️</span> Confrontos
              </Link>
              <Link href="/biblioteca" className="text-rpg-parchment/80 hover:text-rpg-gold transition-colors font-bold font-cinzel text-sm sm:text-lg flex items-center gap-1 sm:gap-2 border-b-2 border-transparent hover:border-rpg-gold text-shadow-sm">
                <span className="text-xl sm:text-2xl">📚</span> Biblioteca
              </Link>
              {user && (
                <div className="flex items-center gap-3 sm:gap-4 border-l border-rpg-gold/20 pl-3 sm:pl-4">
                  <div className="flex items-center font-medieval">
                    <span className="hidden lg:inline text-rpg-grey mr-2">Mestre</span>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="bg-rpg-slate border border-rpg-gold/30 rounded px-2 py-1 text-xs sm:text-sm text-rpg-parchment focus:outline-none focus:border-rpg-gold w-24 sm:w-32"
                          autoFocus
                        />
                        <button onClick={handleUpdateName} className="text-green-500 hover:text-green-400 text-lg sm:text-xl" title="Salvar">✓</button>
                        <button onClick={() => setIsEditingName(false)} className="text-red-500 hover:text-red-400 text-lg sm:text-xl" title="Cancelar">✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-rpg-parchment font-bold text-sm sm:text-lg max-w-[80px] sm:max-w-none truncate">{user.displayName || 'Viajante'}</span>
                        <button
                          onClick={() => { setNewName(user.displayName || ''); setIsEditingName(true); }}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-rpg-grey hover:text-rpg-gold text-[10px]"
                          title="Editar nome"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-900/40 hover:bg-red-800 text-red-100 hover:text-white p-1.5 sm:p-2 px-3 sm:px-4 rounded border border-red-500/50 transition-all font-bold font-cinzel text-[10px] sm:text-sm shadow-md hover:shadow-glow-red"
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
          <section className="mb-8 p-4 sm:p-5 bg-rpg-panel rounded-lg border border-rpg-gold/10 shadow-lg flex flex-col sm:flex-row gap-4 items-center sm:justify-between text-center sm:text-left">
            <div>
              <h3 className="text-xl font-cinzel text-rpg-gold">Painel do Mestre</h3>
              <p className="text-sm text-rpg-grey font-medieval">Ferramentas rápidas para sua sessão.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => { setGeneratedNpcs([]); setIsNpcModalOpen(true); }}
                className="w-full sm:w-auto bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/20 p-2.5 sm:p-2 px-6 sm:px-4 rounded font-bold font-cinzel text-xs sm:text-sm transition-all shadow-md hover:border-rpg-gold active:scale-95"
              >
                🎲 Gerador de NPC
              </button>
            </div>
          </section>

          {/* Split View: Campaigns & Characters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLUMN 1: CAMPAIGNS */}
            <section>
              <div className="flex justify-between items-center mb-6 gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-2 flex-grow truncate">
                  🏰 Campanhas
                </h2>
                <button
                  onClick={handleOpenNewCampaign}
                  className="bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark p-2 px-3 sm:px-4 rounded font-bold font-cinzel text-[10px] sm:text-sm transition-all shadow-lg hover:shadow-glow-gold border border-rpg-gold/50 flex-shrink-0 active:scale-95"
                >
                  + Nova
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-10 font-medieval text-rpg-grey animate-pulse">Carregando mapas...</div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <Link href={`/campanha/${campaign.id}`} key={campaign.id} className="block">
                      <div className="bg-rpg-panel rounded-lg border border-rpg-gold/10 p-5 hover:border-rpg-gold/40 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden flex justify-between items-start">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rpg-gold/5 to-transparent rounded-bl-full pointer-events-none"></div>

                        <div className="flex-grow pr-4">
                          <h3 className="text-xl font-bold font-cinzel text-rpg-gold group-hover:text-rpg-light mb-1">{campaign.name}</h3>
                          <p className="text-rpg-parchment/70 font-medieval text-sm line-clamp-2">{campaign.description || "Sem descrição."}</p>
                        </div>

                        <div className="flex flex-col gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenEditCampaign(campaign, e)}
                            className="text-rpg-grey hover:text-rpg-gold p-1 hover:bg-rpg-slate rounded transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => handleDeleteCampaign(campaign.id, campaign.name, e)}
                            className="text-rpg-grey hover:text-red-400 p-1 hover:bg-rpg-slate rounded transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-rpg-grey/20 rounded-lg bg-rpg-panel/50">
                  <p className="text-rpg-grey font-medieval mb-2">Nenhuma campanha ativa.</p>
                  <button onClick={handleOpenNewCampaign} className="text-rpg-gold hover:underline font-cinzel text-sm">Criar a primeira</button>
                </div>
              )}
            </section>

            {/* COLUMN 2: CHARACTERS */}
            <section>
              <div className="flex justify-between items-center mb-6 gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-2 flex-grow truncate">
                  👤 Personagens
                </h2>
                <Link href="/personagens" className="text-rpg-grey hover:text-rpg-gold text-xs sm:text-sm font-medieval underline flex-shrink-0">
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

      {/* Modal de Criação/Edição de Campanha */}
      <Modal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} title={editingCampaignId ? "Editar Campanha" : "Nova Campanha"}>
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
              className="w-full sm:w-auto bg-rpg-gold hover:bg-rpg-gold/80 p-3 px-8 rounded font-bold font-cinzel text-base sm:text-lg text-rpg-dark transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-glow-gold border border-rpg-gold/50"
            >
              {editingCampaignId ? 'Salvar Alterações' : 'Iniciar Saga'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Gerador de NPC */}
      <Modal isOpen={isNpcModalOpen} onClose={() => setIsNpcModalOpen(false)} title="Gerador de NPCs">
        <form onSubmit={handleGenerateNpcs} className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full relative z-50">
              <div className="flex justify-between items-center mb-2">
                <label className="font-cinzel text-rpg-gold font-bold">Profissão / Arquétipo</label>
              </div>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval cursor-pointer appearance-none max-h-48 overflow-y-auto"
                style={{ maxHeight: '150px' }}
              >
                <option>Aleatória</option>
                {npcTraits.professions.map(p => <option key={p}>{p}</option>)}
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
            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white p-3 px-8 rounded font-bold font-cinzel text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg border border-white/10">
              Gerar NPCs
            </button>
          </div>
        </form>

        {generatedNpcs.length > 0 && (
          <div className="mt-6 border-t border-rpg-gold/20 pt-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {generatedNpcs.map((npc, index) => (
              <div key={index} className="bg-rpg-slate/50 rounded-lg p-4 border border-rpg-gold/10 shadow-md animate-fade-in hover:border-rpg-gold/30 transition-colors">
                <h3 className="font-medieval text-xl text-rpg-gold font-bold mb-1">{npc.profession} <span className="text-sm text-rpg-grey font-sans">({npc.race})</span></h3>
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
