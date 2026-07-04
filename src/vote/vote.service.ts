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

    // 2. Valida matematicamente antes de qualquer outra coisa
    const cleanCpf = sanitizeCpf(cpf);
    if (!isValidCpf(cleanCpf)) {
      throw new HttpException('CPF inválido.', HttpStatus.BAD_REQUEST);
    }

    const apiToken = this.config.get<string>('CPF_API_TOKEN');
    const apiPackageId = this.config.get<string>('CPF_API_PACKAGE_ID');

    if (apiToken && apiToken !== 'placeholder' && apiPackageId) {
      try {
        const url = `https://api.cpfcnpj.com.br/${apiToken}/${apiPackageId}/${cleanCpf}`;
        const response = await fetch(url);
        
        let responseText = '';
        try {
          responseText = await response.text();
        } catch {}

        if (!response.ok) {
          this.logger.error(`Erro na API cpfcnpj.com.br (Status: ${response.status}). Resposta: ${responseText}`);
          throw new HttpException(
            `Erro de comunicação com a Receita Federal (Código ${response.status}). Verifique o token/pacote no .env.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch {
          this.logger.error(`Resposta da API do CPF não é um JSON válido: ${responseText}`);
          throw new HttpException('Erro na resposta do serviço de validação.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Na API do cpfcnpj.com.br, status 1, "1", 200 ou true significam sucesso
        const isSuccess = data.status === 1 || data.status === '1' || data.status === 200 || data.status === '200' || data.status === true || data.status === 'true';
        if (!isSuccess) {
          this.logger.error(`Erro retornado pela API do CPF: ${JSON.stringify(data)}`);
          const errorMsg = data.erro || data.message || data.error || 'CPF não encontrado ou inválido na Receita Federal.';
          throw new HttpException(errorMsg, HttpStatus.BAD_REQUEST);
        }

        // Alguns pacotes retornam os dados aninhados em 'data', outros na raiz da resposta
        const resultData = data.data || data;

        // Validar Nome Completo do Titular do CPF (para o Plano A)
        const apiNome = resultData.nome;
        if (apiNome) {
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
          const apiWords = cleanString(apiNome).split(' ').filter(w => w.length > 0);

          if (userWords.length < 2) {
            throw new HttpException('Digite seu nome completo (nome e pelo menos um sobrenome).', HttpStatus.BAD_REQUEST);
          }

          // Confere se cada palavra digitada pelo usuário está contida no nome oficial retornado pela API
          const allWordsMatch = userWords.every(word => apiWords.includes(word));
          if (!allWordsMatch) {
            throw new HttpException('O nome informado não corresponde ao titular deste CPF.', HttpStatus.BAD_REQUEST);
          }
        } else {
          this.logger.warn('A API do CPF não retornou o nome do titular. A validação de nome foi pulada.');
        }

        const situacao = resultData.situacao?.toLowerCase();
        if (situacao) {
          if (situacao !== 'regular') {
            throw new HttpException(
              `O CPF informado está com situação cadastral '${resultData.situacao}' e não está apto a votar.`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      } catch (err: any) {
        if (err instanceof HttpException) throw err;
        this.logger.error(`Erro ao consultar API de CPF: ${err.message}`);
        throw new HttpException(
          'Serviço de validação de CPF temporariamente indisponível. Tente novamente.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    } else {
      this.logger.warn('Chave da API de CPF não configurada. Validação externa ignorada.');
    }

    // 4. Verifica se votação está aberta (RN08)
    const contest = await this.contestService.getActiveContest();

    const salt = this.config.get<string>('CPF_SALT');
    const cpfHash = createHash('sha256').update(cleanCpf + salt).digest('hex');

    // 5. Verifica Redis antes de qualquer outra operação (RN01)
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
}
