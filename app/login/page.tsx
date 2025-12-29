'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
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
      router.push('/');
    } catch (error: any) {
      setError("Não foi possível fazer login com o Google. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-start p-4">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold font-serif text-accent">D&D Campanha e Álcool</h1>
            <p className="text-text/80 font-sans">Sua aventura começa aqui</p>
        </div>
      <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-accent/20 shadow-glow-accent">
        <h2 className="text-3xl font-bold mb-6 text-center font-serif text-text">Login</h2>
        {error && <p className="bg-primary/20 text-text p-3 rounded-md mb-4 text-center font-sans">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block mb-2 font-serif text-text/90">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-serif text-text/90">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-background-end border border-text/20 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-sans"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/80 p-3 rounded font-bold font-serif text-lg text-text transition-all transform hover:scale-105 shadow-lg hover:shadow-glow-primary"
          >
            Entrar na Taverna
          </button>
        </form>
        <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-text/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-text/80 font-sans">Ou continue com</span>
            </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded font-bold transition-colors flex items-center justify-center font-sans text-text transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 398.2 0 256S111.8 0 244 0c71.2 0 135.2 28.7 180.8 75.2L376 128C344.9 99.1 298.6 80 244 80 154.1 80 84.4 149.3 84.4 240s69.7 160 159.6 160c68.3 0 112.5-30.4 133.2-51.2 16.6-16.6 25.1-38.8 28.2-64.8H244V261.8h244z"/>
            </svg>
            Google
          </button>
        </div>
        <div className="mt-8 text-center">
          <p className="font-sans text-text/80">Não tem um grimório? <Link href="/register" className="text-accent hover:underline font-bold">Crie uma conta</Link></p>
        </div>
      </div>
    </div>
  );
}
