"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MemoryGameEntry from '@/components/online-game/memory-game-entry';

export const LoginForm = () => {
  const { signIn } = useAuth();

  const handleNicknameSubmit = (nickname: string) => {
    signIn(nickname);
  };

  return <MemoryGameEntry onSubmit={handleNicknameSubmit} />;
}; 