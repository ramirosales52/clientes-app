import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  @Get()
  findAll() {
    return this.pagosService.findAll();
  }

  @Get('turno/:turnoId')
  findByTurno(@Param('turnoId') turnoId: string) {
    return this.pagosService.findByTurno(turnoId);
  }

  @Get('cliente/:clienteId')
  findByCliente(@Param('clienteId') clienteId: string) {
    return this.pagosService.findByCliente(clienteId);
  }

  @Get('cliente/:clienteId/deuda')
  getDeudaCliente(@Param('clienteId') clienteId: string) {
    return this.pagosService.getDeudaCliente(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagosService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagosService.remove(id);
  }
}
