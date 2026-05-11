import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClienteNotaDto {
  @IsString()
  @IsNotEmpty()
  contenido!: string;
}
