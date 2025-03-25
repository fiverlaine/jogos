'use client';

import { useEffect, useState, ReactNode } from 'react';

interface SafeHydrationProps {
  children: ReactNode;
}

export function SafeHydration({ children }: SafeHydrationProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Este código só executa no cliente
    setHydrated(true);
  }, []);

  // Renderiza um placeholder ou nada durante a hidratação no servidor
  if (!hydrated) {
    return null; // ou return <div className="min-h-[proporcional à altura do componente]" />;
  }

  // Renderiza o conteúdo após a hidratação no cliente
  return <>{children}</>;
} 