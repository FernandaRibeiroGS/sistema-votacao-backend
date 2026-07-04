'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Contest } from '@/app/types/admin';
import { StatusBadge } from '@/app/components/admin/StatusBadge';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import { formatBRT } from '@/app/lib/dateUtils';
import toast, { Toaster } from 'react-hot-toast';

const statusActions: Record<string, { next: string; label: string; color: 'primary' | 'secondary' | 'outline' }> = {
  draft:    { next: 'open',     label: '▶ Abrir votação',    color: 'primary' },
  open:     { next: 'closed',   label: '⏹ Encerrar votação', color: 'secondary' },
  closed:   { next: 'finished', label: '✅ Finalizar',        color: 'outline' },
  finished: { next: '',         label: 'Finalizado',          color: 'outline' },
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchContests = useCallback(async () => {
    try {
      const { data } = await adminApi.get<Contest[]>('/admin/contests');
      setContests(data);
    } catch {
      toast.error('Erro ao carregar concursos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContests(); }, [fetchContests]);

  async function handleStatusChange(contest: Contest) {
    const action = statusActions[contest.status];
    if (!action.next) return;
    setUpdating(contest.id);
    try {
      await adminApi.put(`/admin/contests/${contest.id}/status`, { status: action.next });
      toast.success('Status atualizado com sucesso!');
      fetchContests();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erro ao atualizar status.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-8">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Concursos</h1>
          <p className="text-stone-500 text-sm mt-1">{contests.length} concurso(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/contests/new">
          <Button>+ Novo concurso</Button>
        </Link>
      </div>

      {loading && <p className="text-stone-500 text-sm">Carregando...</p>}

      {!loading && contests.length === 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
          <p className="text-stone-500 text-sm">Nenhum concurso cadastrado ainda.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {contests.map((contest) => {
          const action = statusActions[contest.status];
          return (
            <div key={contest.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-white font-bold truncate">{contest.nome}</h2>
                    <StatusBadge status={contest.status} />
                  </div>
                  <p className="text-stone-400 text-sm">{contest.cidade} — {contest.ano}</p>
                  <div className="flex gap-4 mt-2 text-xs text-stone-500">
                    <span>Início: {formatBRT(contest.inicio)}</span>
                    <span>Fim: {formatBRT(contest.encerramento)}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/admin/contests/${contest.id}/edit`}>
                    <Button variant="outline" className="text-xs px-3 py-2">
                      ✏️ Editar
                    </Button>
                  </Link>
                  <Link href={`/admin/categories?contestId=${contest.id}`}>
                    <Button variant="outline" className="text-xs px-3 py-2">
                      🏷️ Categorias
                    </Button>
                  </Link>
                  <Link href={`/admin/candidates?contestId=${contest.id}`}>
                    <Button variant="outline" className="text-xs px-3 py-2">
                      👸 Candidatas
                    </Button>
                  </Link>
                  {action.next && (
                    <Button
                      variant={action.color}
                      className="text-xs px-3 py-2"
                      loading={updating === contest.id}
                      onClick={() => handleStatusChange(contest)}
                    >
                      {action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
