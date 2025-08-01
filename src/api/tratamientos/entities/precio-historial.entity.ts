import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tratamiento } from './tratamiento.entity';
import { IsNumber, IsPositive } from 'class-validator';

@Entity()
export class PrecioHistorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  @IsNumber()
  @IsPositive()
  precio: number;

  @CreateDateColumn()
  fecha: Date;

  @ManyToOne(() => Tratamiento, (tratamiento) => tratamiento.historialPrecios, {
    onDelete: 'CASCADE',
  })
  tratamiento: Tratamiento;
}

