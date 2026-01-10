import { Type } from "class-transformer";
import {
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsString,
  Matches,
  Min,
  Max,
} from "class-validator";

export class FranjaDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "horaInicio debe tener formato HH:mm",
  })
  horaInicio!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "horaFin debe tener formato HH:mm",
  })
  horaFin!: string;
}

export class HorarioSemanalDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana!: number;

  @IsBoolean()
  activo!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FranjaDto)
  franjas!: FranjaDto[];
}

export class UpdateHorariosSemanalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioSemanalDto)
  horarios!: HorarioSemanalDto[];
}
