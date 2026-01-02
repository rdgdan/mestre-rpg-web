'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const redirectParam = searchParams.get('redirect');
  const registerLink = redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push(redirectUrl);
    } catch (error: any) {
      let friendlyMessage = "Ocorreu um erro ao tentar fazer login. Verifique suas credenciais.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        friendlyMessage = "Email ou senha inválidos.";
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
      console.error("Erro no Login Google:", error);
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      setError(`Erro no Login Google: ${error.code} - ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rpg-dark p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold font-cinzel text-rpg-gold text-shadow-lg tracking-wider">D&D Campanha e Álcool</h1>
        <p className="text-rpg-parchment/80 font-medieval text-xl mt-2">Sua aventura aguarda... e a bebida também.</p>
      </div>
      <div className="bg-rpg-panel p-8 rounded-lg shadow-2xl w-full max-w-md border-2 border-rpg-gold/30 shadow-black/50 backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6 text-center font-cinzel text-rpg-gold border-b border-rpg-gold/20 pb-4">Acesso à Taverna</h2>
        {error && <p className="bg-rpg-red/20 border border-rpg-red/40 text-red-200 p-3 rounded-md mb-4 text-center font-medieval">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-rpg-slate border border-rpg-gold/20 focus:outline-none focus:ring-2 focus:ring-rpg-gold text-rpg-parchment transition-all font-medieval placeholder-rpg-grey/30"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-cinzel text-rpg-gold font-bold">Senha</label>
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
            Entrar na Taverna
          </button>
        </form>
        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rpg-gold/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-rpg-panel text-rpg-grey font-medieval">Ou continue com</span>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-rpg-slate hover:bg-rpg-slate/80 border border-rpg-grey/30 p-3 rounded font-bold transition-all flex items-center justify-center font-sans text-rpg-parchment transform hover:scale-[1.02] hover:border-rpg-gold/50"
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 135.2 28.7 180.8 75.2L376 128C344.9 99.1 298.6 80 244 80 154.1 80 84.4 149.3 84.4 240s69.7 160 159.6 160c68.3 0 112.5-30.4 133.2-51.2 16.6-16.6 25.1-38.8 28.2-64.8H244V261.8h244z" />
            </svg>
            Google
          </button>
        </div>
        <div className="mt-8 text-center">
          <p className="font-medieval text-rpg-grey">Não tem um grimório? <Link href={registerLink} className="text-rpg-gold hover:text-rpg-gold-light hover:underline font-bold transition-colors">Crie uma conta</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-rpg-dark text-rpg-gold font-cinzel">Abrindo a taverna...</div>}>
      <LoginContent />
    </Suspense>
  );
}
