import { IsString, IsNotEmpty, IsInt, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { ContestStatus } from '../../contest/entities/contest.entity';

export class CreateContestDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  @IsNotEmpty()
  cidade: string;

  @IsInt()
  @Min(2000)
  ano: number;

  @IsOptional()
  @IsString()
  imagem_capa?: string;

  @IsDateString()
  inicio: string;

  @IsDateString()
  encerramento: string;

  @IsOptional()
  @IsEnum(ContestStatus)
  status?: ContestStatus;
}

export class UpdateContestDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  ano?: number;

  @IsOptional()
  @IsString()
  imagem_capa?: string;

  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  encerramento?: string;

  @IsOptional()
  @IsEnum(ContestStatus)
  status?: ContestStatus;
}
