import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Temporada } from "./temporada.entity";
import { Franja } from "./horario-semanal.entity";

@Entity()
export class HorarioTemporada {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Temporada, (t) => t.horarios, { onDelete: "CASCADE" })
  temporada!: Temporada;

  @Column({ type: "int" })
  diaSemana!: number; // 0=domingo, 1=lunes, ... 6=sábado

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @Column({ type: "simple-json", default: "[]" })
  franjas!: Franja[];
}
