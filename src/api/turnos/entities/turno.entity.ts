import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Tratamiento } from '../../tratamientos/entities/tratamiento.entity';
import type { Pago } from '../../pagos/entities/pago.entity';
import type { HistorialEstadoTurno } from './historial-estado.entity';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  SIN_CONFIRMAR = 'sin_confirmar',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  AUSENTE = 'ausente',
}

@Entity()
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  fechaInicio!: Date;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  fechaFin!: Date;

  @ManyToMany(() => Tratamiento, { eager: true })
  @JoinTable()
  tratamientos!: Tratamiento[];

  @Column('simple-json', { nullable: true })
  tratamientosSnapshot?: {
    id: string;
    nombre: string;
    costo: number;
    duracion: number;
  }[];

  @Column({
    type: 'text',
    enum: EstadoTurno,
    default: EstadoTurno.PENDIENTE,
  })
  @IsEnum(EstadoTurno)
  estado!: EstadoTurno;

  @ManyToOne(() => Cliente, (cliente) => cliente.turnos, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  cliente!: Cliente;

  @OneToMany('Pago', 'turno', { eager: true })
  pagos!: Pago[];

  @OneToMany('HistorialEstadoTurno', 'turno', { eager: true })
  historialEstados!: HistorialEstadoTurno[];

  @Column('float', { nullable: true })
  costoTotal?: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  notas?: string;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}
