'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

function RegisterContent() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const redirectParam = searchParams.get('redirect');
  const loginLink = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      router.push(redirectUrl);
    } catch (error: any) {
      let friendlyMessage = "Ocorreu um erro ao criar a conta.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "Este email já está sendo usado por outra conta.";
      }
      setError(friendlyMessage);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push(redirectUrl);
    } catch (error: any) {
      setError("Não foi possível fazer login com o Google. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rpg-dark p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold font-cinzel text-rpg-gold text-shadow-lg tracking-wider">D&D Campanha e Álcool</h1>
        <p className="text-rpg-parchment/80 font-medieval text-xl mt-2">Sua aventura começa agora</p>
      </div>
      <div className="bg-rpg-panel p-8 rounded-lg shadow-2xl w-full max-w-md border-2 border-rpg-gold/30 shadow-black/50 backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6 text-center font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-4">Criar Grimório</h2>
        {error && <p className="bg-rpg-red/20 border border-rpg-red/40 text-red-200 p-3 rounded-md mb-4 text-center font-medieval">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Como devemos te chamar?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval placeholder-rpg-grey/30"
              placeholder="Ex: Mestre Arkan..."
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval placeholder-rpg-grey/30"
              placeholder="seu@novo-email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Senha da Alma</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval placeholder-rpg-grey/30"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-rpg-gold hover:bg-rpg-gold/80 p-3 rounded font-bold font-cinzel text-lg text-rpg-dark transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-glow-gold border border-rpg-gold/50"
          >
            Forjar Personagem
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="font-medieval text-rpg-grey">Já tem uma conta? <Link href={loginLink} className="text-rpg-gold hover:text-rpg-gold-light hover:underline font-bold transition-colors">Entre na Taverna</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-rpg-dark text-rpg-gold font-cinzel">Carregando grimório...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
