'use client';

import { Candidate } from '@/app/types';
import { CheckCircle } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  selected: boolean;
  onSelect: (candidate: Candidate) => void;
}

export function CandidateCard({ candidate, selected, onSelect }: CandidateCardProps) {
  return (
    <button
      onClick={() => onSelect(candidate)}
      className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left
        ${selected
          ? 'border-amber-500 shadow-lg shadow-amber-500/30 scale-[1.02]'
          : 'border-stone-700 hover:border-stone-500'
        }`}
    >
      <div className="relative h-48 w-full bg-stone-800">
        {candidate.foto ? (
          <img
            src={candidate.foto.startsWith('http') ? candidate.foto : `${process.env.NEXT_PUBLIC_API_URL}${candidate.foto}`}
            alt={candidate.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-500 text-5xl">👑</div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
            <CheckCircle className="text-amber-400 w-12 h-12 drop-shadow-lg" />
          </div>
        )}
        {candidate.numero && (
          <span className="absolute top-2 left-2 bg-stone-900/80 text-amber-400 text-xs font-bold px-2 py-1 rounded-lg">
            Nº {candidate.numero}
          </span>
        )}
      </div>
      <div className="p-3 bg-stone-800">
        <p className="font-bold text-white text-sm truncate">{candidate.nome}</p>
        {candidate.descricao && (
          <p className="text-stone-400 text-xs mt-1 line-clamp-2">{candidate.descricao}</p>
        )}
      </div>
    </button>
  );
}
