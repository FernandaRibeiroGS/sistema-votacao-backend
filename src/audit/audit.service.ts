import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    adminId?: number;
    acao: string;
    detalhes?: Record<string, any>;
    ip?: string;
  }): Promise<void> {
    await this.auditRepository.save(
      this.auditRepository.create({
        admin_id: params.adminId ?? null,
        acao: params.acao,
        detalhes: params.detalhes ?? null,
        ip: params.ip ?? null,
      }),
    );
  }
}
