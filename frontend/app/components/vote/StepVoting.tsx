'use client';

import { Candidate, VoteOptions } from '@/app/types';
import { CandidateCard } from '@/app/components/ui/CandidateCard';
import { Button } from '@/app/components/ui/Button';
import { CheckCircle } from 'lucide-react';

interface StepVotingProps {
  options: VoteOptions;
  selectedChild: Candidate | null;
  selectedAdult: Candidate | null;
  onSelectChild: (c: Candidate) => void;
  onSelectAdult: (c: Candidate) => void;
  onConfirm: () => void;
}

export function StepVoting({ options, selectedChild, selectedAdult, onSelectChild, onSelectAdult, onConfirm }: StepVotingProps) {
  const canConfirm = selectedChild !== null && selectedAdult !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{options.contestNome}</h2>
        <p className="text-stone-400 text-sm mt-1">Escolha uma candidata em cada categoria</p>
      </div>

      {/* Categoria Infantil */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">👧 Categoria Infantil</span>
          {selectedChild && <CheckCircle className="w-4 h-4 text-green-400" />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.categorias.infantil.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              selected={selectedChild?.id === c.id}
              onSelect={onSelectChild}
            />
          ))}
        </div>
      </section>

      {/* Categoria Adulta */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">👸 Categoria Adulta</span>
          {selectedAdult && <CheckCircle className="w-4 h-4 text-green-400" />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.categorias.adulta.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              selected={selectedAdult?.id === c.id}
              onSelect={onSelectAdult}
            />
          ))}
        </div>
      </section>

      <Button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="w-full py-4 text-base sticky bottom-4"
      >
        {canConfirm ? 'Revisar meu voto →' : 'Selecione uma candidata em cada categoria'}
      </Button>
    </div>
  );
}
