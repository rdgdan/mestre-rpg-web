'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import Modal from '@/components/Modal';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import JSZip from 'jszip';
import { mapImportedDataToCharacter } from '@/lib/character-mapper';

// Tipagem para o personagem
interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  imageUrl?: string;
}

export default function CharacterListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; characterId: string | null; characterName: string | null }>({ open: false, characterId: null, characterName: null });

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(
        collection(db, 'personagens'),
        where('ownerId', '==', user.uid),
        orderBy('name', 'asc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const charsData: Character[] = [];
        querySnapshot.forEach((doc) => {
          charsData.push({ id: doc.id, ...doc.data() } as Character);
        });
        setCharacters(charsData);
        setIsLoading(false);
      }, (error) => {
        logger.error('Erro ao buscar personagens', error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setCharacters([]);
    }
  }, [user]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      alert("Você precisa estar logado para importar um personagem.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFiles = zip.file(/\.json$/i);

      if (jsonFiles.length === 0) {
        throw new Error("Arquivo JSON não encontrado no .rpg");
      }

      const jsonFile = jsonFiles[0];

      const jsonData = JSON.parse(await jsonFile.async("string"));
      const characterData = mapImportedDataToCharacter(jsonData, user.uid, ''); // Passa imageUrl vazia

      const newCharDoc = await addDoc(collection(db, 'personagens'), characterData);
      logger.info('Personagem importado com sucesso!', { id: newCharDoc.id });
      alert("Personagem importado com sucesso!");

    } catch (error) {
      logger.error('Erro ao importar personagem', error);
      alert(`Não foi possível importar o personagem. Verifique o console para mais detalhes.`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateCharacter = () => {
    router.push(`/personagem/novo`);
  };

  const handleDeleteCharacter = async (e: React.MouseEvent<HTMLButtonElement>, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDeleteModal({ open: true, characterId: id, characterName: name });
  };

  const executeDeleteCharacter = async () => {
    if (!confirmDeleteModal.characterId) return;
    try {
      await deleteDoc(doc(db, 'personagens', confirmDeleteModal.characterId));
      setConfirmDeleteModal({ open: false, characterId: null, characterName: null });
    } catch (error) {
      logger.error('Erro ao deletar personagem', error);
      alert("Não foi possível apagar o personagem. Tente novamente.");
    }
  };

  if (isLoading && characters.length === 0) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-serif text-yellow-400 mb-4">Carregando Salão...</h1>
          <p className="text-gray-400">Buscando seus heróis no plano astral...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rpg-dark text-rpg-parchment min-h-screen p-4 sm:p-6 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="text-center">
            <p className="text-3xl font-cinzel text-rpg-gold mb-2 text-shadow-lg animate-pulse">Invocando Aventureiro...</p>
            <p className="text-rpg-grey font-medieval text-lg">Abrindo o portal e trazendo os dados do plano astral...</p>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 border-b-2 border-rpg-gold/20 pb-6">
          <Link href="/" legacyBehavior>
            <a className="text-sm text-rpg-gold hover:text-rpg-gold-light hover:underline font-medieval tracking-widest uppercase">&larr; Retornar à Taverna</a>
          </Link>
          <h1 className="text-5xl font-bold font-cinzel text-rpg-gold text-center sm:text-left text-shadow-md">Salão dos Heróis</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".rpg"
            />
            <button
              onClick={handleImportClick}
              className="bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/30 font-bold py-3 px-6 rounded shadow-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto font-cinzel hover:shadow-glow-gold"
            >
              Importar Lenda
            </button>
            <button
              onClick={handleCreateCharacter}
              className="bg-rpg-gold hover:bg-rpg-gold/80 text-rpg-dark font-bold py-3 px-6 rounded shadow-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto font-cinzel hover:shadow-glow-gold border border-rpg-gold/50"
            >
              Novo Herói
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characters.map(char => (
            <Link key={char.id} href={`/personagem/${char.id}`} passHref legacyBehavior>
              <a className="block bg-rpg-panel p-0 rounded-lg shadow-xl border-2 border-rpg-gold/10 flex flex-col justify-between transition-all transform hover:-translate-y-2 hover:border-rpg-gold hover:shadow-glow-gold/40 relative overflow-hidden cursor-pointer group h-[300px]">
                {char.imageUrl ? (
                  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-40 group-hover:opacity-50 transition-opacity duration-500" style={{ backgroundImage: `url(${char.imageUrl})` }}></div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-rpg-slate to-rpg-dark z-0 opacity-80"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>

                <div className="relative z-20 flex flex-col h-full p-6">
                  <div className="border-b border-white/10 pb-4 mb-2">
                    <h2 className="text-3xl font-bold text-rpg-gold truncate font-medieval text-shadow-sm group-hover:text-rpg-gold-light transition-colors">{char.name || "Sem Nome"}</h2>
                    <p className="text-rpg-parchment/90 font-cinzel text-sm tracking-widest uppercase mt-1">{(char.race || 'Raça')} &bull; {(char.class || 'Classe')} &bull; Nível {char.level || 1}</p>
                  </div>

                  <div className="flex justify-end gap-2 mt-auto pt-4 relative">
                    <button
                      onClick={(e) => handleDeleteCharacter(e, char.id, char.name)}
                      className="bg-rpg-red/80 hover:bg-rpg-red text-white font-bold py-2 px-4 rounded border border-rpg-red/50 text-xs transition-all font-cinzel shadow-md hover:shadow-glow-red"
                      title="Apagar Herói Permanentemente"
                    >
                      Exilar
                    </button>
                  </div>
                </div>
              </a>
            </Link>
          ))}
          {characters.length === 0 && !isLoading && (
            <div className="col-span-full text-center bg-rpg-panel border-2 border-dashed border-rpg-grey/30 rounded-lg p-16 mt-4">
              <h3 className="text-3xl font-cinzel text-rpg-grey mb-4">O Salão está vazio...</h3>
              <p className="text-rpg-parchment/60 font-medieval text-lg max-w-xl mx-auto">Nenhum herói descansa aqui no momento. Você pode <strong className="text-rpg-gold">criar um personagem</strong> do zero ou <strong className="text-rpg-gold">importar</strong> um arquivo antigo.</p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={confirmDeleteModal.open}
        title="Exilar Herói"
        onClose={() => setConfirmDeleteModal({ open: false, characterId: null, characterName: null })}
      >
        <div className="text-center">
          <p className="text-rpg-parchment mb-6">Tem certeza que deseja exilar permanentemente <strong className="text-rpg-red">{confirmDeleteModal.characterName}</strong>? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setConfirmDeleteModal({ open: false, characterId: null, characterName: null })}
              className="bg-rpg-slate hover:bg-rpg-slate/80 text-rpg-parchment border border-rpg-gold/30 font-bold py-2 px-6 rounded transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={executeDeleteCharacter}
              className="bg-rpg-red hover:bg-rpg-red/80 text-white font-bold py-2 px-6 rounded transition-all"
            >
              Confirmar Exílio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
