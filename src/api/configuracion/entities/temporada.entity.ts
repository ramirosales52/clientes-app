import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { HorarioTemporada } from "./horario-temporada.entity";

@Entity()
export class Temporada {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nombre!: string; // ej: "Verano 2026"

  @Column({ type: "date" })
  fechaInicio!: Date;

  @Column({ type: "date" })
  fechaFin!: Date;

  @Column({ type: "boolean", default: true })
  activa!: boolean;

  @OneToMany(() => HorarioTemporada, (h) => h.temporada, { cascade: true, eager: true })
  horarios!: HorarioTemporada[];

  @CreateDateColumn()
  creadoEn!: Date;
}
