import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  Clock,
  DollarSign,
  Eye,
  Inbox,
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { Separator } from "@render/components/ui/separator";
import { AlertasPanel } from "./components/alertas-panel";
import { useDashboard, type ProximoTurno } from "@render/hooks/use-dashboard";
import { TurnoDetailSheet } from "./features/turno/components/turno-detail-sheet";
import type { Turno } from "@render/hooks/use-turnos";
import { toast } from "sonner";
import { api } from "@render/lib/api";
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

function formatFechaCorta(fecha: string): string {
  return dayjs(fecha).format("ddd D MMM");
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function estadoBadgeVariant(estado: string): "default" | "secondary" | "outline" | "destructive" {
  if (estado === "confirmado") return "default";
  if (estado === "pendiente") return "secondary";
  if (estado === "ausente") return "destructive";
  return "outline";
}

function TurnoRow({
  turno,
  onView,
  loadingTurno,
  mostrarFecha = false,
}: {
  turno: ProximoTurno;
  onView: (id: string) => void;
  loadingTurno: boolean;
  mostrarFecha?: boolean;
}) {
  const fechaEsHoy = dayjs(turno.fechaInicio).isSame(dayjs(), "day");

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex min-w-20 items-center gap-2 text-sm font-medium tabular-nums">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span>{formatHora(turno.fechaInicio)}</span>
            {mostrarFecha && (
              <span className="text-xs font-normal text-muted-foreground">
                {fechaEsHoy ? "Hoy" : capitalizar(formatFechaCorta(turno.fechaInicio))}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="font-medium">
            {turno.cliente.nombre} {turno.cliente.apellido}
          </p>
          <p className="text-sm text-muted-foreground">
            {turno.tratamientos.map((tratamiento) => tratamiento.nombre).join(", ")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-auto">
        {turno.minutosRestantes <= 60 * 24 && (
          <Badge variant="outline" className="text-xs">
            {turno.minutosRestantes <= 60
              ? `En ${turno.minutosRestantes} min`
              : `En ${Math.floor(turno.minutosRestantes / 60)} h`}
          </Badge>
        )}
        <Badge variant={estadoBadgeVariant(turno.estado)} className="capitalize">
          {turno.estado}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(turno.id)}
          disabled={loadingTurno}
          aria-label="Ver detalle del turno"
          title="Ver detalle del turno"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Principal() {
  const navigate = useNavigate();
  const ahora = useReloj();
  const {
    loading,
    stats,
    turnosHoy,
    proximosTurnosHoy,
    proximosTurnos,
    estadoJornada,
    refresh,
  } = useDashboard();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [loadingTurno, setLoadingTurno] = useState(false);

  const handleVerDetalle = useCallback(async (id: string) => {
    try {
      setLoadingTurno(true);
      const response = await api.get<Turno>(`/turnos/${id}`);
      setTurnoSeleccionado(response.data);
      setSheetOpen(true);
    } catch (err) {
      console.error("Error al cargar turno:", err);
      toast.error("Error al cargar el turno");
    } finally {
      setLoadingTurno(false);
    }
  }, []);

  const handleUpdateEstado = useCallback(
    async (estado: string) => {
      if (!turnoSeleccionado) return;
      try {
        await api.patch(`/turnos/${turnoSeleccionado.id}`, { estado });
        toast.success(
          `Turno ${
            estado === "confirmado"
              ? "confirmado"
              : estado === "cancelado"
                ? "cancelado"
                : estado === "completado"
                  ? "completado"
                  : "marcado como ausente"
          }`
        );
        setSheetOpen(false);
        setTurnoSeleccionado(null);
        refresh();
      } catch (err) {
        console.error("Error al actualizar turno:", err);
        toast.error("Error al actualizar el turno");
      }
    },
    [turnoSeleccionado, refresh]
  );

  const handleDelete = useCallback(async () => {
    if (!turnoSeleccionado) return;
    try {
      await api.delete(`/turnos/${turnoSeleccionado.id}`);
      toast.success("Turno eliminado");
      setSheetOpen(false);
      setTurnoSeleccionado(null);
      refresh();
    } catch (err) {
      console.error("Error al eliminar turno:", err);
      toast.error("Error al eliminar el turno");
    }
  }, [turnoSeleccionado, refresh]);

  const fechaFormateada = capitalizar(ahora.format("dddd D [de] MMMM [de] YYYY"));
  const horaFormateada = ahora.format("HH:mm");

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2 md:p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{fechaFormateada}</h1>
            <span className="hidden text-2xl text-muted-foreground md:inline">—</span>
            <span className="text-2xl font-medium tabular-nums md:text-3xl">{horaFormateada}</span>
          </div>
          <p className="text-sm text-muted-foreground">{estadoJornada.detalle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AlertasPanel />
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
            aria-label="Actualizar dashboard"
            title="Actualizar dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-l-4 border-l-primary/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado del dia</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{estadoJornada.titulo}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{estadoJornada.detalle}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Turnos de hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmadosHoy} confirmados, {stats.completadosHoy} completados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-400/50">
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
              className="h-auto p-0 text-xs"
              onClick={() => navigate("/turno?estado=pendiente")}
            >
              Ver pendientes
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-400/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => navigate("/clientes")}
            >
              Ver todos
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-400/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.ingresosMes)}</div>
            <p className="text-xs text-muted-foreground">{capitalizar(dayjs().format("MMMM YYYY"))}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Agenda inmediata</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/turno")}>
                Ver todos
              </Button>
              <Button asChild size="sm">
                <Link to="/turno/nuevo">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Agendar turno
                </Link>
              </Button>
            </div>
          </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto">
            {proximosTurnosHoy.length === 0 && proximosTurnos.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <div className="mb-2 rounded-full bg-muted p-3">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No hay turnos próximos cargados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Lo que queda hoy</h3>
                    <Badge variant="outline">{stats.restantesHoy}</Badge>
                  </div>
                  {proximosTurnosHoy.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      Ya no quedan turnos para hoy.
                    </div>
                  ) : (
                    proximosTurnosHoy.map((turno) => (
                      <TurnoRow
                        key={turno.id}
                        turno={turno}
                        onView={handleVerDetalle}
                        loadingTurno={loadingTurno}
                      />
                    ))
                  )}
                </div>

                {proximosTurnos.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Próximos turnos</h3>
                        <Badge variant="outline">{proximosTurnos.length}</Badge>
                      </div>
                      {proximosTurnos.map((turno) => (
                        <TurnoRow
                          key={turno.id}
                          turno={turno}
                          onView={handleVerDetalle}
                          loadingTurno={loadingTurno}
                          mostrarFecha
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen del día</CardTitle>
          </CardHeader>
            <CardContent className="space-y-3">
            <div className="rounded-lg border p-2.5">
              <p className="text-sm font-medium">Actividad de hoy</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cargados</p>
                  <p className="text-lg font-semibold">{stats.turnosHoy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Restantes</p>
                  <p className="text-lg font-semibold">{stats.restantesHoy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confirmados</p>
                  <p className="text-lg font-semibold">{stats.confirmadosHoy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completados</p>
                  <p className="text-lg font-semibold">{stats.completadosHoy}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-2.5">
              <p className="text-sm font-medium">Atajos utiles</p>
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="outline" className="justify-start" onClick={() => navigate("/turno/nuevo")}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Agendar nuevo turno
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate("/clientes")}>
                  <Users className="mr-2 h-4 w-4" />
                  Ver clientes
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate("/pagos")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Revisar pagos
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-2.5 text-sm text-muted-foreground">
              {turnosHoy.length === 0
                ? "Hoy no hay turnos cargados. Aprovechá para revisar la agenda de los próximos días."
                : stats.restantesHoy === 0
                  ? "Ya no quedan turnos pendientes para hoy. Te mostramos igualmente lo próximo que viene."
                  : `Todavía quedan ${stats.restantesHoy} turno${stats.restantesHoy !== 1 ? "s" : ""} para hoy.`}
            </div>
          </CardContent>
        </Card>
      </div>

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
          setSheetOpen(false);
          navigate(`/turno?id=${turnoSeleccionado?.id}`);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Principal;
