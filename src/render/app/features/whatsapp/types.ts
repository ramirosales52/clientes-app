export type TipoRecordatorio = 'previo' | 'confirmacion' | 'manual';
export type EstadoRecordatorio = 'programado' | 'enviado' | 'fallido' | 'cancelado';

export interface Recordatorio {
  id: string;
  turnoId: string;
  clienteId: string;
  tipo: TipoRecordatorio;
  estado: EstadoRecordatorio;
  fechaProgramada: string;
  fechaEnvio?: string;
  mensaje: string;
  telefono: string;
  intentos: number;
  error?: string;
  turno?: {
    id: string;
    fechaInicio: string;
    fechaFin: string;
    tratamientos?: { id: string; nombre: string }[];
  };
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface PlantillaMensaje {
  id: string;
  nombre: string;
  tipo: TipoRecordatorio;
  contenido: string;
  activa: boolean;
}

export interface ConfiguracionRecordatorio {
  id: string;
  recordatorioPrevioActivo: boolean;
  horasAntesPrevio: number;
  recordatorioConfirmacionActivo: boolean;
  horasAntesConfirmacion: number;
  horaEnvioMinima: number;
  horaEnvioMaxima: number;
  maxReintentos: number;
}

export interface EstadisticasRecordatorio {
  hoy: { enviados: number; pendientes: number; fallidos: number };
  semana: { enviados: number; pendientes: number; fallidos: number };
  total: { enviados: number; pendientes: number; fallidos: number };
}

export interface RecordatorioFiltros {
  estado?: EstadoRecordatorio;
  tipo?: TipoRecordatorio;
  desde?: string;
  hasta?: string;
}
