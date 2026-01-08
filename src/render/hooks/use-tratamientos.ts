import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export interface PrecioHistorial {
  id: string;
  precio: number;
  fecha: string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  costo: number;
  duracion: number;
  historialPrecios: PrecioHistorial[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateTratamientoData {
  nombre: string;
  costo: number;
  duracion: number;
}

export interface UpdateTratamientoData {
  nombre?: string;
  costo?: number;
  duracion?: number;
}

const API_URL = "http://localhost:3000/tratamientos";

export function useTratamientos() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTratamientos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Tratamiento[]>(API_URL);
      setTratamientos(response.data);
    } catch (err) {
      console.error("Error al cargar tratamientos:", err);
      setError("Error al cargar tratamientos");
      toast.error("Error al cargar tratamientos");
    } finally {
      setLoading(false);
    }
  }, []);

  const createTratamiento = useCallback(async (data: CreateTratamientoData) => {
    try {
      const response = await axios.post<Tratamiento>(API_URL, data);
      setTratamientos((prev) => [...prev, response.data]);
      toast.success("Tratamiento creado");
      return response.data;
    } catch (err) {
      console.error("Error al crear tratamiento:", err);
      toast.error("Error al crear tratamiento");
      throw err;
    }
  }, []);

  const updateTratamiento = useCallback(
    async (id: string, data: UpdateTratamientoData) => {
      try {
        await axios.put<Tratamiento>(`${API_URL}/${id}`, data);
        // Refetch para obtener historial actualizado
        const response = await axios.get<Tratamiento[]>(API_URL);
        setTratamientos(response.data);
        toast.success("Tratamiento actualizado");
      } catch (err) {
        console.error("Error al actualizar tratamiento:", err);
        toast.error("Error al actualizar tratamiento");
        throw err;
      }
    },
    []
  );

  const deleteTratamiento = useCallback(async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTratamientos((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tratamiento eliminado");
    } catch (err) {
      console.error("Error al eliminar tratamiento:", err);
      toast.error("Error al eliminar tratamiento");
      throw err;
    }
  }, []);

  const fetchHistorialPrecios = useCallback(async (id: string) => {
    try {
      const response = await axios.get<PrecioHistorial[]>(
        `${API_URL}/${id}/historial-precios`
      );
      return response.data;
    } catch (err) {
      console.error("Error al cargar historial de precios:", err);
      toast.error("Error al cargar historial de precios");
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTratamientos();
  }, [fetchTratamientos]);

  return {
    tratamientos,
    loading,
    error,
    fetchTratamientos,
    createTratamiento,
    updateTratamiento,
    deleteTratamiento,
    fetchHistorialPrecios,
  };
}
