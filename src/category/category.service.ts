import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly auditService: AuditService,
  ) {}

  async findByContest(contestId: number): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { contest_id: contestId },
      relations: ['candidates'],
      order: { tipo: 'ASC' },
    });
  }

  async create(dto: CreateCategoryDto, adminId: number, ip: string): Promise<Category> {
    const category = await this.categoryRepository.save(
      this.categoryRepository.create(dto),
    );
    await this.auditService.log({ adminId, acao: 'CATEGORIA_CRIADA', detalhes: { id: category.id, nome: category.nome }, ip });
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto, adminId: number, ip: string): Promise<Category> {
    const category = await this.findOneOrFail(id);
    Object.assign(category, dto);
    const updated = await this.categoryRepository.save(category);
    await this.auditService.log({ adminId, acao: 'CATEGORIA_ATUALIZADA', detalhes: { id, changes: dto }, ip });
    return updated;
  }

  private async findOneOrFail(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new HttpException('Categoria não encontrada.', HttpStatus.NOT_FOUND);
    return category;
  }
}
