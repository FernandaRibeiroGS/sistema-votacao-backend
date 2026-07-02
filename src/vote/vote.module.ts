import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { VoteProcessor } from './vote.processor';
import { Vote } from './entities/vote.entity';
import { ResultsSummary } from './entities/results-summary.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { AuthModule } from '../auth/auth.module';
import { ContestModule } from '../contest/contest.module';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [
    AuthModule,
    ContestModule,
    ResultsModule,
    BullModule.registerQueue({ name: 'votes-queue' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10m' },
      }),
    }),
    TypeOrmModule.forFeature([Vote, ResultsSummary, Candidate]),
  ],
  controllers: [VoteController],
  providers: [VoteService, VoteProcessor],
})
export class VoteModule {}
