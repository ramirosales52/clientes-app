import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { DisponibilidadCard, TurnoService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';

@Controller('turnos')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) { }

  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.turnoService.create(dto);
  }

  @Get()
  findAll() {
    return this.turnoService.findAll();
  }

  @Get('horarios')
  async disponibles(
    @Query('fecha') fecha: string,
    @Query('duracion') duracion: string,
  ): Promise<DisponibilidadCard[]> {
    const dur = parseInt(duracion, 10);
    if (!fecha || Number.isNaN(dur)) {
      throw new Error('Parámetros requeridos: fecha (YYYY-MM-DD) y duracion (minutos)');
    }
    return this.turnoService.obtenerDisponibilidades(fecha, dur);
  }

  @Get('ocupados')
  async ocupados(@Query('fecha') fecha: string) {
    if (!fecha) {
      throw new Error('Parámetro requerido: fecha (MM-DD-YYYY)');
    }
    return this.turnoService.obtenerHorasOcupadas(fecha);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    return this.turnoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnoService.remove(id);
  }
}

