import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ConfiguracionService, HorariosParaFecha } from "./configuracion.service";
import { UpdateConfiguracionSalonDto } from "./dto/update-configuracion-salon.dto";
import { UpdateHorariosSemanalDto } from "./dto/horario-semanal.dto";
import { CreateTemporadaDto, UpdateTemporadaDto } from "./dto/temporada.dto";
import { CreateDiaEspecialDto, UpdateDiaEspecialDto } from "./dto/dia-especial.dto";
import { ConfiguracionSalon } from "./entities/configuracion-salon.entity";
import { HorarioSemanal } from "./entities/horario-semanal.entity";
import { Temporada } from "./entities/temporada.entity";
import { DiaEspecial } from "./entities/dia-especial.entity";

@Controller("configuracion")
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  // ==================== CONFIGURACIÓN GENERAL ====================

  @Get()
  getConfiguracion(): Promise<ConfiguracionSalon> {
    return this.configuracionService.getConfiguracion();
  }

  @Put()
  updateConfiguracion(
    @Body() dto: UpdateConfiguracionSalonDto,
  ): Promise<ConfiguracionSalon> {
    return this.configuracionService.updateConfiguracion(dto);
  }

  // ==================== HORARIOS SEMANALES ====================

  @Get("horarios")
  getHorariosSemanales(): Promise<HorarioSemanal[]> {
    return this.configuracionService.getHorariosSemanales();
  }

  @Put("horarios")
  updateHorariosSemanales(
    @Body() dto: UpdateHorariosSemanalDto,
  ): Promise<HorarioSemanal[]> {
    return this.configuracionService.updateHorariosSemanales(dto);
  }

  // ==================== HORARIOS PARA FECHA (RESOLUCIÓN) ====================

  @Get("horarios-para-fecha")
  getHorariosParaFecha(@Query("fecha") fecha: string): Promise<HorariosParaFecha> {
    return this.configuracionService.getHorariosParaFecha(fecha);
  }

  // ==================== TEMPORADAS ====================

  @Get("temporadas")
  getTemporadas(): Promise<Temporada[]> {
    return this.configuracionService.getTemporadas();
  }

  @Get("temporadas/:id")
  getTemporada(@Param("id") id: string): Promise<Temporada> {
    return this.configuracionService.getTemporada(id);
  }

  @Post("temporadas")
  createTemporada(@Body() dto: CreateTemporadaDto): Promise<Temporada> {
    return this.configuracionService.createTemporada(dto);
  }

  @Put("temporadas/:id")
  updateTemporada(
    @Param("id") id: string,
    @Body() dto: UpdateTemporadaDto,
  ): Promise<Temporada> {
    return this.configuracionService.updateTemporada(id, dto);
  }

  @Delete("temporadas/:id")
  deleteTemporada(@Param("id") id: string): Promise<void> {
    return this.configuracionService.deleteTemporada(id);
  }

  // ==================== DÍAS ESPECIALES ====================

  @Get("dias-especiales")
  getDiasEspeciales(): Promise<DiaEspecial[]> {
    return this.configuracionService.getDiasEspeciales();
  }

  @Get("dias-especiales/:id")
  getDiaEspecial(@Param("id") id: string): Promise<DiaEspecial> {
    return this.configuracionService.getDiaEspecial(id);
  }

  @Post("dias-especiales")
  createDiaEspecial(@Body() dto: CreateDiaEspecialDto): Promise<DiaEspecial> {
    return this.configuracionService.createDiaEspecial(dto);
  }

  @Put("dias-especiales/:id")
  updateDiaEspecial(
    @Param("id") id: string,
    @Body() dto: UpdateDiaEspecialDto,
  ): Promise<DiaEspecial> {
    return this.configuracionService.updateDiaEspecial(id, dto);
  }

  @Delete("dias-especiales/:id")
  deleteDiaEspecial(@Param("id") id: string): Promise<void> {
    return this.configuracionService.deleteDiaEspecial(id);
  }
}
