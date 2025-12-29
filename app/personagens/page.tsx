'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
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
        console.error("Erro ao buscar personagens:", error);
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
      console.log("Personagem importado com sucesso! ID:", newCharDoc.id);
      alert("Personagem importado com sucesso!");

    } catch (error) {
      console.error("Erro ao importar personagem:", error);
      alert(`Não foi possível importar o personagem. Verifique o console para mais detalhes.`);
    } finally {
      setIsLoading(false);
       if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreateCharacter = () => {
      router.push(`/personagem/novo`);
  };

  const handleDeleteCharacter = async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault(); // Previne o clique no link do card
    e.stopPropagation(); // Para a propagação do evento
    if (!confirm("Tem certeza que deseja apagar esta ficha de personagem? Esta ação é irreversível.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'personagens', id));
    } catch (error) {
      console.error("Erro ao deletar personagem:", error);
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
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-8">
       {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="text-center">
            <p className="text-2xl font-serif text-yellow-400 mb-2">Importando Aventureiro...</p>
            <p className="text-gray-300">Abrindo o portal e trazendo os dados...</p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <Link href="/" legacyBehavior>
                <a className="text-sm text-yellow-400 hover:underline">&larr; Voltar ao Painel</a>
            </Link>
          <h1 className="text-4xl font-serif text-yellow-400 text-center sm:text-left">Salão de Personagens</h1>
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
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded shadow-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
            >
              Importar Personagem
            </button>
            <button 
              onClick={handleCreateCharacter}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded shadow-lg transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
            >
              Criar Novo Personagem
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <Link key={char.id} href={`/personagem/${char.id}`} passHref legacyBehavior>
                <a className="block bg-gray-800 p-6 rounded-lg shadow-lg border border-yellow-500/20 flex flex-col justify-between transition-all transform hover:-translate-y-1 hover:border-yellow-400 relative overflow-hidden cursor-pointer">
                    {char.imageUrl && (
                        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-20" style={{ backgroundImage: `url(${char.imageUrl})` }}></div>
                    )} 
                    <div className="relative z-10 flex flex-col h-full">
                        <div>
                            <h2 className="text-2xl font-bold text-yellow-400 truncate">{char.name || "Personagem sem nome"}</h2>
                            <p className="text-gray-400 capitalize">{(char.race || 'Raça')} {(char.class || 'Classe')} Nível {char.level || 1}</p>
                        </div>
                        <div className="flex justify-end gap-2 mt-auto pt-4">
                            <button 
                                onClick={(e) => handleDeleteCharacter(e, char.id)}
                                className="bg-red-800 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-opacity opacity-70 hover:opacity-100 z-20"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </a>
            </Link>
          ))}
           {characters.length === 0 && !isLoading && (
              <div className="col-span-full text-center bg-gray-800/50 border border-dashed border-gray-600 rounded-lg p-12 mt-10">
                  <h3 className="text-2xl font-serif text-gray-400">O Salão está vazio</h3>
                  <p className="text-gray-500 mt-2">Você pode criar um personagem do zero ou importar um arquivo .rpg!</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
