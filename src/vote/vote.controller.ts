import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { VoteService } from './vote.service';
import { StartVoteDto } from './dto/start-vote.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { JwtVoteGuard } from '../auth/guards/jwt-vote.guard';
import { ContestStatus } from '../contest/entities/contest.entity';

interface AuthenticatedRequest extends Request {
  user: {
    cpfHash: string;
    contestId: number;
    voterName?: string;
    voterCpf?: string;
    voterBirthDate?: string;
  };
}

@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Get('current-contest')
  async getCurrentContest() {
    const contest = await this.voteService.getCurrentContest();
    if (!contest) {
      return null;
    }
    const now = new Date();
    const inicio = new Date(contest.inicio);
    const encerramento = new Date(contest.encerramento);

    return {
      id: contest.id,
      nome: contest.nome,
      inicio: contest.inicio,
      encerramento: contest.encerramento,
      status: contest.status,
      isUpcoming: contest.status === ContestStatus.DRAFT || now < inicio,
      isOpen: contest.status === ContestStatus.OPEN && now >= inicio && now <= encerramento,
    };
  }

  @Get('options')
  async getOptions() {
    return this.voteService.getVoteOptions();
  }

  @Get('captcha')
  async getCaptcha() {
    return this.voteService.generateCaptcha();
  }

  @Post('session')
  async startSession(@Body() dto: StartVoteDto) {
    return this.voteService.startVoteSession(
      dto.cpf,
      dto.nomeCompleto,
      dto.dataNascimento,
      dto.captchaAnswer,
      dto.captchaKey,
    );
  }

  @Post('submit')
  @UseGuards(JwtVoteGuard)
  async submitVote(@Req() req: AuthenticatedRequest, @Body() dto: SubmitVoteDto) {
    const ip = (req.headers['cf-connecting-ip'] as string)
      ?? (req.headers['x-forwarded-for'] as string)?.split(',')[0]
      ?? req.ip;

    const userAgent = req.headers['user-agent'] ?? '';

    return this.voteService.submitVote(
      req.user.cpfHash,
      req.user.contestId,
      dto.candidateChildId,
      dto.candidateAdultId,
      ip,
      userAgent,
      req.user.voterName,
      req.user.voterCpf,
      req.user.voterBirthDate,
    );
  }
}
