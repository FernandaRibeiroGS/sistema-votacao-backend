import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { ContestService } from './contest.service';
import { CreateContestDto, UpdateContestDto } from './dto/contest.dto';
import { ContestStatus } from './entities/contest.entity';
import { JwtAdminGuard } from '../admin/guards/jwt-admin.guard';
import { RolesGuard, Roles } from '../admin/guards/roles.guard';
import { AdminRole } from '../admin/entities/admin.entity';

interface AdminRequest extends Request {
  user: { id: number; role: AdminRole };
}

@Controller('admin/contests')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ContestController {
  constructor(private readonly contestService: ContestService) {}

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async findAll() {
    return this.contestService.findAll();
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contestService.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  async create(@Body() dto: CreateContestDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.contestService.create(dto, req.user.id, ip);
  }

  @Put(':id')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContestDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.contestService.update(id, dto, req.user.id, ip);
  }

  @Put(':id/status')
  @Roles(AdminRole.ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContestStatus,
    @Req() req: AdminRequest,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.contestService.updateStatus(id, status, req.user.id, ip);
  }
}
