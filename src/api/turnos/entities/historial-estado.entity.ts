import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Turno, EstadoTurno } from './turno.entity';

@Entity()
export class HistorialEstadoTurno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Turno, (turno) => turno.historialEstados, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  turno: Turno;

  @Column({ type: 'text', enum: EstadoTurno })
  estadoAnterior: EstadoTurno | null;

  @Column({ type: 'text', enum: EstadoTurno })
  estadoNuevo: EstadoTurno;

  @CreateDateColumn()
  fecha: Date;
}
