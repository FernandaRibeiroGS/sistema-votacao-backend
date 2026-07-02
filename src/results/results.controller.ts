import { Controller, Get, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAdminGuard } from '../admin/guards/jwt-admin.guard';
import { RolesGuard, Roles } from '../admin/guards/roles.guard';
import { AdminRole } from '../admin/entities/admin.entity';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  // Público — resultados ao vivo do concurso ativo
  @Get('results/live')
  async getLive(@Query('contestId') contestId?: string) {
    return this.resultsService.getLiveResults(contestId ? Number(contestId) : undefined);
  }

  // Público — dados temporais para gráfico de linha
  @Get('results/:contestId/temporal')
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
}
