"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipo para o usuário
export interface User {
  id: string;
  nickname: string;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signIn: (nickname: string) => void;
  signOut: () => void;
}

// Criando o contexto com valor inicial
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signIn: () => {},
  signOut: () => {}
});

// Chave para armazenamento no localStorage
const USER_STORAGE_KEY = 'memory_game_user';

// Provider do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    // Verificamos se estamos no navegador antes de tentar acessar localStorage
    if (typeof window !== 'undefined') {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Salvar usuário no localStorage sempre que mudar
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  // Função para fazer login
  const signIn = (nickname: string) => {
    const newUser: User = {
      id: crypto.randomUUID(), // ID único para o usuário
      nickname
    };
    
    setUser(newUser);
  };

  // Função para fazer logout
  const signOut = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useAuth() {
  return useContext(AuthContext);
} 