import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  url: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  image,
  url,
  disabled = false,
  comingSoon = false
}) => {
  const cardContent = (
    <div className={`rounded-lg overflow-hidden shadow-lg bg-white transition-all ${disabled ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:transform hover:scale-105'}`}>
      <div className="relative h-48">
        <Image
          src={image}
          alt={title}
          layout="fill"
          objectFit="cover"
          className={disabled ? 'filter grayscale' : ''}
        />
        {comingSoon && (
          <div className="absolute top-0 right-0 bg-yellow-500 text-white py-1 px-3 rounded-bl-lg">
            Em breve
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return <div className="w-full">{cardContent}</div>;
  }

  return (
    <Link href={url} className="w-full">
      {cardContent}
    </Link>
  );
}; 