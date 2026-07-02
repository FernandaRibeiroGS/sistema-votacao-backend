import {
  Controller, Get, Post, Put, Delete, Body, Param, Req,
  UseGuards, UseInterceptors, UploadedFile, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { JwtAdminGuard } from '../admin/guards/jwt-admin.guard';
import { RolesGuard, Roles } from '../admin/guards/roles.guard';
import { AdminRole } from '../admin/entities/admin.entity';

interface AdminRequest extends Request {
  user: { id: number; role: AdminRole };
}

const photoStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `candidate-${unique}${extname(file.originalname)}`);
  },
});

@Controller('admin/candidates')
@UseGuards(JwtAdminGuard, RolesGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Get('category/:categoryId')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR, AdminRole.READER)
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.candidateService.findByCategory(categoryId);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  @UseInterceptors(FileInterceptor('foto', { storage: photoStorage }))
  async create(
    @Body() dto: CreateCandidateDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AdminRequest,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    const fotoPath = file ? `/uploads/${file.filename}` : null;
    return this.candidateService.create(dto, fotoPath, req.user.id, ip);
  }

  @Put(':id')
  @Roles(AdminRole.ADMIN, AdminRole.OPERATOR)
  @UseInterceptors(FileInterceptor('foto', { storage: photoStorage }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCandidateDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AdminRequest,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    const fotoPath = file ? `/uploads/${file.filename}` : null;
    return this.candidateService.update(id, dto, fotoPath, req.user.id, ip);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: AdminRequest) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip;
    await this.candidateService.remove(id, req.user.id, ip);
    return { message: 'Candidata excluída com sucesso.' };
  }
}
