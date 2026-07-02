import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginAdminDto {
  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  senha: string;
}
