'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Contest } from '@/app/types/admin';
import { Button } from '@/app/components/ui/Button';
import adminApi from '@/app/lib/adminApi';
import toast, { Toaster } from 'react-hot-toast';
import { FileDown, Search, Users, Trophy } from 'lucide-react';

interface VoteReportEntry {
  id: number;
  eleitorNome: string;
  eleitorCpf: string;
  eleitorDataNascimento: string;
  candidataAdulta: string;
  candidataInfantil: string;
  votoData: string;
  ip: string;
}

export default function ReportsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | ''>('');
  const [votes, setVotes] = useState<VoteReportEntry[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'grouped'>('list');

  // Carrega lista de concursos
  useEffect(() => {
    async function loadContests() {
      try {
        const { data } = await adminApi.get<Contest[]>('/admin/contests');
        setContests(data);
        if (data.length > 0) {
          // Preenche com o concurso ativo ou o primeiro da lista
          const active = data.find((c) => c.status === 'open') ?? data[0];
          setSelectedContestId(active.id);
        }
      } catch {
        toast.error('Erro ao carregar os concursos.');
      } finally {
        setLoadingContests(false);
      }
    }
    loadContests();
  }, []);

  // Carrega relatório de votos do concurso selecionado
  const loadReport = useCallback(async (contestId: number) => {
    setLoadingVotes(true);
    try {
      const { data } = await adminApi.get<VoteReportEntry[]>(`/admin/reports/votes/${contestId}`);
      setVotes(data);
    } catch {
      toast.error('Erro ao carregar o relatório de votos.');
    } finally {
      setLoadingVotes(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      loadReport(Number(selectedContestId));
    }
  }, [selectedContestId, loadReport]);

  // Filtra os votos por pesquisa (Nome ou CPF)
  const filteredVotes = useMemo(() => {
    return votes.filter((v) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        v.eleitorNome.toLowerCase().includes(query) ||
        v.eleitorCpf.includes(query)
      );
    });
  }, [votes, searchQuery]);

  // Agrupa os votos por candidata
  const groupedByCandidate = useMemo(() => {
    const grouped: Record<string, { total: number; votes: VoteReportEntry[] }> = {};

    votes.forEach((v) => {
      // Adiciona voto na candidata adulta
      const adult = `👸 ${v.candidataAdulta}`;
      if (!grouped[adult]) grouped[adult] = { total: 0, votes: [] };
      grouped[adult].votes.push(v);
      grouped[adult].total += 1;

      // Adiciona voto na candidata infantil
      const child = `👧 ${v.candidataInfantil}`;
      if (!grouped[child]) grouped[child] = { total: 0, votes: [] };
      grouped[child].votes.push(v);
      grouped[child].total += 1;
    });

    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [votes]);

  // Exportar dados para CSV com suporte a acentos no Excel (BOM UTF-8)
  function handleExportCSV() {
    if (votes.length === 0) {
      toast.error('Não há dados para exportar.');
      return;
    }

    const headers = [
      'ID Voto',
      'Nome do Eleitor',
      'CPF',
      'Data de Nascimento',
      'Voto Categoria Adulta',
      'Voto Categoria Infantil',
      'Data do Voto',
      'IP de Origem',
    ];

    const csvContent = [
      headers.join(';'), // Separador ponto e vírgula ideal para excel brasileiro
      ...votes.map((v) =>
        [
          v.id,
          `"${v.eleitorNome.replace(/"/g, '""')}"`,
          `"${v.eleitorCpf}"`,
          v.eleitorDataNascimento,
          `"${v.candidataAdulta.replace(/"/g, '""')}"`,
          `"${v.candidataInfantil.replace(/"/g, '""')}"`,
          new Date(v.votoData).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
          v.ip,
        ].join(';')
      ),
    ].join('\n');

    // Cria arquivo com BOM UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const contestName = contests.find(c => c.id === selectedContestId)?.nome ?? 'concurso';
    const cleanName = contestName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    link.setAttribute('download', `relatorio_votos_${cleanName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV baixado!');
  }

  return (
    <div className="p-8 min-h-screen bg-stone-950 text-white flex flex-col gap-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1917', color: '#fff', border: '1px solid #44403c' } }} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-amber-500 w-7 h-7" /> Relatório Geral de Votos
          </h1>
          <p className="text-stone-500 text-sm mt-1">Auditagem de eleitores e escolhas do concurso</p>
        </div>

        {/* Seleção do Concurso */}
        <div className="flex items-center gap-3">
          <label className="text-stone-400 text-sm font-medium whitespace-nowrap">Concurso:</label>
          <select
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value ? Number(e.target.value) : '')}
            disabled={loadingContests}
            className="bg-stone-900 border border-stone-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer text-sm"
          >
            {loadingContests && <option>Carregando concursos...</option>}
            {contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.status === 'open' ? 'Aberto' : 'Fechado'})
              </option>
            ))}
          </select>

          <Button
            onClick={handleExportCSV}
            disabled={loadingVotes || votes.length === 0}
            className="flex items-center gap-2 text-sm py-2 px-4"
          >
            <FileDown className="w-4 h-4" /> Exportar Planilha
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {selectedContestId && !loadingVotes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-stone-900 border border-stone-850 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-2xl">🤠</div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-wider font-semibold">Total de Votos</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{votes.length.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
          
          <div className="bg-stone-900 border border-stone-850 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-2xl">👧</div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-wider font-semibold">Votos Categoria Infantil</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{votes.length.toLocaleString('pt-BR')}</h3>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-850 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-2xl">👸</div>
            <div>
              <p className="text-stone-500 text-xs uppercase tracking-wider font-semibold">Votos Categoria Adulta</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{votes.length.toLocaleString('pt-BR')}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-4 mt-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-stone-800 text-amber-400 border border-stone-700'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Listagem Geral
          </button>
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'grouped'
                ? 'bg-stone-800 text-amber-400 border border-stone-700'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Agrupado por Candidata
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar por Nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-stone-300 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
            />
          </div>
        )}
      </div>

      {/* Loader */}
      {loadingVotes && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-sm">Carregando relatório de votos...</p>
        </div>
      )}

      {/* Main Content */}
      {!loadingVotes && votes.length === 0 && (
        <div className="text-center text-stone-600 py-20 bg-stone-900 border border-stone-850 rounded-2xl">
          <Trophy className="w-12 h-12 mx-auto text-stone-700 mb-3" />
          <p className="text-base font-semibold">Nenhum voto registrado para este concurso.</p>
          <p className="text-xs text-stone-500 mt-1">Os votos aparecerão aqui assim que a votação for iniciada.</p>
        </div>
      )}

      {!loadingVotes && votes.length > 0 && activeTab === 'list' && (
        <div className="overflow-x-auto bg-stone-900 border border-stone-850 rounded-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-900/50">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Eleitor</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Data Nasc.</th>
                <th className="px-6 py-4">Voto Adulta</th>
                <th className="px-6 py-4">Voto Infantil</th>
                <th className="px-6 py-4">Data do Voto</th>
                <th className="px-6 py-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredVotes.map((v) => (
                <tr key={v.id} className="border-b border-stone-800/60 hover:bg-stone-850/50 transition-colors">
                  <td className="px-6 py-4 text-stone-500 font-mono">{v.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{v.eleitorNome}</td>
                  <td className="px-6 py-4 text-stone-300 font-mono">{v.eleitorCpf}</td>
                  <td className="px-6 py-4 text-stone-400">{v.eleitorDataNascimento}</td>
                  <td className="px-6 py-4 text-amber-400 font-medium">{v.candidataAdulta}</td>
                  <td className="px-6 py-4 text-amber-400 font-medium">{v.candidataInfantil}</td>
                  <td className="px-6 py-4 text-stone-400 text-xs">
                    {new Date(v.votoData).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </td>
                  <td className="px-6 py-4 text-stone-500 font-mono text-xs">{v.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVotes.length === 0 && (
            <div className="text-center text-stone-500 py-10">Nenhum eleitor encontrado para a pesquisa.</div>
          )}
        </div>
      )}

      {!loadingVotes && votes.length > 0 && activeTab === 'grouped' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedByCandidate.map(([candidateName, group]) => (
            <div key={candidateName} className="bg-stone-900 border border-stone-850 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="font-bold text-white text-base">{candidateName}</h3>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold px-3 py-1 rounded-full">
                  {group.total} voto(s)
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto flex flex-col gap-2 pr-1">
                {group.votes.map((v) => (
                  <div key={v.id} className="bg-stone-950/60 border border-stone-850/50 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-white font-bold">{v.eleitorNome}</p>
                      <p className="text-stone-500 font-mono mt-0.5">{v.eleitorCpf} | {v.eleitorDataNascimento}</p>
                    </div>
                    <span className="text-stone-500 text-[10px]">
                      {new Date(v.votoData).toLocaleDateString('pt-BR')} {new Date(v.votoData).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
