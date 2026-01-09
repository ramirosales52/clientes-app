import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappService } from './whatsapp.service';
import { NotificationsController } from './whatsapp.controller';
import { RecordatorioService } from './recordatorio.service';
import { RecordatorioController } from './recordatorio.controller';
import { SchedulerService } from './scheduler.service';
import { RespuestaHandlerService } from './respuesta-handler.service';
import { Recordatorio } from './entities/recordatorio.entity';
import { PlantillaMensaje } from './entities/plantilla-mensaje.entity';
import { ConfiguracionRecordatorio } from './entities/configuracion-recordatorio.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { TurnoModule } from '../turnos/turnos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recordatorio,
      PlantillaMensaje,
      ConfiguracionRecordatorio,
      Turno,
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => TurnoModule),
  ],
  providers: [
    WhatsappService,
    RecordatorioService,
    SchedulerService,
    RespuestaHandlerService,
  ],
  exports: [WhatsappService, RecordatorioService],
  controllers: [NotificationsController, RecordatorioController],
})
export class WhatsappModule {}
