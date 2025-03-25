import React, { useEffect, useState } from 'react';
import { useMatches } from '../hooks/useMatches';
import { MatchCard } from './MatchCard';
import { SyncLoader } from 'react-spinners';

const MatchList = () => {
  const { matches, usingFallback } = useMatches();

  return (
    <div className="match-container">
      {usingFallback && (
        <div className="connection-warning">
          ⚠️ Modo offline - Atualizando a cada 10 segundos
        </div>
      )}
      
      {matches.length > 0 ? (
        matches.map(match => (
          <MatchCard key={match.id} match={match} />
        ))
      ) : (
        <div className="no-matches">
          <SyncLoader color="#36d7b7" />
          <p>Sincronizando partidas disponíveis...</p>
          <small>Última tentativa: {new Date().toLocaleTimeString()}</small>
        </div>
      )}
    </div>
  );
};

export default MatchList; 