import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsPositive,
} from 'class-validator';
import { PrecioHistorial } from './precio-historial.entity';

@Entity()
export class Tratamiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @Column('float')
  @IsNumber()
  @IsPositive()
  costo: number;

  @Column('int') // duración en minutos
  @IsNumber()
  @Min(1)
  duracion: number;

  @OneToMany(() => PrecioHistorial, (historial) => historial.tratamiento, {
    cascade: true,
  })
  historialPrecios: PrecioHistorial[];

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @DeleteDateColumn()
  eliminadoEn: Date | null;
}
