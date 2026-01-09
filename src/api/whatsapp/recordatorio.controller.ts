import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RecordatorioService } from './recordatorio.service';
import { EstadoRecordatorio, TipoRecordatorio } from './entities/recordatorio.entity';

@Controller('recordatorios')
export class RecordatorioController {
  constructor(private readonly recordatorioService: RecordatorioService) {}

  // ============ CONFIGURACIÓN ============

  @Get('configuracion')
  getConfiguracion() {
    return this.recordatorioService.getConfiguracion();
  }

  @Put('configuracion')
  updateConfiguracion(@Body() data: any) {
    return this.recordatorioService.updateConfiguracion(data);
  }

  // ============ PLANTILLAS ============

  @Get('plantillas')
  getPlantillas() {
    return this.recordatorioService.getPlantillas();
  }

  @Get('plantillas/:id')
  getPlantilla(@Param('id') id: string) {
    return this.recordatorioService.getPlantilla(id);
  }

  @Post('plantillas')
  createPlantilla(@Body() data: any) {
    return this.recordatorioService.createPlantilla(data);
  }

  @Put('plantillas/:id')
  updatePlantilla(@Param('id') id: string, @Body() data: any) {
    return this.recordatorioService.updatePlantilla(id, data);
  }

  @Delete('plantillas/:id')
  deletePlantilla(@Param('id') id: string) {
    return this.recordatorioService.deletePlantilla(id);
  }

  // ============ RECORDATORIOS ============

  @Get()
  getRecordatorios(
    @Query('estado') estado?: EstadoRecordatorio,
    @Query('tipo') tipo?: TipoRecordatorio,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.recordatorioService.getRecordatorios({
      estado,
      tipo,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
  }

  @Get('estadisticas')
  getEstadisticas() {
    return this.recordatorioService.getEstadisticas();
  }

  @Get(':id')
  getRecordatorio(@Param('id') id: string) {
    return this.recordatorioService.getRecordatorio(id);
  }

  @Post(':id/enviar')
  enviarRecordatorio(@Param('id') id: string) {
    return this.recordatorioService.enviarRecordatorio(id);
  }

  @Post(':id/cancelar')
  cancelarRecordatorio(@Param('id') id: string) {
    return this.recordatorioService.cancelarRecordatorio(id);
  }

  @Patch(':id')
  actualizarRecordatorio(@Param('id') id: string, @Body() data: { mensaje: string }) {
    return this.recordatorioService.actualizarMensaje(id, data.mensaje);
  }

  @Post('manual')
  enviarMensajeManual(@Body() data: { turnoId: string; mensaje: string }) {
    return this.recordatorioService.enviarMensajeManual(data.turnoId, data.mensaje);
  }

  @Post('procesar')
  procesarPendientes() {
    return this.recordatorioService.procesarRecordatoriosPendientes();
  }
}
