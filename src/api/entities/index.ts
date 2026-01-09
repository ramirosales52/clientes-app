import { Cliente } from "../clientes/entities/cliente.entity";
import { Pago } from "../pagos/entities/pago.entity";
import { PrecioHistorial } from "../tratamientos/entities/precio-historial.entity";
import { Tratamiento } from "../tratamientos/entities/tratamiento.entity";
import { Turno } from "../turnos/entities/turno.entity";
import { HistorialEstadoTurno } from "../turnos/entities/historial-estado.entity";
import { Recordatorio } from "../whatsapp/entities/recordatorio.entity";
import { PlantillaMensaje } from "../whatsapp/entities/plantilla-mensaje.entity";
import { ConfiguracionRecordatorio } from "../whatsapp/entities/configuracion-recordatorio.entity";

export const entities = [
  Cliente,
  Turno,
  Tratamiento,
  PrecioHistorial,
  Pago,
  HistorialEstadoTurno,
  Recordatorio,
  PlantillaMensaje,
  ConfiguracionRecordatorio
];
