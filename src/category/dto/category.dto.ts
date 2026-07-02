import { IsString, IsNotEmpty, IsInt, IsPositive, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { CategoryType } from '../../category/entities/category.entity';

export class CreateCategoryDto {
  @IsInt()
  @IsPositive()
  contest_id: number;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(CategoryType)
  tipo: CategoryType;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
