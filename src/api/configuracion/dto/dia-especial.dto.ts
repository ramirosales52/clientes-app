import { Type } from "class-transformer";
import {
  IsDateString,
  IsBoolean,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { FranjaDto } from "./horario-semanal.dto";

export class CreateDiaEspecialDto {
  @IsDateString()
  fecha!: string;

  @IsBoolean()
  cerrado!: boolean;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FranjaDto)
  franjas?: FranjaDto[];
}

export class UpdateDiaEspecialDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  cerrado?: boolean;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FranjaDto)
  franjas?: FranjaDto[];
}
