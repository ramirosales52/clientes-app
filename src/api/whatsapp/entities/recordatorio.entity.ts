import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Turno } from '../../turnos/entities/turno.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';

export enum TipoRecordatorio {
  CONFIRMACION = 'confirmacion',
  REINTENTO_1 = 'reintento_1',
  REINTENTO_2 = 'reintento_2',
  PREVIO = 'previo',
  MANUAL = 'manual',
}

export enum EstadoRecordatorio {
  PROGRAMADO = 'programado',
  ENVIADO = 'enviado',
  FALLIDO = 'fallido',
  SIN_RESPUESTA = 'sin_respuesta',
  CANCELADO = 'cancelado',
}

@Entity()
export class Recordatorio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Turno, { nullable: false, onDelete: 'CASCADE' })
  turno: Turno;

  @Column()
  turnoId: string;

  @ManyToOne(() => Cliente, { nullable: false, onDelete: 'CASCADE' })
  cliente: Cliente;

  @Column()
  clienteId: string;

  @Column({ type: 'text', enum: TipoRecordatorio })
  tipo: TipoRecordatorio;

  @Column({ type: 'text', enum: EstadoRecordatorio, default: EstadoRecordatorio.PROGRAMADO })
  estado: EstadoRecordatorio;

  @Column({ type: 'datetime' })
  fechaProgramada: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaEnvio: Date | null;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'text', nullable: true })
  telefono: string;

  @Column({ type: 'int', default: 0 })
  intentos: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
