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
        <div className="min-h-screen bg-rpg-dark text-rpg-parchment flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {/* Cabeçalho Reutilizado */}
            <header className="bg-rpg-panel p-4 shadow-lg border-b-2 border-rpg-gold/30 sticky top-0 z-20 backdrop-blur-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/">
                        <h1 className="text-2xl font-bold font-cinzel text-rpg-gold cursor-pointer hover:text-rpg-gold-light transition-colors text-shadow-sm">D&D Campaign Manager</h1>
                    </Link>
                    <nav className="flex items-center gap-6">
                        <Link href="/" className="text-rpg-parchment/80 hover:text-rpg-gold transition-colors font-bold font-cinzel text-lg flex items-center gap-2">
                            <span>←</span> Retornar à Taverna
                        </Link>
                        {user && (
                            <div className="flex items-center font-medieval">
                                <span className="mr-4 hidden sm:inline text-rpg-grey">Olá, <span className="text-rpg-parchment font-bold">{user.displayName || user.email}</span></span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-rpg-red/80 hover:bg-rpg-red p-2 px-4 rounded font-bold font-cinzel text-white transition-all transform hover:scale-105 shadow-md hover:shadow-glow-red border border-rpg-red/50"
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
                            <h2 className="text-xl font-bold font-cinzel mb-4 text-rpg-gold border-b border-rpg-gold/20 pb-2">Sumário</h2>
                            <nav className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                                {srdBook.chapters.map(chapter => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`p-3 text-left rounded-lg font-medieval transition-all transform hover:translate-x-1 w-full border border-transparent
                                        ${selectedChapter.id === chapter.id
                                                ? 'bg-rpg-gold text-rpg-dark shadow-lg shadow-glow-gold/20 font-bold border-rpg-gold/50'
                                                : 'bg-rpg-panel hover:bg-rpg-slate hover:text-rpg-gold hover:border-rpg-gold/30 text-rpg-parchment'}`}>
                                        {chapter.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Conteúdo Principal */}
                    <main className="w-full md:w-3/4 lg:w-4/5 bg-rpg-panel rounded-lg p-6 sm:p-10 border-2 border-rpg-gold/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <svg className="w-64 h-64 text-rpg-gold" fill="currentColor" viewBox="0 0 100 100"><path d="M50 0 L100 50 L50 100 L0 50 Z" /></svg>
                        </div>
                        <article className="prose prose-invert max-w-none prose-h1:font-cinzel prose-h1:text-rpg-gold prose-h2:font-cinzel prose-h2:text-rpg-gold-light prose-h3:font-cinzel prose-h3:text-rpg-parchment prose-strong:text-rpg-gold prose-p:font-medieval prose-p:text-lg prose-p:leading-relaxed prose-li:font-medieval relative z-10">
                            <div dangerouslySetInnerHTML={{ __html: selectedChapter.content }} />
                        </article>
                    </main>
                </div>
            </div>

            {/* Rodapé Reutilizado */}
            <footer className="text-center p-6 text-rpg-grey/40 font-medieval text-sm mt-8 border-t border-rpg-gold/10 bg-rpg-dark/90">
                <p>D&D Campanha e Álcool © 2024</p>
            </footer>
        </div>
    );
}
