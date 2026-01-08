import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { dataEvents, EVENTS } from "@render/lib/events";

export interface Turno {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "pendiente" | "confirmado" | "cancelado" | "realizado";
  notas?: string;
  tratamientos: {
    id: string;
    nombre: string;
    costo: number;
    duracion: number;
  }[];
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  codArea: string;
  numero: string;
  notas?: string;
  turnos: Turno[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface ClienteConStats extends Cliente {
  cantTurnos: number;
}

export interface CreateClienteData {
  nombre: string;
  apellido: string;
  codArea: string;
  numero: string;
  notas?: string;
}

export interface UpdateClienteData {
  nombre?: string;
  apellido?: string;
  codArea?: string;
  numero?: string;
  notas?: string;
}

export interface ClienteStats {
  totalTurnos: number;
  turnosPorEstado: Record<string, number>;
  gastoTotal: number;
  tratamientoFavorito: { nombre: string; cantidad: number } | null;
  ultimoTurno: Turno | null;
  proximoTurno: Turno | null;
}

const API_URL = "http://localhost:3000/clientes";

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteConStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchClientes = useCallback(async (pageToFetch = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_URL}?page=${pageToFetch}&limit=20${search ? `&nombre=${search}` : ""}`
      );

      const clientesConCantidad = response.data.data.map((cliente: Cliente) => ({
        ...cliente,
        cantTurnos: cliente.turnos.length,
      }));

      if (pageToFetch === 1) {
        setClientes(clientesConCantidad);
      } else {
        setClientes((prev) => [...prev, ...clientesConCantidad]);
      }

      setHasMore(response.data.hasMore);
      setPage(pageToFetch + 1);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError("Error al cargar clientes");
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCliente = useCallback(async (id: string): Promise<Cliente | null> => {
    try {
      const response = await axios.get<Cliente>(`${API_URL}/${id}`);
      return response.data;
    } catch (err) {
      console.error("Error al cargar cliente:", err);
      toast.error("Error al cargar cliente");
      return null;
    }
  }, []);

  const createCliente = useCallback(async (data: CreateClienteData) => {
    try {
      const response = await axios.post<Cliente>(API_URL, data);
      const clienteConStats: ClienteConStats = {
        ...response.data,
        cantTurnos: 0,
      };
      setClientes((prev) => [...prev, clienteConStats]);
      toast.success("Cliente creado");
      return response.data;
    } catch (err) {
      console.error("Error al crear cliente:", err);
      toast.error("Error al crear cliente");
      throw err;
    }
  }, []);

  const updateCliente = useCallback(async (id: string, data: UpdateClienteData) => {
    try {
      const response = await axios.patch<Cliente>(`${API_URL}/${id}`, data);
      setClientes((prev) =>
        prev.map((c) =>
          c.id === id ? { ...response.data, cantTurnos: response.data.turnos.length } : c
        )
      );
      toast.success("Cliente actualizado");
      return response.data;
    } catch (err) {
      console.error("Error al actualizar cliente:", err);
      toast.error("Error al actualizar cliente");
      throw err;
    }
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setClientes((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cliente eliminado");
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      toast.error("Error al eliminar cliente");
      throw err;
    }
  }, []);

  const calcularStats = useCallback((cliente: Cliente): ClienteStats => {
    const ahora = new Date();
    const turnosOrdenados = [...cliente.turnos].sort(
      (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    );

    const turnosPasados = turnosOrdenados.filter(
      (t) => new Date(t.fechaInicio) < ahora
    );
    const turnosFuturos = turnosOrdenados
      .filter((t) => new Date(t.fechaInicio) >= ahora && t.estado !== "cancelado")
      .reverse();

    const turnosPorEstado = cliente.turnos.reduce(
      (acc, t) => {
        acc[t.estado] = (acc[t.estado] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const turnosRealizados = cliente.turnos.filter((t) => t.estado === "realizado");
    const gastoTotal = turnosRealizados.reduce((total, turno) => {
      return total + turno.tratamientos.reduce((sum, t) => sum + t.costo, 0);
    }, 0);

    const tratamientoCount: Record<string, number> = {};
    cliente.turnos.forEach((turno) => {
      turno.tratamientos.forEach((t) => {
        tratamientoCount[t.nombre] = (tratamientoCount[t.nombre] || 0) + 1;
      });
    });

    let tratamientoFavorito: { nombre: string; cantidad: number } | null = null;
    let maxCount = 0;
    for (const [nombre, cantidad] of Object.entries(tratamientoCount)) {
      if (cantidad > maxCount) {
        maxCount = cantidad;
        tratamientoFavorito = { nombre, cantidad };
      }
    }

    return {
      totalTurnos: cliente.turnos.length,
      turnosPorEstado,
      gastoTotal,
      tratamientoFavorito,
      ultimoTurno: turnosPasados[0] || null,
      proximoTurno: turnosFuturos[0] || null,
    };
  }, []);

  useEffect(() => {
    fetchClientes(1);
  }, [fetchClientes]);

  // Listen for cliente created events
  useEffect(() => {
    const unsub = dataEvents.on(EVENTS.CLIENTE_CREATED, () => fetchClientes(1));
    return () => unsub();
  }, [fetchClientes]);

  return {
    clientes,
    loading,
    error,
    hasMore,
    page,
    fetchClientes,
    fetchCliente,
    fetchMore: () => fetchClientes(page),
    createCliente,
    updateCliente,
    deleteCliente,
    calcularStats,
  };
}
