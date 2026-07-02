import { createHash } from 'crypto';
import { Injectable, HttpException, HttpStatus, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { isValidCpf, sanitizeCpf } from '../utils/cpf.util';
import { ContestService } from '../contest/contest.service';
import { Candidate } from '../candidate/entities/candidate.entity';
import { CategoryType } from '../category/entities/category.entity';

@Injectable()
export class VoteService implements OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(VoteService.name);

  constructor(
    @InjectQueue('votes-queue') private readonly votesQueue: Queue,
    @InjectRepository(Candidate) private readonly candidateRepository: Repository<Candidate>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly contestService: ContestService,
  ) {
    this.redisClient = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async getVoteOptions() {
    const contest = await this.contestService.getActiveContest();

    const candidates = await this.candidateRepository.find({
      where: { category: { contest_id: contest.id }, ativo: true },
      relations: ['category'],
      order: { numero: 'ASC' },
    });

    const infantil = candidates
      .filter((c) => c.category.tipo === CategoryType.INFANTIL)
      .map(this.formatCandidate);

    const adulta = candidates
      .filter((c) => c.category.tipo === CategoryType.ADULTA)
      .map(this.formatCandidate);

    return {
      contestId: contest.id,
      contestNome: contest.nome,
      encerramento: contest.encerramento,
      categorias: { infantil, adulta },
    };
  }

  async startVoteSession(
    cpf: string,
    captchaToken: string,
  ): Promise<{ token: string }> {
    await this.validateCaptcha(captchaToken);

    // RN07 — valida matematicamente antes de qualquer outra coisa
    const cleanCpf = sanitizeCpf(cpf);
    if (!isValidCpf(cleanCpf)) {
      throw new HttpException('CPF inválido.', HttpStatus.BAD_REQUEST);
    }

    // Verifica se votação está aberta (RN08)
    const contest = await this.contestService.getActiveContest();

    const salt = this.config.get<string>('CPF_SALT');
    const cpfHash = createHash('sha256').update(cleanCpf + salt).digest('hex');

    // Verifica Redis antes de qualquer outra operação (RN01)
    const hasVoted = await this.redisClient.get(`voted:${cpfHash}`);
    if (hasVoted) {
      throw new HttpException('Este CPF já votou.', HttpStatus.CONFLICT);
    }

    const token = await this.jwtService.signAsync(
      { sub: cpfHash, cpf: cpfHash, contestId: contest.id },
      { expiresIn: '10m' },
    );

    this.logger.log(`Sessão iniciada — CPF hash: ${cpfHash.substring(0, 8)}... | Concurso: ${contest.id}`);
    return { token };
  }

  async submitVote(
    cpfHash: string,
    contestId: number,
    candidateChildId: number,
    candidateAdultId: number,
    ip: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    // Verifica novamente a janela de votação (RN08, Etapa 4 do fluxo)
    await this.contestService.getActiveContest();

    // Dupla verificação no Redis (RN01, RN04)
    const hasVoted = await this.redisClient.get(`voted:${cpfHash}`);
    if (hasVoted) {
      throw new HttpException('Este CPF já votou.', HttpStatus.CONFLICT);
    }

    // Valida que ambas as candidatas existem e pertencem ao concurso correto (RN03)
    await this.validateCandidates(contestId, candidateChildId, candidateAdultId);

    // Marca como votado no Redis com TTL de 1 ano (RN06)
    await this.redisClient.set(`voted:${cpfHash}`, '1', 'EX', 31536000);

    await this.votesQueue.add('new-vote', {
      cpfHash,
      contestId,
      candidateChildId,
      candidateAdultId,
      ip,
      userAgent,
      votedAt: new Date().toISOString(),
    });

    this.logger.log(`Voto enfileirado — CPF hash: ${cpfHash.substring(0, 8)}... | Concurso: ${contestId}`);
    return { message: 'Voto recebido com sucesso! Obrigado por participar.' };
  }

  private async validateCandidates(
    contestId: number,
    candidateChildId: number,
    candidateAdultId: number,
  ): Promise<void> {
    const [child, adult] = await Promise.all([
      this.candidateRepository.findOne({
        where: { id: candidateChildId, ativo: true, category: { contest_id: contestId, tipo: CategoryType.INFANTIL } },
        relations: ['category'],
      }),
      this.candidateRepository.findOne({
        where: { id: candidateAdultId, ativo: true, category: { contest_id: contestId, tipo: CategoryType.ADULTA } },
        relations: ['category'],
      }),
    ]);

    if (!child) {
      throw new HttpException(
        'Candidata infantil inválida ou não pertence ao concurso ativo.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!adult) {
      throw new HttpException(
        'Candidata adulta inválida ou não pertence ao concurso ativo.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private formatCandidate(c: Candidate) {
    return {
      id: c.id,
      nome: c.nome,
      foto: c.foto,
      descricao: c.descricao,
      numero: c.numero,
    };
  }

  private async validateCaptcha(token: string): Promise<void> {
    const secretKey = this.config.get<string>('TURNSTILE_SECRET_KEY');

    if (!secretKey || secretKey === 'SUA_CHAVE_SECRETA_DO_CLOUDFLARE_AQUI') {
      this.logger.warn('Validação de captcha ignorada em ambiente de desenvolvimento.');
      return;
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });

    const data = await response.json() as { success: boolean };

    if (!data.success) {
      throw new HttpException('Captcha inválido.', HttpStatus.BAD_REQUEST);
    }
  }
}
