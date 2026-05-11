import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { IsNotEmpty, IsString } from 'class-validator';

@Entity()
export class ClienteNota {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  @IsString()
  @IsNotEmpty()
  contenido!: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.notasCliente, {
    onDelete: 'CASCADE',
  })
  cliente!: Cliente;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}
