import { IsString, IsNotEmpty, IsInt, IsPositive, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCandidateDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  category_id: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  numero?: number;
}

export class UpdateCandidateDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  numero?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
