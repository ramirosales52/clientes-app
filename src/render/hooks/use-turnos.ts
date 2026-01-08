import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export type EstadoTurno = "pendiente" | "confirmado" | "completado" | "cancelado" | "ausente";

export interface TurnoTratamiento {
  id: string;
  nombre: string;
  costo: number;
  duracion: number;
}

export interface TurnoCliente {
  id: string;
  nombre: string;
  apellido: string;
  codArea: string;
  numero: string;
}

export interface TurnoPago {
  id: string;
  monto: number;
  metodoPago: string;
  fechaPago: string;
}

export interface HistorialEstado {
  id: string;
  estadoAnterior: EstadoTurno | null;
  estadoNuevo: EstadoTurno;
  fecha: string;
}

export interface Turno {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoTurno;
  notas?: string;
  cliente: TurnoCliente;
  tratamientos: TurnoTratamiento[];
  pagos: TurnoPago[];
  historialEstados: HistorialEstado[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface TurnoFilters {
  estado?: EstadoTurno;
  fechaDesde?: string;
  fechaHasta?: string;
  clienteNombre?: string;
}

export interface UpdateTurnoData {
  estado?: EstadoTurno;
  fechaInicio?: string;
  fechaFin?: string;
  notas?: string;
  tratamientosIds?: string[];
}

const API_URL = "http://localhost:3000/turnos";

export function useTurnos() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TurnoFilters>({});

  const fetchTurnos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Turno[]>(API_URL);
      setTurnos(response.data);
    } catch (err) {
      console.error("Error al cargar turnos:", err);
      setError("Error al cargar turnos");
      toast.error("Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTurno = useCallback(async (id: string): Promise<Turno | null> => {
    try {
      const response = await axios.get<Turno>(`${API_URL}/${id}`);
      return response.data;
    } catch (err) {
      console.error("Error al cargar turno:", err);
      toast.error("Error al cargar turno");
      return null;
    }
  }, []);

  const updateTurno = useCallback(async (id: string, data: UpdateTurnoData) => {
    try {
      const response = await axios.patch<Turno>(`${API_URL}/${id}`, data);
      setTurnos((prev) =>
        prev.map((t) => (t.id === id ? response.data : t))
      );
      return response.data;
    } catch (err) {
      console.error("Error al actualizar turno:", err);
      toast.error("Error al actualizar turno");
      throw err;
    }
  }, []);

  const deleteTurno = useCallback(async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTurnos((prev) => prev.filter((t) => t.id !== id));
      toast.success("Turno eliminado");
    } catch (err) {
      console.error("Error al eliminar turno:", err);
      toast.error("Error al eliminar turno");
      throw err;
    }
  }, []);

  const confirmarTurno = useCallback(async (id: string) => {
    const updated = await updateTurno(id, { estado: "confirmado" });
    toast.success("Turno confirmado");
    return updated;
  }, [updateTurno]);

  const cancelarTurno = useCallback(async (id: string) => {
    const updated = await updateTurno(id, { estado: "cancelado" });
    toast.success("Turno cancelado");
    return updated;
  }, [updateTurno]);

  const marcarCompletado = useCallback(async (id: string) => {
    const updated = await updateTurno(id, { estado: "completado" });
    toast.success("Turno marcado como completado");
    return updated;
  }, [updateTurno]);

  const marcarAusente = useCallback(async (id: string) => {
    const updated = await updateTurno(id, { estado: "ausente" });
    toast.success("Turno marcado como ausente");
    return updated;
  }, [updateTurno]);

  const getFilteredTurnos = useCallback(() => {
    let result = [...turnos];

    if (filters.estado) {
      result = result.filter((t) => t.estado === filters.estado);
    }

    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      result = result.filter((t) => new Date(t.fechaInicio) >= desde);
    }

    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.fechaInicio) <= hasta);
    }

    if (filters.clienteNombre) {
      const search = filters.clienteNombre.toLowerCase();
      result = result.filter(
        (t) =>
          t.cliente.nombre.toLowerCase().includes(search) ||
          t.cliente.apellido.toLowerCase().includes(search)
      );
    }

    return result.sort(
      (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    );
  }, [turnos, filters]);

  const getTurnosHoy = useCallback(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    return turnos
      .filter((t) => {
        const fecha = new Date(t.fechaInicio);
        return fecha >= hoy && fecha < manana && t.estado !== "cancelado";
      })
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  }, [turnos]);

  const getStats = useCallback(() => {
    const turnosHoy = getTurnosHoy();
    const pendientes = turnos.filter((t) => t.estado === "pendiente").length;
    const confirmados = turnos.filter((t) => t.estado === "confirmado").length;

    return {
      turnosHoy: turnosHoy.length,
      pendientes,
      confirmados,
      total: turnos.length,
    };
  }, [turnos, getTurnosHoy]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  return {
    turnos,
    loading,
    error,
    filters,
    setFilters,
    fetchTurnos,
    fetchTurno,
    updateTurno,
    deleteTurno,
    confirmarTurno,
    cancelarTurno,
    marcarCompletado,
    marcarAusente,
    getFilteredTurnos,
    getTurnosHoy,
    getStats,
  };
}
