import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Turno } from '../../turnos/entities/turno.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  TARJETA_DEBITO = 'tarjeta_debito',
  TARJETA_CREDITO = 'tarjeta_credito',
  MERCADOPAGO = 'mercadopago',
}

@Entity()
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Turno, (turno) => turno.pagos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  turno: Turno;

  @ManyToOne(() => Cliente, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  cliente: Cliente;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monto: number;

  @Column({ type: 'text', enum: MetodoPago })
  @IsNotEmpty()
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @Column('datetime')
  @IsNotEmpty()
  fechaPago: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notas?: string;

  @CreateDateColumn()
  creadoEn: Date;
}
