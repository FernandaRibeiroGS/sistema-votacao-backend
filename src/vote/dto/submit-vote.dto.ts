import { IsInt, IsPositive } from 'class-validator';

export class SubmitVoteDto {
  @IsInt({ message: 'ID da candidata infantil deve ser um número inteiro.' })
  @IsPositive({ message: 'ID da candidata infantil deve ser positivo.' })
  candidateChildId: number;

  @IsInt({ message: 'ID da candidata adulta deve ser um número inteiro.' })
  @IsPositive({ message: 'ID da candidata adulta deve ser positivo.' })
  candidateAdultId: number;
}
