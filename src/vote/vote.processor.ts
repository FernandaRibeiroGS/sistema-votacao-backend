import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { ResultsSummary } from './entities/results-summary.entity';
import { ResultsGateway } from '../results/results.gateway';

@Processor('votes-queue')
export class VoteProcessor extends WorkerHost {
  private readonly logger = new Logger(VoteProcessor.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly resultsGateway: ResultsGateway,
  ) { super(); }

  async process(job: Job<any>): Promise<void> {
    if (job.name !== 'new-vote') return;

    const { cpfHash, contestId, candidateChildId, candidateAdultId, ip, userAgent, votedAt } = job.data;
    this.logger.log(`Processando job ${job.id} — CPF hash: ${cpfHash.substring(0, 8)}...`);

    try {
      await this.entityManager.transaction(async (em) => {
        const voteRepo = em.getRepository(Vote);
        const summaryRepo = em.getRepository(ResultsSummary);

        await voteRepo.save(
          voteRepo.create({
            cpf_hash: cpfHash,
            contest_id: contestId,
            candidate_adult_id: candidateAdultId,
            candidate_child_id: candidateChildId,
            ip: ip ?? null,
            user_agent: userAgent ?? null,
            voted_at: new Date(votedAt),
          }),
        );

        await Promise.all([
          summaryRepo.increment({ candidate_id: candidateAdultId }, 'total_votes', 1),
          summaryRepo.increment({ candidate_id: candidateChildId }, 'total_votes', 1),
        ]);
      });

      this.logger.log(`Job ${job.id} processado com sucesso.`);

      // Emite resultados atualizados via WebSocket para todos os clientes conectados
      await this.resultsGateway.broadcastResults(contestId);
    } catch (error) {
      this.logger.error(`Falha no job ${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
