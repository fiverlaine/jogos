import { ReactComponent as CardBack } from '@/assets/card-back.svg';
import { ReactComponent as Icon1 } from '@/assets/icons/icon1.svg';
import { ReactComponent as Icon2 } from '@/assets/icons/icon2.svg';
import { useState, useMemo } from 'react';

// ✅ Tipagem forte para ícones
type IconType = React.FC<React.SVGProps<SVGSVGElement>>;
const iconsMap: Record<string, IconType> = {
  icon1: Icon1,
  icon2: Icon2,
  // ... adicione outros ícones
};

const MemoryCard: React.FC<CardProps> = ({ card, onClick }) => {
  const CurrentIcon = iconsMap[card.icon];

  if (!CurrentIcon) {
    console.error(`Ícone ${card.icon} não registrado`); // Erro único
    return null;
  }

  return (
    <div 
      className={`memory-card ${card.isFlipped ? 'flipped' : ''}`}
      onClick={!card.isFlipped ? onClick : undefined}
      role="button"
      aria-label={`Carta ${card.id}`}
    >
      <div className="card-front">
        {card.isFlipped && (
          // ✅ Usando componente SVG diretamente
          <CurrentIcon 
            className="card-icon"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="card-back">
        <CardBack aria-hidden="true" />
      </div>
    </div>
  );
}; 