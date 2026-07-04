'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Candidate } from '@/app/types';

interface StepSuccessProps {
  selectedChild: Candidate | null;
  selectedAdult: Candidate | null;
  onReset: () => void;
}

export function StepSuccess({ selectedChild, selectedAdult, onReset }: StepSuccessProps) {
  const [dataHora, setDataHora] = useState('');
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');

  useEffect(() => {
    const agora = new Date();
    setDataHora(agora.toLocaleString('pt-BR'));

    // Gerar um código de autenticação legível e aleatório
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = agora.getTime().toString().slice(-4);
    setCodigoConfirmacao(`VOTO-${randomHex}-${timestamp}`);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 text-center py-4">
      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-4xl animate-bounce">
        ✅
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">Voto Confirmado!</h2>
        <p className="text-stone-400 mt-1 text-sm">
          Seu voto foi registrado com sucesso.
        </p>
      </div>

      {/* Comprovante de Votação */}
      <div className="bg-stone-950 border border-stone-850 rounded-2xl p-5 w-full text-left font-sans shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="border-b border-stone-800 pb-3 mb-4 flex justify-between items-center">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">
            Comprovante de Voto
          </span>
          <span className="text-[10px] text-stone-500 font-mono">
            {codigoConfirmacao}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Categoria Infantil */}
          {selectedChild && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 flex-shrink-0">
                {selectedChild.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${selectedChild.foto}`}
                    alt={selectedChild.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-lg">👑</div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Categoria Infantil</p>
                <p className="text-sm font-bold text-white">{selectedChild.nome}</p>
                {selectedChild.numero && (
                  <p className="text-xs text-amber-500/80 font-mono">Nº {selectedChild.numero}</p>
                )}
              </div>
            </div>
          )}

          {/* Categoria Adulta */}
          {selectedAdult && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-900 border border-stone-800 flex-shrink-0">
                {selectedAdult.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${selectedAdult.foto}`}
                    alt={selectedAdult.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-lg">👑</div>
                )}
              </div>
              <div>
                <p className="text-[10px] text-stone-500 uppercase font-semibold">Categoria Adulta</p>
                <p className="text-sm font-bold text-white">{selectedAdult.nome}</p>
                {selectedAdult.numero && (
                  <p className="text-xs text-amber-500/80 font-mono">Nº {selectedAdult.numero}</p>
                )}
              </div>
            </div>
          )}

          {/* Rodapé do comprovante */}
          <div className="border-t border-stone-800 pt-3 mt-2 flex flex-col gap-1 text-[11px] text-stone-500">
            <p>
              <span className="font-semibold text-stone-400">Data/Hora:</span> {dataHora}
            </p>
            <p className="leading-relaxed">
              Este é um comprovante digital de votação. Cada CPF tem direito a apenas um voto.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={onReset} className="w-full">
        Voltar para o Início
      </Button>
    </div>
  );
}
