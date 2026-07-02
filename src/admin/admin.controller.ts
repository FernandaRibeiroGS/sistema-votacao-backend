import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { RolesGuard, Roles } from './guards/roles.guard';
import { AdminRole } from './entities/admin.entity';

interface AdminRequest extends Request {
  user: { id: number; email: string; role: AdminRole };
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('auth/login')
  async login(@Body() dto: LoginAdminDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.adminService.login(dto, ip);
  }

  @Get('users')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async findAll() {
    return this.adminService.findAll();
  }

  @Post('users')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async create(@Body() dto: CreateAdminDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.adminService.create(dto, req.user.id, ip);
  }

  @Put('users/:id')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.adminService.update(id, dto, req.user.id, ip);
  }

  @Delete('users/:id')
  @UseGuards(JwtAdminGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  async deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    await this.adminService.deactivate(id, req.user.id, ip);
    return { message: 'Usuário desativado com sucesso.' };
  }
}
