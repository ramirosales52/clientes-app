import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turnos.service';
import { TurnoController } from './turnos.controller';
import { Turno } from './entities/turno.entity';
import { HistorialEstadoTurno } from './entities/historial-estado.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, HistorialEstadoTurno, Cliente, Tratamiento])],
  controllers: [TurnoController],
  providers: [TurnoService],
})

export class TurnoModule { }

