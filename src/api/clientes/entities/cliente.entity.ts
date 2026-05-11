import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Turno } from '../../turnos/entities/turno.entity';
import { ClienteNota } from './cliente-nota.entity';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
} from 'class-validator';

@Entity()
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @Column()
  @IsString()
  @Matches(/^\d{2,5}$/, { message: 'Código de área inválido' })
  codArea!: string;

  @Column()
  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'Número inválido' })
  numero!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  notas?: string;

  @OneToMany(() => ClienteNota, (nota) => nota.cliente)
  notasCliente!: ClienteNota[];

  @OneToMany(() => Turno, (turno) => turno.cliente)
  turnos!: Turno[];

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}

