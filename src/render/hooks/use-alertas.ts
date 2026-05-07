import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import type { TurnoBasico } from "@render/hooks/use-dashboard";
import type { Recordatorio } from "@render/app/features/whatsapp/types";

export type TipoAlerta = "error" | "warning" | "info" | "success";

export interface AlertaItem {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  descripcion: string;
  ctaLabel?: string;
  ctaHref?: string;
  meta?: string;
}

type WhatsappStatus = {
  authenticated: boolean;
  ready: boolean;
};

function buildAlertas(
  turnos: TurnoBasico[],
  recordatorios: Recordatorio[],
  whatsapp: WhatsappStatus
): AlertaItem[] {
  const ahora = dayjs();
  const proximas24h = ahora.add(24, "hour");

  const pendientes24h = turnos.filter((turno) => {
    const fecha = dayjs(turno.fechaInicio);
    return turno.estado === "pendiente" && fecha.isAfter(ahora) && fecha.isBefore(proximas24h);
  });

  const fallidos = recordatorios.filter((recordatorio) => recordatorio.estado === "fallido");
  const programadosAtrasados = recordatorios.filter((recordatorio) => {
    return recordatorio.estado === "programado" && dayjs(recordatorio.fechaProgramada).isBefore(ahora);
  });

  const enviadosRecientes = recordatorios.filter((recordatorio) => {
    return recordatorio.estado === "enviado" && dayjs(recordatorio.fechaEnvio).isAfter(ahora.subtract(6, "hour"));
  });

  const alertas: AlertaItem[] = [];

  if (!whatsapp.ready) {
    alertas.push({
      id: "whatsapp-offline",
      tipo: whatsapp.authenticated ? "warning" : "error",
      titulo: whatsapp.authenticated ? "WhatsApp todavía no está listo" : "WhatsApp desconectado",
      descripcion: whatsapp.authenticated
        ? "La sesión existe pero todavía no quedó disponible para enviar mensajes."
        : "Los recordatorios y mensajes manuales no se van a poder enviar hasta reconectar.",
      ctaLabel: "Revisar WhatsApp",
      ctaHref: "/whatsapp",
    });
  }

  if (fallidos.length > 0) {
    alertas.push({
      id: "recordatorios-fallidos",
      tipo: "error",
      titulo: `${fallidos.length} recordatorio${fallidos.length !== 1 ? "s" : ""} fallido${fallidos.length !== 1 ? "s" : ""}`,
      descripcion: "Conviene revisarlos para reenviar o corregir los datos del cliente.",
      ctaLabel: "Ver recordatorios",
      ctaHref: "/whatsapp",
    });
  }

  if (programadosAtrasados.length > 0) {
    alertas.push({
      id: "recordatorios-atrasados",
      tipo: "warning",
      titulo: `${programadosAtrasados.length} recordatorio${programadosAtrasados.length !== 1 ? "s" : ""} pendiente${programadosAtrasados.length !== 1 ? "s" : ""}`,
      descripcion: "Ya están fuera de hora y todavía no fueron procesados.",
      ctaLabel: "Procesar ahora",
      ctaHref: "/whatsapp",
    });
  }

  if (pendientes24h.length > 0) {
    alertas.push({
      id: "turnos-pendientes-24h",
      tipo: "warning",
      titulo: `${pendientes24h.length} turno${pendientes24h.length !== 1 ? "s" : ""} pendiente${pendientes24h.length !== 1 ? "s" : ""} en menos de 24h`,
      descripcion: "Podrían necesitar confirmación manual para evitar huecos en la agenda.",
      ctaLabel: "Ver turnos",
      ctaHref: "/turno?estado=pendiente",
    });
  }

  if (enviadosRecientes.length > 0 && fallidos.length === 0 && whatsapp.ready) {
    alertas.push({
      id: "recordatorios-ok",
      tipo: "success",
      titulo: "Recordatorios funcionando correctamente",
      descripcion: `${enviadosRecientes.length} mensaje${enviadosRecientes.length !== 1 ? "s" : ""} enviado${enviadosRecientes.length !== 1 ? "s" : ""} en las últimas horas.`,
      ctaLabel: "Abrir panel",
      ctaHref: "/whatsapp",
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      id: "sin-alertas",
      tipo: "info",
      titulo: "Todo en orden",
      descripcion: "No hay alertas críticas ni pendientes urgentes por revisar.",
    });
  }

  return alertas.slice(0, 5);
}

export function useAlertas() {
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const [turnosRes, recordatoriosRes, whatsappRes] = await Promise.all([
        axios.get<TurnoBasico[]>("http://localhost:3000/turnos"),
        axios.get<Recordatorio[]>("http://localhost:3000/recordatorios"),
        axios.get<WhatsappStatus>("http://localhost:3000/whatsapp/status"),
      ]);

      setAlertas(buildAlertas(turnosRes.data, recordatoriosRes.data, whatsappRes.data));
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setAlertas([
        {
          id: "alertas-error",
          tipo: "error",
          titulo: "No se pudieron cargar las alertas",
          descripcion: "Revisa la conexión con la API para ver el estado general de la app.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000);
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  return {
    alertas,
    loading,
    refresh: fetchAlertas,
  };
}
