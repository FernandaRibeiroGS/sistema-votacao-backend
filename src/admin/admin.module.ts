import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule,
    AuditModule,
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ADMIN_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [AdminService, JwtAdminStrategy],
  controllers: [AdminController],
  exports: [JwtAdminStrategy],
})
export class AdminModule {}
