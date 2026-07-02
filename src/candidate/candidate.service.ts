import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { ResultsSummary } from '../vote/entities/results-summary.entity';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(ResultsSummary)
    private readonly summaryRepository: Repository<ResultsSummary>,
    private readonly auditService: AuditService,
  ) {}

  async findByCategory(categoryId: number): Promise<Candidate[]> {
    return this.candidateRepository.find({
      where: { category_id: categoryId },
      order: { numero: 'ASC' },
    });
  }

  async create(dto: CreateCandidateDto, fotoPath: string | null, adminId: number, ip: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.save(
      this.candidateRepository.create({ ...dto, foto: fotoPath }),
    );

    await this.summaryRepository.save(
      this.summaryRepository.create({ candidate_id: candidate.id, total_votes: 0 }),
    );

    await this.auditService.log({ adminId, acao: 'CANDIDATA_CRIADA', detalhes: { id: candidate.id, nome: candidate.nome }, ip });
    return candidate;
  }

  async update(id: number, dto: UpdateCandidateDto, fotoPath: string | null, adminId: number, ip: string): Promise<Candidate> {
    const candidate = await this.findOneOrFail(id);
    Object.assign(candidate, dto);
    if (fotoPath) candidate.foto = fotoPath;

    const updated = await this.candidateRepository.save(candidate);
    await this.auditService.log({ adminId, acao: 'CANDIDATA_ATUALIZADA', detalhes: { id, changes: dto }, ip });
    return updated;
  }

  async remove(id: number, adminId: number, ip: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.candidateRepository.delete(id);
    await this.auditService.log({ adminId, acao: 'CANDIDATA_EXCLUIDA', detalhes: { id }, ip });
  }

  private async findOneOrFail(id: number): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({ where: { id } });
    if (!candidate) throw new HttpException('Candidata não encontrada.', HttpStatus.NOT_FOUND);
    return candidate;
  }
}
