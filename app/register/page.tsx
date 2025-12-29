'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
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
        <h2 className="text-3xl font-bold mb-6 text-center font-serif text-text">Criar Conta</h2>
        {error && <p className="bg-primary/20 text-text p-3 rounded-md mb-4 text-center font-sans">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-6">
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
          <div className="mb-6">
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
            Forjar Personagem
          </button>
        </form>
         <div className="mt-8 text-center">
          <p className="font-sans text-text/80">Já tem uma conta? <Link href="/login" className="text-accent hover:underline font-bold">Entre na Taverna</Link></p>
        </div>
      </div>
    </div>
  );
}
