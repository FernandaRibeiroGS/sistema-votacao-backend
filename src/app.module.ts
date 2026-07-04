import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { VoteModule } from './vote/vote.module';
import { ContestModule } from './contest/contest.module';
import { CategoryModule } from './category/category.module';
import { CandidateModule } from './candidate/candidate.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { ResultsModule } from './results/results.module';
import { Vote } from './vote/entities/vote.entity';
import { ResultsSummary } from './vote/entities/results-summary.entity';
import { Contest } from './contest/entities/contest.entity';
import { Category } from './category/entities/category.entity';
import { Candidate } from './candidate/entities/candidate.entity';
import { Admin } from './admin/entities/admin.entity';
import { AuditLog } from './audit/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE', 'votacao'),
        entities: [Vote, ResultsSummary, Contest, Category, Candidate, Admin, AuditLog],
        synchronize: true,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    VoteModule,
    ContestModule,
    CategoryModule,
    CandidateModule,
    AdminModule,
    AuditModule,
    ResultsModule,
  ],
})
export class AppModule {}
