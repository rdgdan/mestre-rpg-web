'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Enquanto carrega, pode-se exibir um spinner ou nada
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <p>Carregando...</p>
        </div>
    );
  }

  // Se o usuário estiver logado, mostra o conteúdo da página
  if (user) {
    return <>{children}</>;
  }

  // Se não estiver logado e ainda não redirecionou, não mostra nada
  return null;
}
