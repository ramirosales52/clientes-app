import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

interface TurnoBasico {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "pendiente" | "confirmado" | "cancelado" | "realizado";
  cliente: {
    id: string;
    nombre: string;
    apellido: string;
  };
  tratamientos: {
    id: string;
    nombre: string;
    costo: number;
  }[];
}

interface DashboardStats {
  turnosHoy: number;
  pendientes: number;
  totalClientes: number;
  ingresosMes: number;
}

interface ProximoTurno extends TurnoBasico {
  minutosRestantes: number;
}

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    turnosHoy: 0,
    pendientes: 0,
    totalClientes: 0,
    ingresosMes: 0,
  });
  const [turnosHoy, setTurnosHoy] = useState<TurnoBasico[]>([]);
  const [proximosTurnos, setProximosTurnos] = useState<ProximoTurno[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [turnosRes, clientesRes] = await Promise.all([
        axios.get<TurnoBasico[]>("http://localhost:3000/turnos"),
        axios.get<{ total: number }>("http://localhost:3000/clientes?limit=1"),
      ]);

      const turnos = turnosRes.data;
      const ahora = dayjs();
      const hoy = ahora.startOf("day");
      const manana = hoy.add(1, "day");
      const inicioMes = ahora.startOf("month");
      const finMes = ahora.endOf("month");

      // Turnos de hoy (no cancelados)
      const turnosDeHoy = turnos.filter((t) => {
        const fecha = dayjs(t.fechaInicio);
        return (
          fecha.isAfter(hoy) &&
          fecha.isBefore(manana) &&
          t.estado !== "cancelado"
        );
      });

      // Pendientes (no cancelados, no realizados)
      const pendientes = turnos.filter(
        (t) => t.estado === "pendiente"
      ).length;

      // Ingresos del mes (turnos realizados)
      const ingresosMes = turnos
        .filter((t) => {
          const fecha = dayjs(t.fechaInicio);
          return (
            t.estado === "realizado" &&
            fecha.isAfter(inicioMes) &&
            fecha.isBefore(finMes)
          );
        })
        .reduce(
          (total, t) =>
            total + t.tratamientos.reduce((sum, tr) => sum + tr.costo, 0),
          0
        );

      // Proximos turnos (hoy, ordenados por hora, no pasados)
      const proximos = turnosDeHoy
        .filter((t) => dayjs(t.fechaInicio).isAfter(ahora))
        .sort(
          (a, b) =>
            dayjs(a.fechaInicio).valueOf() - dayjs(b.fechaInicio).valueOf()
        )
        .slice(0, 3)
        .map((t) => ({
          ...t,
          minutosRestantes: dayjs(t.fechaInicio).diff(ahora, "minute"),
        }));

      setTurnosHoy(turnosDeHoy.sort(
        (a, b) => dayjs(a.fechaInicio).valueOf() - dayjs(b.fechaInicio).valueOf()
      ));
      setProximosTurnos(proximos);
      setStats({
        turnosHoy: turnosDeHoy.length,
        pendientes,
        totalClientes: clientesRes.data.total,
        ingresosMes,
      });
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Actualizar cada minuto
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    loading,
    stats,
    turnosHoy,
    proximosTurnos,
    refresh: fetchData,
  };
}
