import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { useDashboard } from "@render/hooks/use-dashboard";
import { ClientesModal } from "./features/clientes/components/clientes-modal";
import { TurnoDetailSheet } from "./features/turno/components/turno-detail-sheet";
import type { Turno } from "@render/hooks/use-turnos";
import axios from "axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

function useReloj() {
  const [ahora, setAhora] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => setAhora(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  return ahora;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHora(fecha: string): string {
  return dayjs(fecha).format("HH:mm");
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function Principal() {
  const navigate = useNavigate();
  const ahora = useReloj();
  const { loading, stats, turnosHoy, proximosTurnos, refresh } = useDashboard();

  // Estado para el sheet de detalle
  const [sheetOpen, setSheetOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [loadingTurno, setLoadingTurno] = useState(false);

  const handleVerDetalle = useCallback(async (id: string) => {
    try {
      setLoadingTurno(true);
      const response = await axios.get<Turno>(`http://localhost:3000/turnos/${id}`);
      setTurnoSeleccionado(response.data);
      setSheetOpen(true);
    } catch (err) {
      console.error("Error al cargar turno:", err);
      toast.error("Error al cargar el turno");
    } finally {
      setLoadingTurno(false);
    }
  }, []);

  const handleUpdateEstado = useCallback(async (estado: string) => {
    if (!turnoSeleccionado) return;
    try {
      await axios.patch(`http://localhost:3000/turnos/${turnoSeleccionado.id}`, { estado });
      toast.success(`Turno ${estado === "confirmado" ? "confirmado" : estado === "cancelado" ? "cancelado" : estado === "completado" ? "completado" : "marcado como ausente"}`);
      setSheetOpen(false);
      setTurnoSeleccionado(null);
      refresh();
    } catch (err) {
      console.error("Error al actualizar turno:", err);
      toast.error("Error al actualizar el turno");
    }
  }, [turnoSeleccionado, refresh]);

  const handleDelete = useCallback(async () => {
    if (!turnoSeleccionado) return;
    try {
      await axios.delete(`http://localhost:3000/turnos/${turnoSeleccionado.id}`);
      toast.success("Turno eliminado");
      setSheetOpen(false);
      setTurnoSeleccionado(null);
      refresh();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
      toast.error("Error al eliminar el turno");
    }
  }, [turnoSeleccionado, refresh]);

  // Formato de fecha: "Jueves 18 de Agosto de 2025 — 08:32"
  const fechaFormateada = capitalizar(ahora.format("dddd D [de] MMMM [de] YYYY"));
  const horaFormateada = ahora.format("HH:mm");

  return (
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      {/* Header con fecha/hora */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold">{fechaFormateada}</h1>
            <span className="text-2xl text-muted-foreground">—</span>
            <span className="text-2xl font-medium tabular-nums">{horaFormateada}</span>
          </div>
          <p className="text-muted-foreground mt-1">
            Hoy tenes {stats.turnosHoy} {stats.turnosHoy === 1 ? "turno" : "turnos"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Turnos de hoy
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">
              {turnosHoy.filter((t) => t.estado === "confirmado").length} confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes de confirmar
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.pendientes}</span>
              {stats.pendientes > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Requiere atencion
                </Badge>
              )}
            </div>
            <Button
              variant="link"
              className="text-xs p-0 h-auto"
              onClick={() => navigate("/turno?estado=pendiente")}
            >
              Ver pendientes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <Button
              variant="link"
              className="text-xs p-0 h-auto"
              onClick={() => navigate("/clientes")}
            >
              Ver todos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.ingresosMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {capitalizar(dayjs().format("MMMM YYYY"))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rapidas y proximos turnos */}
      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Acciones rapidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rapidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/turno/nuevo">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Agendar turno
              </Link>
            </Button>
            <ClientesModal className="w-full justify-start" />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/calendario")}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Ver calendario
            </Button>
          </CardContent>
        </Card>

        {/* Proximos turnos */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Proximos turnos de hoy</CardTitle>
            {turnosHoy.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/turno")}
              >
                Ver todos
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {proximosTurnos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <CalendarPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  No hay mas turnos programados para hoy
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {proximosTurnos.map((turno) => (
                  <div
                    key={turno.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatHora(turno.fechaInicio)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {turno.cliente.nombre} {turno.cliente.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {turno.tratamientos.map((t) => t.nombre).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {turno.minutosRestantes <= 60 && (
                        <Badge variant="outline" className="text-xs">
                          En {turno.minutosRestantes} min
                        </Badge>
                      )}
                      <Badge
                        variant={
                          turno.estado === "confirmado" ? "default" : "secondary"
                        }
                      >
                        {turno.estado === "confirmado" ? "Confirmado" : "Pendiente"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleVerDetalle(turno.id)}
                        disabled={loadingTurno}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sheet de detalle */}
      <TurnoDetailSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setTurnoSeleccionado(null);
        }}
        turno={turnoSeleccionado}
        onConfirmar={() => handleUpdateEstado("confirmado")}
        onCancelar={() => handleUpdateEstado("cancelado")}
        onMarcarCompletado={() => handleUpdateEstado("completado")}
        onMarcarAusente={() => handleUpdateEstado("ausente")}
        onRegistrarPago={() => {
          // Por ahora redirigimos a la página de turnos
          setSheetOpen(false);
          navigate(`/turno?id=${turnoSeleccionado?.id}`);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Principal;
