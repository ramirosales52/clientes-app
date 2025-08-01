import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @Matches(/^\d{2,5}$/, { message: 'Código de área inválido' })
  codArea: string;

  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'Número inválido' })
  numero: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

