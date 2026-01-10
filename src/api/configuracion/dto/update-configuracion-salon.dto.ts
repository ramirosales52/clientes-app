import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";

export class UpdateConfiguracionSalonDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  duracionSlotMinutos?: number;
}
