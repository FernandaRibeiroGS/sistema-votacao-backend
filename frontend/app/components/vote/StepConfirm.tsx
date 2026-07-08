'use client';

import { Candidate } from '@/app/types';
import { Button } from '@/app/components/ui/Button';

interface StepConfirmProps {
  selectedChild: Candidate;
  selectedAdult: Candidate;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

function CandidateSummary({ label, candidate }: { label: string; candidate: Candidate }) {
  return (
    <div className="bg-stone-800 rounded-2xl p-4 flex items-center gap-4 border border-stone-700">
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-700 flex-shrink-0">
        {candidate.foto ? (
          <img
            src={candidate.foto.startsWith('http') ? candidate.foto : `${process.env.NEXT_PUBLIC_API_URL || ''}${candidate.foto}`}
            alt={candidate.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">👑</div>
        )}
      </div>
      <div>
        <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-white font-bold text-base mt-0.5">{candidate.nome}</p>
        {candidate.numero && <p className="text-stone-400 text-xs">Nº {candidate.numero}</p>}
      </div>
    </div>
  );
}

export function StepConfirm({ selectedChild, selectedAdult, onConfirm, onBack, loading }: StepConfirmProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="text-5xl mb-2">🗳️</div>
        <h2 className="text-xl font-bold text-white">Confirme seu voto</h2>
        <p className="text-stone-400 text-sm mt-1">Após confirmar, não será possível alterar.</p>
      </div>

      <div className="flex flex-col gap-3">
        <CandidateSummary label="Rainha Mirim" candidate={selectedChild} />
        <CandidateSummary label="Rainha" candidate={selectedAdult} />
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onConfirm} loading={loading} className="w-full py-4 text-base">
          ✅ Confirmar voto
        </Button>
        <Button onClick={onBack} variant="outline" disabled={loading} className="w-full">
          ← Voltar e alterar
        </Button>
      </div>
    </div>
  );
}
