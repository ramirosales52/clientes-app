import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

type EstadoTurno = "pendiente" | "confirmado" | "completado" | "cancelado" | "ausente";

type Franja = {
  horaInicio: string;
  horaFin: string;
};

type HorariosParaFecha = {
  fecha: string;
  tipo: "normal" | "temporada" | "especial";
  cerrado: boolean;
  motivo?: string;
  franjas: Franja[];
  temporadaNombre?: string;
};

export interface TurnoBasico {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoTurno;
  costoTotal?: number;
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

export interface DashboardStats {
  turnosHoy: number;
  pendientes: number;
  totalClientes: number;
  ingresosMes: number;
  restantesHoy: number;
  confirmadosHoy: number;
  completadosHoy: number;
}

export interface ProximoTurno extends TurnoBasico {
  minutosRestantes: number;
}

export interface EstadoJornada {
  estado: "abierto" | "pausa" | "antes_de_abrir" | "finalizado" | "cerrado";
  titulo: string;
  detalle: string;
}

function getEstadoJornada(horarios: HorariosParaFecha, ahora: dayjs.Dayjs): EstadoJornada {
  if (horarios.cerrado || horarios.franjas.length === 0) {
    return {
      estado: "cerrado",
      titulo: "Sin atencion hoy",
      detalle: horarios.motivo || "No hay franjas disponibles para esta fecha.",
    };
  }

  const franjas = horarios.franjas.map((franja) => ({
    inicio: dayjs(`${horarios.fecha} ${franja.horaInicio}`),
    fin: dayjs(`${horarios.fecha} ${franja.horaFin}`),
    ...franja,
  }));

  const franjaActual = franjas.find((franja) => ahora.isAfter(franja.inicio) && ahora.isBefore(franja.fin));
  if (franjaActual) {
    return {
      estado: "abierto",
      titulo: "Abierto ahora",
      detalle: `Atendiendo hasta las ${franjaActual.horaFin}.`,
    };
  }

  const proximaFranja = franjas.find((franja) => ahora.isBefore(franja.inicio));
  if (proximaFranja) {
    const antesDeAbrir = ahora.isBefore(franjas[0].inicio);
    return {
      estado: antesDeAbrir ? "antes_de_abrir" : "pausa",
      titulo: antesDeAbrir ? "Todavia no abre" : "En pausa",
      detalle: `${antesDeAbrir ? "Abre" : "Vuelve a abrir"} a las ${proximaFranja.horaInicio}.`,
    };
  }

  const ultimaFranja = franjas[franjas.length - 1];
  return {
    estado: "finalizado",
    titulo: "Jornada finalizada",
    detalle: `Hoy cerro a las ${ultimaFranja.horaFin}.`,
  };
}

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    turnosHoy: 0,
    pendientes: 0,
    totalClientes: 0,
    ingresosMes: 0,
    restantesHoy: 0,
    confirmadosHoy: 0,
    completadosHoy: 0,
  });
  const [turnosHoy, setTurnosHoy] = useState<TurnoBasico[]>([]);
  const [proximosTurnosHoy, setProximosTurnosHoy] = useState<ProximoTurno[]>([]);
  const [proximosTurnos, setProximosTurnos] = useState<ProximoTurno[]>([]);
  const [estadoJornada, setEstadoJornada] = useState<EstadoJornada>({
    estado: "cerrado",
    titulo: "Sin datos",
    detalle: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const ahora = dayjs();
      const fechaHoy = ahora.format("YYYY-MM-DD");

      const [turnosRes, clientesRes, horariosRes] = await Promise.all([
        axios.get<TurnoBasico[]>("http://localhost:3000/turnos"),
        axios.get<{ total: number }>("http://localhost:3000/clientes?limit=1"),
        axios.get<HorariosParaFecha>(`http://localhost:3000/configuracion/horarios-para-fecha?fecha=${fechaHoy}`),
      ]);

      const turnos = turnosRes.data;
      const hoy = ahora.startOf("day");
      const manana = hoy.add(1, "day");
      const inicioMes = ahora.startOf("month");
      const finMes = ahora.endOf("month");

      const turnosDeHoy = turnos
        .filter((turno) => {
          const fecha = dayjs(turno.fechaInicio);
          return !fecha.isBefore(hoy) && fecha.isBefore(manana) && turno.estado !== "cancelado";
        })
        .sort((a, b) => dayjs(a.fechaInicio).valueOf() - dayjs(b.fechaInicio).valueOf());

      const pendientes = turnos.filter((turno) => turno.estado === "pendiente").length;

      const ingresosMes = turnos
        .filter((turno) => {
          const fecha = dayjs(turno.fechaInicio);
          return turno.estado === "completado" && !fecha.isBefore(inicioMes) && !fecha.isAfter(finMes);
        })
        .reduce(
          (total, turno) => total + (turno.costoTotal ?? 0),
          0
        );

      const futuros = turnos
        .filter((turno) => turno.estado !== "cancelado" && dayjs(turno.fechaInicio).isAfter(ahora))
        .sort((a, b) => dayjs(a.fechaInicio).valueOf() - dayjs(b.fechaInicio).valueOf());

      const futurosHoy = futuros
        .filter((turno) => dayjs(turno.fechaInicio).isBefore(manana))
        .slice(0, 4)
        .map((turno) => ({
          ...turno,
          minutosRestantes: dayjs(turno.fechaInicio).diff(ahora, "minute"),
        }));

      const futurosDias = futuros
        .filter((turno) => !dayjs(turno.fechaInicio).isBefore(manana))
        .slice(0, 3)
        .map((turno) => ({
          ...turno,
          minutosRestantes: dayjs(turno.fechaInicio).diff(ahora, "minute"),
        }));

      setTurnosHoy(turnosDeHoy);
      setProximosTurnosHoy(futurosHoy);
      setProximosTurnos(futurosDias);
      setEstadoJornada(getEstadoJornada(horariosRes.data, ahora));
      setStats({
        turnosHoy: turnosDeHoy.length,
        pendientes,
        totalClientes: clientesRes.data.total,
        ingresosMes,
        restantesHoy: futurosHoy.length,
        confirmadosHoy: turnosDeHoy.filter((turno) => turno.estado === "confirmado").length,
        completadosHoy: turnosDeHoy.filter((turno) => turno.estado === "completado").length,
      });
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    const unsubTurnosActualizados = window.electron?.onTurnosActualizados(() => {
      fetchData();
    });

    return () => {
      clearInterval(interval);
      unsubTurnosActualizados?.();
    };
  }, [fetchData]);

  return {
    loading,
    stats,
    turnosHoy,
    proximosTurnosHoy,
    proximosTurnos,
    estadoJornada,
    refresh: fetchData,
  };
}
