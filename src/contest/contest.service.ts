import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Contest, ContestStatus } from './entities/contest.entity';
import { CreateContestDto, UpdateContestDto } from './dto/contest.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContestService {
  private readonly logger = new Logger(ContestService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async getActiveContest(): Promise<Contest> {
    const now = new Date();

    const contest = await this.contestRepository.findOne({
      where: { status: ContestStatus.OPEN },
      order: { inicio: 'DESC' },
    });

    if (!contest) {
      throw new HttpException('Nenhuma votação está aberta no momento.', HttpStatus.FORBIDDEN);
    }

    if (now < contest.inicio) {
      throw new HttpException('A votação ainda não foi iniciada.', HttpStatus.FORBIDDEN);
    }

    if (now > contest.encerramento) {
      throw new HttpException('O período de votação foi encerrado.', HttpStatus.FORBIDDEN);
    }

    return contest;
  }

  async getCurrentContest(): Promise<Contest | null> {
    const contests = await this.contestRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });
    return contests[0] || null;
  }

  async findAll(): Promise<Contest[]> {
    return this.contestRepository.find({ order: { ano: 'DESC', created_at: 'DESC' } });
  }

  async findById(id: number): Promise<Contest> {
    const contest = await this.contestRepository.findOne({
      where: { id },
      relations: ['categories', 'categories.candidates'],
    });
    if (!contest) throw new HttpException('Concurso não encontrado.', HttpStatus.NOT_FOUND);
    return contest;
  }

  async create(dto: CreateContestDto, adminId: number, ip: string): Promise<Contest> {
    const contest = await this.contestRepository.save(
      this.contestRepository.create({
        ...dto,
        inicio: new Date(dto.inicio),
        encerramento: new Date(dto.encerramento),
      }),
    );
    await this.auditService.log({ adminId, acao: 'CONCURSO_CRIADO', detalhes: { id: contest.id, nome: contest.nome }, ip });
    return contest;
  }

  async update(id: number, dto: UpdateContestDto, adminId: number, ip: string): Promise<Contest> {
    const contest = await this.findById(id);

    if (dto.inicio) (dto as any).inicio = new Date(dto.inicio);
    if (dto.encerramento) (dto as any).encerramento = new Date(dto.encerramento);

    Object.assign(contest, dto);
    const updated = await this.contestRepository.save(contest);

    await this.auditService.log({ adminId, acao: 'CONCURSO_ATUALIZADO', detalhes: { id, changes: dto }, ip });
    return updated;
  }

  async updateStatus(id: number, status: ContestStatus, adminId: number, ip: string): Promise<Contest> {
    const contest = await this.findById(id);
    contest.status = status;
    const updated = await this.contestRepository.save(contest);
    await this.auditService.log({ adminId, acao: 'CONCURSO_STATUS_ALTERADO', detalhes: { id, status }, ip });
    return updated;
  }

  async resetVotes(contestId: number, adminId: number, ip: string): Promise<{ message: string }> {
    const contest = await this.findById(contestId);

    // 1. Deleta os votos do banco do concurso
    await this.contestRepository.manager.query(
      `DELETE FROM votes WHERE contest_id = $1`,
      [contestId],
    );

    // 2. Limpa o sumário de resultados
    await this.contestRepository.manager.query(
      `DELETE FROM results_summary WHERE candidate_id IN (
        SELECT c.id FROM candidates c
        INNER JOIN categories cat ON cat.id = c.category_id
        WHERE cat.contest_id = $1
      )`,
      [contestId],
    );

    // 3. Deleta os hashes de CPF votados no Redis para liberar nova votação
    try {
      const redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 0,
      });

      let cursor = '0';
      let keysDeleted = 0;
      do {
        const reply = await redis.scan(cursor, 'MATCH', 'voted:*', 'COUNT', 100);
        cursor = reply[0];
        const keys = reply[1];
        if (keys.length > 0) {
          await redis.del(...keys);
          keysDeleted += keys.length;
        }
      } while (cursor !== '0');

      this.logger.log(`Redis limpo para o concurso ${contestId}: ${keysDeleted} chaves deletadas.`);
      await redis.quit();
    } catch (err: any) {
      this.logger.error(`Erro ao limpar CPFs no Redis: ${err.message}`);
    }

    await this.auditService.log({
      adminId,
      acao: 'VOTOS_CONCURSO_ZERADOS',
      detalhes: { id: contestId, nome: contest.nome },
      ip,
    });

    return { message: 'Votos zerados e histórico de CPFs limpo com sucesso!' };
  }
}
