import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfiguracionController } from "./configuracion.controller";
import { ConfiguracionService } from "./configuracion.service";
import { ConfiguracionSalon } from "./entities/configuracion-salon.entity";
import { HorarioSemanal } from "./entities/horario-semanal.entity";
import { Temporada } from "./entities/temporada.entity";
import { HorarioTemporada } from "./entities/horario-temporada.entity";
import { DiaEspecial } from "./entities/dia-especial.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConfiguracionSalon,
      HorarioSemanal,
      Temporada,
      HorarioTemporada,
      DiaEspecial,
    ]),
  ],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
