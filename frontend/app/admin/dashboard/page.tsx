'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/app/components/admin/StatCard';
import { StatusBadge } from '@/app/components/admin/StatusBadge';
import { Dashboard } from '@/app/types/admin';
import adminApi from '@/app/lib/adminApi';
import Link from 'next/link';

const BRT = { timeZone: 'America/Sao_Paulo' };

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: res } = await adminApi.get<Dashboard>('/admin/dashboard');
      setData(res);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return <div className="p-8 text-stone-500 text-sm">Carregando dashboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">
          Atualizado em {data ? new Date(data.horarioAtual).toLocaleTimeString('pt-BR', BRT) : '—'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total de votos" value={data?.totalVotos.toLocaleString('pt-BR') ?? '0'} icon="🗳️" color="amber" />
        <StatCard label="Concursos cadastrados" value={data?.totalConcursos ?? '0'} icon="🏆" color="blue" />
        <StatCard
          label="Status atual"
          value={data?.concursoAtivo ? 'Votação aberta' : 'Sem votação ativa'}
          icon={data?.concursoAtivo ? '🟢' : '🔴'}
          color={data?.concursoAtivo ? 'green' : 'red'}
        />
      </div>

      {data?.concursoAtivo ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Concurso ativo</p>
              <h2 className="text-xl font-bold text-white">{data.concursoAtivo.nome}</h2>
            </div>
            <StatusBadge status={data.concursoAtivo.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-stone-800 rounded-xl p-4">
              <p className="text-stone-400 text-xs mb-1">Início</p>
              <p className="text-white font-medium text-sm">
                {new Date(data.concursoAtivo.inicio).toLocaleString('pt-BR', BRT)}
              </p>
            </div>
            <div className="bg-stone-800 rounded-xl p-4">
              <p className="text-stone-400 text-xs mb-1">Encerramento</p>
              <p className="text-white font-medium text-sm">
                {new Date(data.concursoAtivo.encerramento).toLocaleString('pt-BR', BRT)}
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
            <p className="text-amber-400 text-sm font-medium">⏱ Tempo restante</p>
            <p className="text-amber-400 font-bold text-xl font-mono">{data.concursoAtivo.tempoRestante}</p>
          </div>

          <div className="mt-4">
            <Link href="/admin/results" className="text-sm text-amber-400 hover:underline">
              Ver apuração ao vivo →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <p className="text-stone-500 text-sm mb-4">Nenhuma votação ativa no momento.</p>
          <Link href="/admin/contests" className="text-amber-400 text-sm hover:underline">
            Gerenciar concursos →
          </Link>
        </div>
      )}
    </div>
  );
}
