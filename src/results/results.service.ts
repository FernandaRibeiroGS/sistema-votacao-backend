import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultsSummary } from '../vote/entities/results-summary.entity';
import { Vote } from '../vote/entities/vote.entity';
import { Contest, ContestStatus } from '../contest/entities/contest.entity';
import { CategoryType } from '../category/entities/category.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(ResultsSummary)
    private readonly summaryRepository: Repository<ResultsSummary>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
  ) {}

  async getLiveResults(contestId?: number) {
    const contest = await this.resolveContest(contestId);
    if (!contest) return null;

    const summaries = await this.summaryRepository.find({
      relations: ['candidate', 'candidate.category'],
      where: { candidate: { category: { contest_id: contest.id }, ativo: true } },
    });

    const totalVotes = summaries.reduce((sum, s) => sum + Number(s.total_votes), 0);

    const buildRanking = (tipo: CategoryType) => {
      const filtered = summaries
        .filter((s) => s.candidate.category.tipo === tipo)
        .map((s) => ({
          id: s.candidate.id,
          nome: s.candidate.nome,
          foto: s.candidate.foto,
          numero: s.candidate.numero,
          votos: Number(s.total_votes),
          percentual: totalVotes > 0 ? +((Number(s.total_votes) / totalVotes) * 100).toFixed(2) : 0,
        }))
        .sort((a, b) => b.votos - a.votos)
        .map((c, i) => ({ ...c, colocacao: i + 1 }));

      return filtered;
    };

    return {
      contestId: contest.id,
      contestNome: contest.nome,
      status: contest.status,
      encerramento: contest.encerramento,
      totalVotos: totalVotes,
      atualizadoEm: new Date(),
      categorias: {
        infantil: buildRanking(CategoryType.INFANTIL),
        adulta: buildRanking(CategoryType.ADULTA),
      },
    };
  }

  async getDashboard() {
    const contests = await this.contestRepository.find({ order: { ano: 'DESC' } });
    const activeContest = contests.find((c) => c.status === ContestStatus.OPEN) ?? null;

    const now = new Date();
    let totalVotos = 0;
    let tempoRestante: string | null = null;

    if (activeContest) {
      totalVotos = await this.voteRepository.count({ where: { contest_id: activeContest.id } });

      const diff = activeContest.encerramento.getTime() - now.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        tempoRestante = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } else {
        tempoRestante = '00:00:00';
      }
    }

    return {
      concursoAtivo: activeContest
        ? {
            id: activeContest.id,
            nome: activeContest.nome,
            status: activeContest.status,
            inicio: activeContest.inicio,
            encerramento: activeContest.encerramento,
            tempoRestante,
          }
        : null,
      totalConcursos: contests.length,
      totalVotos,
      horarioAtual: now,
    };
  }

  async getTemporalData(contestId: number) {
    const votes = await this.voteRepository
      .createQueryBuilder('vote')
      .select("DATE_TRUNC('hour', vote.voted_at)", 'hora')
      .addSelect('COUNT(*)', 'total')
      .where('vote.contest_id = :contestId', { contestId })
      .groupBy("DATE_TRUNC('hour', vote.voted_at)")
      .orderBy("DATE_TRUNC('hour', vote.voted_at)", 'ASC')
      .getRawMany();

    return votes.map((v) => ({ hora: v.hora, total: Number(v.total) }));
  }

  private async resolveContest(contestId?: number): Promise<Contest | null> {
    if (contestId) {
      return this.contestRepository.findOne({ where: { id: contestId } });
    }
    return this.contestRepository.findOne({
      where: { status: ContestStatus.OPEN },
      order: { inicio: 'DESC' },
    });
  }

  async getVoteReport(contestId: number) {
    const votes = await this.voteRepository.find({
      where: { contest_id: contestId },
      relations: ['candidate_adult', 'candidate_child'],
      order: { voted_at: 'ASC' },
    });

    return votes.map((v) => ({
      id: v.id,
      eleitorNome: v.voter_name || 'Anônimo',
      eleitorCpf: v.voter_cpf || 'Não informado',
      eleitorDataNascimento: v.voter_birth_date || 'Não informada',
      candidataAdulta: v.candidate_adult ? `${v.candidate_adult.nome} (Nº ${v.candidate_adult.numero})` : 'Nenhuma',
      candidataInfantil: v.candidate_child ? `${v.candidate_child.nome} (Nº ${v.candidate_child.numero})` : 'Nenhuma',
      votoData: v.voted_at,
      ip: v.ip,
    }));
  }
}
