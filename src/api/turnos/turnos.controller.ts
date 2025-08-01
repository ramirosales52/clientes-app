import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { TurnoService } from './turnos.service';
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

