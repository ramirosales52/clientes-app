import { useNavigate } from "react-router";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  DollarSign,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { useDashboard } from "@render/hooks/use-dashboard";
import TurnosModal from "./features/turnos/components/turnos-modal";
import { ClientesModal } from "./features/clientes/components/clientes-modal";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

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
  const { loading, stats, turnosHoy, proximosTurnos, refresh } = useDashboard();

  return (
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
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
              onClick={() => navigate("/turnos?estado=pendiente")}
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
            <TurnosModal className="w-full justify-start" />
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
                onClick={() => navigate("/turnos")}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Principal;
