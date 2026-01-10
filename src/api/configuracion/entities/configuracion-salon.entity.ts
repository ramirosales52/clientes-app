import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class ConfiguracionSalon {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ default: "Mi Salón" })
  nombre!: string;

  @Column({ nullable: true })
  telefono!: string;

  @Column({ nullable: true })
  direccion!: string;

  @Column({ type: "int", default: 30 })
  duracionSlotMinutos!: number;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}
