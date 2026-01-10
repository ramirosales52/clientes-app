import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

export interface Franja {
  horaInicio: string; // "09:00"
  horaFin: string;    // "13:00"
}

@Entity()
export class HorarioSemanal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int" })
  diaSemana!: number; // 0=domingo, 1=lunes, ... 6=sábado

  @Column({ type: "boolean", default: true })
  activo!: boolean;

  @Column({ type: "simple-json", default: "[]" })
  franjas!: Franja[];
}
