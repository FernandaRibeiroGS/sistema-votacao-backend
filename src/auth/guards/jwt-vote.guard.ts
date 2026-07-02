import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtVoteGuard extends AuthGuard('jwt-vote') {}
