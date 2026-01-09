import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ConfiguracionRecordatorio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recordatorio previo (default 24h antes)
  @Column({ type: 'boolean', default: true })
  recordatorioPrevioActivo: boolean;

  @Column({ type: 'int', default: 24 })
  horasAntesPrevio: number;

  // Recordatorio de confirmación (default 1h antes, solo si está confirmado)
  @Column({ type: 'boolean', default: true })
  recordatorioConfirmacionActivo: boolean;

  @Column({ type: 'int', default: 1 })
  horasAntesConfirmacion: number;

  // Horario permitido para enviar mensajes
  @Column({ type: 'int', default: 8 })
  horaEnvioMinima: number;

  @Column({ type: 'int', default: 21 })
  horaEnvioMaxima: number;

  // Reintentos
  @Column({ type: 'int', default: 3 })
  maxReintentos: number;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
