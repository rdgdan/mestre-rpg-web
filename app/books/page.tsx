'use client';

import { useState } from 'react';
import { srdBook } from '@/lib/srd-book-data';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function BookPage() {
  const [selectedChapter, setSelectedChapter] = useState(srdBook.chapters[0]);
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redireciona para o login após o logout
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background-start text-text flex flex-col">
        {/* Cabeçalho Reutilizado */}
        <header className="bg-surface p-4 shadow-lg border-b-2 border-accent/20 sticky top-0 z-20">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/">
                    <h1 className="text-2xl font-bold font-serif text-accent cursor-pointer">D&D Campaign Manager</h1>
                </Link>
                <nav className="flex items-center gap-6">
                    <Link href="/" className="text-text/90 hover:text-primary transition-colors font-bold font-serif text-lg">
                        Minhas Campanhas
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

        {/* Conteúdo da Biblioteca */}
        <div className="container mx-auto flex-grow p-4 sm:p-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Navegação Lateral */}
                <aside className="w-full md:w-1/4 lg:w-1/5">
                    <div className="sticky top-24">
                        <h2 className="text-xl font-bold font-serif mb-4 text-accent">Sumário</h2>
                        <nav className="flex flex-col gap-2">
                            {srdBook.chapters.map(chapter => (
                                <button 
                                    key={chapter.id}
                                    onClick={() => setSelectedChapter(chapter)}
                                    className={`p-3 text-left rounded-lg font-serif transition-all transform hover:scale-105 hover:bg-surface/80 w-full 
                                        ${selectedChapter.id === chapter.id 
                                            ? 'bg-accent text-background-start shadow-lg shadow-glow-accent' 
                                            : 'bg-surface/50 hover:text-primary'}`}>
                                    {chapter.title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Conteúdo Principal */}
                <main className="w-full md:w-3/4 lg:w-4/5 bg-surface/80 rounded-lg p-6 sm:p-8 border border-text/10 shadow-xl">
                    <article className="prose prose-invert max-w-none prose-h1:font-serif prose-h1:text-accent prose-h2:font-serif prose-h3:font-serif prose-strong:text-accent/90">
                      <div dangerouslySetInnerHTML={{ __html: selectedChapter.content }} />
                    </article>
                </main>
            </div>
        </div>

         {/* Rodapé Reutilizado */}
        <footer className="text-center p-4 text-text/50 font-sans text-sm mt-8">
            <p>D&D Campaign Manager © 2024</p>
        </footer>
    </div>
  );
}
