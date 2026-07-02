import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { ResultsSummary } from '../vote/entities/results-summary.entity';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, ResultsSummary]), AuditModule],
  providers: [CandidateService],
  controllers: [CandidateController],
  exports: [CandidateService],
})
export class CandidateModule {}
