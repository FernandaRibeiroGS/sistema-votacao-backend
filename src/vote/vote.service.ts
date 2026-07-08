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
import { Contest } from '../contest/entities/contest.entity';
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
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async getCurrentContest(): Promise<Contest | null> {
    return this.contestService.getCurrentContest();
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

  async generateCaptcha(): Promise<{ challenge: string; captchaKey: string }> {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    const challenge = `Quanto é ${num1} + ${num2}?`;
    const answer = num1 + num2;

    const captchaKey = await this.jwtService.signAsync(
      { answer },
      { expiresIn: '3m' },
    );

    return { challenge, captchaKey };
  }

  async startVoteSession(
    cpf: string,
    nomeCompleto: string,
    dataNascimento: string,
    captchaAnswer: string,
    captchaKey: string,
  ): Promise<{ token: string }> {
    // 1. Validar Captcha
    try {
      const payload = await this.jwtService.verifyAsync(captchaKey);
      if (!payload || payload.answer === undefined) {
        throw new HttpException('Desafio de captcha inválido.', HttpStatus.BAD_REQUEST);
      }
      if (Number(payload.answer) !== Number(captchaAnswer)) {
        throw new HttpException('Resposta do captcha incorreta.', HttpStatus.BAD_REQUEST);
      }
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException('Captcha expirado ou inválido. Tente novamente.', HttpStatus.BAD_REQUEST);
    }

    // 2. Valida matematicamente o CPF
    const cleanCpf = sanitizeCpf(cpf);
    if (!isValidCpf(cleanCpf)) {
      throw new HttpException('CPF inválido.', HttpStatus.BAD_REQUEST);
    }

    // 3. Valida se digitou o nome completo (nome e pelo menos um sobrenome)
    const cleanString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ') // remove espaços extras
        .trim();
    };
    const userWords = cleanString(nomeCompleto).split(' ').filter(w => w.length > 0);
    if (userWords.length < 2) {
      throw new HttpException('Digite seu nome completo (nome e pelo menos um sobrenome).', HttpStatus.BAD_REQUEST);
    }

    // 4. Valida se preencheu a data de nascimento no formato DD/MM/AAAA
    if (!dataNascimento || dataNascimento.trim().length !== 10) {
      throw new HttpException('Data de nascimento inválida. Digite no formato DD/MM/AAAA.', HttpStatus.BAD_REQUEST);
    }

    // 5. Verifica se votação está aberta (RN08)
    const contest = await this.contestService.getActiveContest();

    // 6. Gera hash do CPF
    const salt = this.config.get<string>('CPF_SALT');
    const cpfHash = createHash('sha256').update(cleanCpf + salt).digest('hex');

    // 7. Verifica se já votou antes
    const hasVoted = await this.redisClient.get(`voted:${cpfHash}`);
    if (hasVoted) {
      throw new HttpException('Este CPF já votou.', HttpStatus.CONFLICT);
    }

    // 8. Assina o Token JWT contendo os dados do eleitor no payload
    const token = await this.jwtService.signAsync(
      {
        sub: cpfHash,
        cpf: cpfHash,
        contestId: contest.id,
        voterName: nomeCompleto.trim(),
        voterCpf: cleanCpf,
        voterBirthDate: dataNascimento.trim()
      },
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
    voterName?: string,
    voterCpf?: string,
    voterBirthDate?: string,
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

    // Adiciona o voto na fila incluindo os dados do eleitor
    await this.votesQueue.add('new-vote', {
      cpfHash,
      contestId,
      candidateChildId,
      candidateAdultId,
      ip,
      userAgent,
      votedAt: new Date().toISOString(),
      voterName,
      voterCpf,
      voterBirthDate,
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
}
