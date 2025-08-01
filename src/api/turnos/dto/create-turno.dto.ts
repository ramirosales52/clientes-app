import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EstadoTurno } from '../entities/turno.entity';

export class CreateTurnoDto {
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID("all", { each: true })
  tratamientosIds: string[];

  @IsEnum(EstadoTurno)
  @IsOptional()
  estado?: EstadoTurno;

  @IsUUID()
  @IsNotEmpty()
  clienteId: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

