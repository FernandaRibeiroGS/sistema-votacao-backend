import { Controller, Get, Post, Put, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { Request } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAdminGuard } from '../admin/guards/jwt-admin.guard';
import { RolesGuard, Roles } from '../admin/guards/roles.guard';
import { AdminRole } from '../admin/entities/admin.entity';

interface AdminRequest extends Request {
  user: { id: number; role: AdminRole };
}

@Controller('admin/categories')
@UseGuards(JwtAdminGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('contest/:contestId')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async findByContest(@Param('contestId', ParseIntPipe) contestId: number) {
    return this.categoryService.findByContest(contestId);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  async create(@Body() dto: CreateCategoryDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.categoryService.create(dto, req.user.id, ip);
  }

  @Put(':id')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    return this.categoryService.update(id, dto, req.user.id, ip);
  }
}
