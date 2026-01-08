import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MetodoPago } from '../entities/pago.entity';

export class CreatePagoDto {
  @IsNotEmpty()
  @IsUUID()
  turnoId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  monto: number;

  @IsNotEmpty()
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @IsOptional()
  @IsString()
  fechaPago?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
