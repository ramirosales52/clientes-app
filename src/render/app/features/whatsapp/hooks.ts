import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type {
  Recordatorio,
  PlantillaMensaje,
  ConfiguracionRecordatorio,
  EstadisticasRecordatorio,
  RecordatorioFiltros,
} from './types';

const API_URL = 'http://localhost:3000/recordatorios';

export function useRecordatorios(filtros?: RecordatorioFiltros) {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordatorios = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros?.estado) params.append('estado', filtros.estado);
      if (filtros?.tipo) params.append('tipo', filtros.tipo);
      if (filtros?.desde) params.append('desde', filtros.desde);
      if (filtros?.hasta) params.append('hasta', filtros.hasta);

      const res = await axios.get(`${API_URL}?${params.toString()}`);
      setRecordatorios(res.data);
    } catch (err) {
      console.error('Error fetching recordatorios:', err);
      toast.error('Error al cargar recordatorios');
    } finally {
      setLoading(false);
    }
  }, [filtros?.estado, filtros?.tipo, filtros?.desde, filtros?.hasta]);

  useEffect(() => {
    fetchRecordatorios();
  }, [fetchRecordatorios]);

  const enviarRecordatorio = async (id: string) => {
    try {
      await axios.post(`${API_URL}/${id}/enviar`);
      toast('Recordatorio enviado');
      fetchRecordatorios();
    } catch (err) {
      console.error('Error enviando recordatorio:', err);
      toast.error('Error al enviar recordatorio');
    }
  };

  const cancelarRecordatorio = async (id: string) => {
    try {
      await axios.post(`${API_URL}/${id}/cancelar`);
      toast('Recordatorio cancelado');
      fetchRecordatorios();
    } catch (err) {
      console.error('Error cancelando recordatorio:', err);
      toast.error('Error al cancelar recordatorio');
    }
  };

  const actualizarMensaje = async (id: string, mensaje: string): Promise<Recordatorio | null> => {
    try {
      const res = await axios.patch(`${API_URL}/${id}`, { mensaje });
      const recordatorioActualizado = res.data as Recordatorio;
      toast('Mensaje actualizado');
      // Actualizar localmente con el mensaje renderizado del backend
      setRecordatorios(prev => 
        prev.map(r => r.id === id ? { ...r, mensaje: recordatorioActualizado.mensaje } : r)
      );
      return recordatorioActualizado;
    } catch (err) {
      console.error('Error actualizando mensaje:', err);
      toast.error('Error al actualizar mensaje');
      return null;
    }
  };

  return {
    recordatorios,
    loading,
    refetch: fetchRecordatorios,
    enviarRecordatorio,
    cancelarRecordatorio,
    actualizarMensaje,
  };
}

export function useEstadisticas() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasRecordatorio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/estadisticas`);
      setEstadisticas(res.data);
    } catch (err) {
      console.error('Error fetching estadisticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  return { estadisticas, loading, refetch: fetchEstadisticas };
}

export function usePlantillas() {
  const [plantillas, setPlantillas] = useState<PlantillaMensaje[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlantillas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/plantillas`);
      setPlantillas(res.data);
    } catch (err) {
      console.error('Error fetching plantillas:', err);
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  const crearPlantilla = async (data: Omit<PlantillaMensaje, 'id'>) => {
    try {
      await axios.post(`${API_URL}/plantillas`, data);
      toast('Plantilla creada');
      fetchPlantillas();
    } catch (err) {
      console.error('Error creando plantilla:', err);
      toast.error('Error al crear plantilla');
    }
  };

  const actualizarPlantilla = async (id: string, data: Partial<PlantillaMensaje>) => {
    try {
      await axios.put(`${API_URL}/plantillas/${id}`, data);
      toast('Plantilla actualizada');
      fetchPlantillas();
    } catch (err) {
      console.error('Error actualizando plantilla:', err);
      toast.error('Error al actualizar plantilla');
    }
  };

  const eliminarPlantilla = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/plantillas/${id}`);
      toast('Plantilla eliminada');
      fetchPlantillas();
    } catch (err) {
      console.error('Error eliminando plantilla:', err);
      toast.error('Error al eliminar plantilla');
    }
  };

  return {
    plantillas,
    loading,
    refetch: fetchPlantillas,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla,
  };
}

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionRecordatorio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfiguracion = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/configuracion`);
      setConfiguracion(res.data);
    } catch (err) {
      console.error('Error fetching configuracion:', err);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfiguracion();
  }, [fetchConfiguracion]);

  const actualizarConfiguracion = async (data: Partial<ConfiguracionRecordatorio>) => {
    try {
      const res = await axios.put(`${API_URL}/configuracion`, data);
      setConfiguracion(res.data);
      toast('Configuración guardada');
    } catch (err) {
      console.error('Error actualizando configuracion:', err);
      toast.error('Error al guardar configuración');
    }
  };

  return {
    configuracion,
    loading,
    refetch: fetchConfiguracion,
    actualizarConfiguracion,
  };
}
