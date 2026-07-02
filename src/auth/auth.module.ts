import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-vote.strategy';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
