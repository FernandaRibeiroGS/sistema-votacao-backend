import { Controller, Get, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAdminGuard } from '../admin/guards/jwt-admin.guard';
import { RolesGuard, Roles } from '../admin/guards/roles.guard';
import { AdminRole } from '../admin/entities/admin.entity';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  // Administrativo — resultados ao vivo do concurso ativo
  @Get('results/live')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async getLive(@Query('contestId') contestId?: string) {
    return this.resultsService.getLiveResults(contestId ? Number(contestId) : undefined);
  }

  // Administrativo — dados temporais para gráfico de linha
  @Get('results/:contestId/temporal')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async getTemporal(@Param('contestId', ParseIntPipe) contestId: number) {
    return this.resultsService.getTemporalData(contestId);
  }

  // Administrativo — dashboard com totais e status
  @Get('admin/dashboard')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async getDashboard() {
    return this.resultsService.getDashboard();
  }

  // Administrativo — gerar relatório detalhado dos votos
  @Get('admin/reports/votes/:contestId')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  async getVoteReport(@Param('contestId', ParseIntPipe) contestId: number) {
    return this.resultsService.getVoteReport(contestId);
  }
}
