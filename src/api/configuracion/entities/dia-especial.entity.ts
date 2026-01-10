import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { Franja } from "./horario-semanal.entity";

@Entity()
export class DiaEspecial {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "date" })
  fecha!: Date;

  @Column({ type: "boolean", default: true })
  cerrado!: boolean;

  @Column({ nullable: true })
  motivo!: string; // ej: "Feriado Nacional"

  @Column({ type: "simple-json", nullable: true })
  franjas!: Franja[]; // Solo si cerrado=false (horario especial)

  @CreateDateColumn()
  creadoEn!: Date;
}
