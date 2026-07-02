import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest, ContestStatus } from './entities/contest.entity';
import { CreateContestDto, UpdateContestDto } from './dto/contest.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContestService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    private readonly auditService: AuditService,
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
}
