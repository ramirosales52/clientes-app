import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turnos.service';
import { TurnoController } from './turnos.controller';
import { Turno } from './entities/turno.entity';
import { HistorialEstadoTurno } from './entities/historial-estado.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, HistorialEstadoTurno, Cliente, Tratamiento]),
    forwardRef(() => WhatsappModule),
  ],
  controllers: [TurnoController],
  providers: [TurnoService],
  exports: [TurnoService, TypeOrmModule],
})
export class TurnoModule {}
