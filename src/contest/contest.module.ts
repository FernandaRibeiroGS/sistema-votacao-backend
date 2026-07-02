import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from './entities/contest.entity';
import { ContestService } from './contest.service';
import { ContestController } from './contest.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contest]), AuditModule],
  providers: [ContestService],
  controllers: [ContestController],
  exports: [ContestService],
})
export class ContestModule {}
