import { Type } from "class-transformer";
import {
  IsString,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsOptional,
} from "class-validator";
import { HorarioSemanalDto } from "./horario-semanal.dto";

export class CreateTemporadaDto {
  @IsString()
  nombre!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioSemanalDto)
  horarios!: HorarioSemanalDto[];
}

export class UpdateTemporadaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioSemanalDto)
  horarios?: HorarioSemanalDto[];
}
