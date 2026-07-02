import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class StartVoteDto {
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório.' })
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, { message: 'Formato de CPF inválido.' })
  cpf: string;

  @IsString()
  @IsNotEmpty({ message: 'Token do captcha é obrigatório.' })
  captchaToken: string;
}
