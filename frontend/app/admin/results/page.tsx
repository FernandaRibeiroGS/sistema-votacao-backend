'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/app/lib/socket';
import { LiveResults, RankedCandidate } from '@/app/types';
import adminApi from '@/app/lib/adminApi';

const medals = ['🥇', '🥈', '🥉'];

function RankingRow({ candidate }: { candidate: RankedCandidate }) {
  return (
    <div className="flex items-center gap-3 bg-stone-850 rounded-xl p-3 border border-stone-800">
      <span className="text-xl w-7 text-center flex-shrink-0">
        {medals[candidate.colocacao - 1] ?? `${candidate.colocacao}º`}
      </span>
      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0">
        {candidate.foto ? (
          <img
            src={candidate.foto.startsWith('http') ? candidate.foto : `${process.env.NEXT_PUBLIC_API_URL}${candidate.foto}`}
            alt={candidate.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-lg">👑</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{candidate.nome}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-stone-800 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${candidate.percentual}%` }}
            />
          </div>
          <span className="text-amber-400 text-xs font-bold flex-shrink-0">{candidate.percentual}%</span>
        </div>
      </div>
      <span className="text-stone-400 text-xs flex-shrink-0">{candidate.votos.toLocaleString('pt-BR')} votos</span>
    </div>
  );
}

export default function ResultsAdminPage() {
  const [results, setResults] = useState<LiveResults | null>(null);
  const [connected, setConnected] = useState(false);

  // Carga inicial via HTTP usando o adminApi (autenticado)
  useEffect(() => {
    adminApi.get<LiveResults>('/results/live').then(({ data }) => setResults(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-contest', {});
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('results-update', (data: LiveResults) => setResults(data));

    return () => {
      socket.off('results-update');
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-950 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              {connected ? 'Apuração Ao vivo' : 'Reconectando...'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {results?.contestNome ?? 'Apuração em Tempo Real'}
          </h1>
          {results && (
            <p className="text-stone-400 text-sm mt-2">
              {results.totalVotos.toLocaleString('pt-BR')} votos computados
            </p>
          )}
        </div>

        {!results && (
          <div className="text-center text-stone-500 py-16">
            <div className="text-5xl mb-3">⏳</div>
            <p>Carregando dados da apuração...</p>
          </div>
        )}

        {results && (
          <div className="flex flex-col gap-8">
            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
              <h2 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>👧</span> Categoria Infantil
              </h2>
              <div className="flex flex-col gap-3">
                {results.categorias.infantil.map((c) => (
                  <RankingRow key={c.id} candidate={c} />
                ))}
              </div>
            </section>

            <section className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
              <h2 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>👸</span> Categoria Adulta
              </h2>
              <div className="flex flex-col gap-3">
                {results.categorias.adulta.map((c) => (
                  <RankingRow key={c.id} candidate={c} />
                ))}
              </div>
            </section>

            <p className="text-stone-600 text-xs text-center">
              Atualizado em {new Date(results.atualizadoEm).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
