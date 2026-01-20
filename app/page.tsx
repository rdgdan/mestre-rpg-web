'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/home');
  }, [router]);

  return (
    <div 
      className="text-white p-8 flex items-center justify-center"
      style={{
        background: 'linear-gradient(160deg, rgba(10, 14, 40, 0.95), rgba(12, 8, 22, 0.94))',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-serif text-rpg-gold mb-4 animate-fade-up">Carregando Salão...</h1>
        <p className="text-rpg-parchment/60 animate-fade-up">Buscando seus heróis no plano astral...</p>
      </div>
    </div>
  );
}
