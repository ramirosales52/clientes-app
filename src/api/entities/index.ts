import { Cliente } from "../clientes/entities/cliente.entity";
import { PrecioHistorial } from "../tratamientos/entities/precio-historial.entity";
import { Tratamiento } from "../tratamientos/entities/tratamiento.entity";
import { Turno } from "../turnos/entities/turno.entity";

export const entities = [Cliente, Turno, Tratamiento, PrecioHistorial];
