import { Cliente } from "../clientes/entities/cliente.entity";
import { Pago } from "../pagos/entities/pago.entity";
import { PrecioHistorial } from "../tratamientos/entities/precio-historial.entity";
import { Tratamiento } from "../tratamientos/entities/tratamiento.entity";
import { Turno } from "../turnos/entities/turno.entity";
import { HistorialEstadoTurno } from "../turnos/entities/historial-estado.entity";

export const entities = [Cliente, Turno, Tratamiento, PrecioHistorial, Pago, HistorialEstadoTurno];
