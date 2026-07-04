import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-vote') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    cpf: string;
    contestId: number;
    voterName?: string;
    voterCpf?: string;
    voterBirthDate?: string;
  }) {
    return {
      cpfHash: payload.cpf,
      contestId: payload.contestId,
      voterName: payload.voterName,
      voterCpf: payload.voterCpf,
      voterBirthDate: payload.voterBirthDate,
    };
  }
}
