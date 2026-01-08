import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

export type MetodoPago = 
  | "efectivo" 
  | "transferencia" 
  | "tarjeta_debito" 
  | "tarjeta_credito" 
  | "mercadopago";

export interface Pago {
  id: string;
  monto: number;
  metodoPago: MetodoPago;
  fechaPago: string;
  notas?: string;
  creadoEn: string;
  turno?: {
    id: string;
    fechaInicio: string;
  };
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface CreatePagoData {
  turnoId: string;
  monto: number;
  metodoPago: MetodoPago;
  fechaPago?: string;
  notas?: string;
}

const API_URL = "http://localhost:3000/pagos";

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "mercadopago", label: "MercadoPago" },
];

export function usePagos() {
  const [loading, setLoading] = useState(false);

  const createPago = useCallback(async (data: CreatePagoData): Promise<Pago | null> => {
    try {
      setLoading(true);
      const response = await axios.post<Pago>(API_URL, data);
      toast.success("Pago registrado");
      return response.data;
    } catch (err: any) {
      console.error("Error al registrar pago:", err);
      const message = err.response?.data?.message || "Error al registrar pago";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPagosByTurno = useCallback(async (turnoId: string): Promise<Pago[]> => {
    try {
      const response = await axios.get<Pago[]>(`${API_URL}/turno/${turnoId}`);
      return response.data;
    } catch (err) {
      console.error("Error al obtener pagos del turno:", err);
      return [];
    }
  }, []);

  const getPagosByCliente = useCallback(async (clienteId: string): Promise<Pago[]> => {
    try {
      const response = await axios.get<Pago[]>(`${API_URL}/cliente/${clienteId}`);
      return response.data;
    } catch (err) {
      console.error("Error al obtener pagos del cliente:", err);
      return [];
    }
  }, []);

  const getDeudaCliente = useCallback(async (clienteId: string): Promise<{ deudaTotal: number; turnosConDeuda: number }> => {
    try {
      const response = await axios.get<{ deudaTotal: number; turnosConDeuda: number }>(
        `${API_URL}/cliente/${clienteId}/deuda`
      );
      return response.data;
    } catch (err) {
      console.error("Error al obtener deuda del cliente:", err);
      return { deudaTotal: 0, turnosConDeuda: 0 };
    }
  }, []);

  const deletePago = useCallback(async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Pago eliminado");
      return true;
    } catch (err) {
      console.error("Error al eliminar pago:", err);
      toast.error("Error al eliminar pago");
      return false;
    }
  }, []);

  return {
    loading,
    createPago,
    getPagosByTurno,
    getPagosByCliente,
    getDeudaCliente,
    deletePago,
  };
}

// Helpers para cálculos de pagos
export function calcularCostoTurno(tratamientos: { costo: number }[]): number {
  return tratamientos.reduce((sum, t) => sum + t.costo, 0);
}

export function calcularMontoPagado(pagos: { monto: number }[]): number {
  return pagos.reduce((sum, p) => sum + Number(p.monto), 0);
}

export function calcularDeudaTurno(
  tratamientos: { costo: number }[],
  pagos: { monto: number }[]
): number {
  return calcularCostoTurno(tratamientos) - calcularMontoPagado(pagos);
}

export function estaPagado(
  tratamientos: { costo: number }[],
  pagos: { monto: number }[]
): boolean {
  return calcularDeudaTurno(tratamientos, pagos) <= 0;
}
