import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecordatorioService } from './recordatorio.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly recordatorioService: RecordatorioService) {}

  onModuleInit() {
    this.logger.log('Scheduler de recordatorios iniciado');
  }

  // Ejecutar cada 5 minutos para procesar recordatorios pendientes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async procesarRecordatorios() {
    this.logger.debug('Procesando recordatorios pendientes...');

    try {
      const resultado = await this.recordatorioService.procesarRecordatoriosPendientes();

      if (resultado.enviados > 0 || resultado.fallidos > 0) {
        this.logger.log(
          `Recordatorios procesados: ${resultado.enviados} enviados, ${resultado.fallidos} fallidos`
        );
      }
    } catch (error) {
      this.logger.error('Error procesando recordatorios:', error);
    }
  }
}
