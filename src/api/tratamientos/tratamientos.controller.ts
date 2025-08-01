import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { TratamientoService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Controller('tratamientos')
export class TratamientoController {
  constructor(private readonly tratamientoService: TratamientoService) { }

  @Post()
  create(@Body() dto: CreateTratamientoDto) {
    return this.tratamientoService.create(dto);
  }

  @Get()
  findAll() {
    return this.tratamientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tratamientoService.findOne(id);
  }

  @Get(':id/historial-precios')
  findHistorialPrecios(@Param('id') id: string) {
    return this.tratamientoService.findHistorialPrecios(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTratamientoDto) {
    return this.tratamientoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tratamientoService.remove(id);
  }
}

