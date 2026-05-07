import { Tratamiento } from './entities/tratamiento.entity';

type TratamientoHistorico = Pick<Tratamiento, 'costo'> & {
  historialPrecios?: { precio: number; fecha: Date | string }[];
};

export function calcularCostoHistoricoTratamiento(
  tratamiento: TratamientoHistorico,
  referencia: Date,
): number {
  const historial = [...(tratamiento.historialPrecios || [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const precioVigente = historial.find(
    (item) => new Date(item.fecha).getTime() <= referencia.getTime(),
  );

  return Number(precioVigente?.precio ?? tratamiento.costo);
}

export function calcularCostoHistoricoTurno(
  tratamientos: TratamientoHistorico[],
  referencia: Date,
): number {
  return tratamientos.reduce(
    (total, tratamiento) => total + calcularCostoHistoricoTratamiento(tratamiento, referencia),
    0,
  );
}
