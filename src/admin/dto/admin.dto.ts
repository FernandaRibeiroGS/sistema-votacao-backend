import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { AdminRole } from '../entities/admin.entity';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres.' })
  senha: string;

  @IsEnum(AdminRole)
  role: AdminRole;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
