import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class StartVoteDto {
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório.' })
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'Formato de CPF inválido.' })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome completo é obrigatório.' })
  nomeCompleto: string;

  @IsString()
  @IsNotEmpty({ message: 'Resposta do captcha é obrigatória.' })
  captchaAnswer: string;

  @IsString()
  @IsNotEmpty({ message: 'Chave do captcha é obrigatória.' })
  captchaKey: string;
}
