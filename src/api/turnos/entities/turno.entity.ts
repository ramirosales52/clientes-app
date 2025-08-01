import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
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

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  REALIZADO = 'realizado',
}

@Entity()
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  fechaInicio: Date;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  fechaFin: Date;

  @ManyToMany(() => Tratamiento, { eager: true })
  @JoinTable()
  tratamientos: Tratamiento[];

  @Column({
    type: 'text',
    enum: EstadoTurno,
    default: EstadoTurno.PENDIENTE,
  })
  @IsEnum(EstadoTurno)
  estado: EstadoTurno;

  @ManyToOne(() => Cliente, (cliente) => cliente.turnos, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  cliente: Cliente;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  notas?: string;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}

