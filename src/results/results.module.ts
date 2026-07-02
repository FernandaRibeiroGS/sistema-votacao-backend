import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsService } from './results.service';
import { ResultsGateway } from './results.gateway';
import { ResultsController } from './results.controller';
import { ResultsSummary } from '../vote/entities/results-summary.entity';
import { Vote } from '../vote/entities/vote.entity';
import { Contest } from '../contest/entities/contest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResultsSummary, Vote, Contest])],
  providers: [ResultsService, ResultsGateway],
  controllers: [ResultsController],
  exports: [ResultsGateway],
})
export class ResultsModule {}
