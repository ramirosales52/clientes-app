import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CircleCheck,
  CircleDashed,
  RefreshCw,
  Search,
  UserX,
} from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@render/components/ui/select";
import { Badge } from "@render/components/ui/badge";
import { Separator } from "@render/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import { useTurnos, type EstadoTurno, type Turno } from "@render/hooks/use-turnos";
import TurnosTable from "./components/turnos-table";
import { DeleteTurnoDialog } from "./components/delete-turno-dialog";
import { PagoModal } from "./components/pago-modal";
import { TurnoDetailSheet } from "./components/turno-detail-sheet";
import dayjs from "dayjs";

function Turno() {
  const {
    loading,
    filters,
    setFilters,
    fetchTurnos,
    confirmarTurno,
    cancelarTurno,
    marcarCompletado,
    marcarAusente,
    deleteTurno,
    getFilteredTurnos,
    getTurnosHoy,
  } = useTurnos();

  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [quickRange, setQuickRange] = useState<"todos" | "hoy" | "semana" | "mes" | "personalizado">("todos");

  const filteredTurnos = getFilteredTurnos();
  const turnosHoy = getTurnosHoy();

  const kpis = useMemo(() => {
    const pendientes = filteredTurnos.filter((turno) => turno.estado === "pendiente").length;
    const confirmados = filteredTurnos.filter((turno) => turno.estado === "confirmado").length;
    const completados = filteredTurnos.filter((turno) => turno.estado === "completado").length;
    const ausentes = filteredTurnos.filter((turno) => turno.estado === "ausente").length;

    return {
      total: filteredTurnos.length,
      hoy: turnosHoy.length,
      pendientes,
      confirmados,
      completados,
      ausentes,
    };
  }, [filteredTurnos, turnosHoy]);

  const handleVerDetalle = (turno: Turno) => {
    setTurnoSeleccionado(turno);
    setSheetOpen(true);
  };

  const handleConfirmar = async () => {
    if (turnoSeleccionado) {
      await confirmarTurno(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleCancelar = async () => {
    if (turnoSeleccionado) {
      await cancelarTurno(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleMarcarCompletado = async () => {
    if (turnoSeleccionado) {
      await marcarCompletado(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleMarcarAusente = async () => {
    if (turnoSeleccionado) {
      await marcarAusente(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleRegistrarPago = () => {
    setSheetOpen(false);
    setPagoModalOpen(true);
  };

  const handlePagoSuccess = () => {
    fetchTurnos();
  };

  const handleDeleteClick = () => {
    setSheetOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (turnoSeleccionado) {
      await deleteTurno(turnoSeleccionado.id);
      setDeleteDialogOpen(false);
      setTurnoSeleccionado(null);
    }
  };

  const handleEstadoChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      estado: value === "todos" ? undefined : (value as EstadoTurno),
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      clienteNombre: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setQuickRange("todos");
  };

  const applyQuickRange = (value: "todos" | "hoy" | "semana" | "mes" | "personalizado") => {
    setQuickRange(value);

    if (value === "personalizado") return;

    if (value === "todos") {
      setFilters((prev) => ({ ...prev, fechaDesde: undefined, fechaHasta: undefined }));
      return;
    }

    const ahora = dayjs();
    let desde = ahora;
    let hasta = ahora;

    if (value === "semana") {
      desde = ahora.startOf("week");
      hasta = ahora.endOf("week");
    }

    if (value === "mes") {
      desde = ahora.startOf("month");
      hasta = ahora.endOf("month");
    }

    setFilters((prev) => ({
      ...prev,
      fechaDesde: desde.format("YYYY-MM-DD"),
      fechaHasta: hasta.format("YYYY-MM-DD"),
    }));
  };

  const hasActiveFilters = filters.estado || filters.clienteNombre || filters.fechaDesde || filters.fechaHasta;

  return (
    <div className="flex flex-col h-full w-full gap-2 p-2 md:p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Turnos</h1>
            {turnosHoy.length > 0 && (
              <Badge variant="default" className="gap-1">
                <CalendarDays className="h-3 w-3" />
                {turnosHoy.length} hoy
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Agenda y seguimiento de turnos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTurnos()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild>
            <Link to="/turno/nuevo">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Agendar turno
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">Segun filtros actuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{kpis.hoy}</p>
            <p className="text-xs text-muted-foreground">No cancelados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <CircleDashed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600">{kpis.pendientes}</p>
            <p className="text-xs text-muted-foreground">Esperan confirmacion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmados</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">{kpis.confirmados}</p>
            <p className="text-xs text-muted-foreground">Listos para asistir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
            <CircleCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-sky-600">{kpis.completados}</p>
            <p className="text-xs text-muted-foreground">Ya realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausentes</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-orange-600">{kpis.ausentes}</p>
            <p className="text-xs text-muted-foreground">No asistieron</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Agenda de turnos</CardTitle>
            <CardDescription>
              Filtra por estado, fecha y cliente para trabajar la agenda más rápido.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9"
                value={filters.clienteNombre || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Select value={filters.estado || "todos"} onValueChange={handleEstadoChange}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={quickRange} onValueChange={(value) => applyQuickRange(value as typeof quickRange)}>
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="hoy">Hoy</TabsTrigger>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mes</TabsTrigger>
                <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
              </TabsList>
            </Tabs>

            <Input
              type="date"
              className="w-full sm:w-44"
              value={filters.fechaDesde || ""}
              onChange={(e) => {
                setQuickRange("personalizado");
                setFilters((prev) => ({
                  ...prev,
                  fechaDesde: e.target.value || undefined,
                }));
              }}
            />

            <Input
              type="date"
              className="w-full sm:w-44"
              value={filters.fechaHasta || ""}
              onChange={(e) => {
                setQuickRange("personalizado");
                setFilters((prev) => ({
                  ...prev,
                  fechaHasta: e.target.value || undefined,
                }));
              }}
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredTurnos.length} turno{filteredTurnos.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700">
                Pendientes: {kpis.pendientes}
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
                Confirmados: {kpis.confirmados}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-4 pt-0">
          {filteredTurnos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="rounded-full bg-muted p-6">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {hasActiveFilters
                    ? "No hay turnos que coincidan con los filtros"
                    : "No hay turnos registrados"}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {hasActiveFilters
                    ? "Intenta ajustar los filtros de busqueda"
                    : "Agenda tu primer turno para comenzar"}
                </p>
              </div>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link to="/turno/nuevo">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Agendar turno
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <TurnosTable data={filteredTurnos} onVerDetalle={handleVerDetalle} />
          )}
        </CardContent>
      </Card>

      <TurnoDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        turno={turnoSeleccionado}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
        onMarcarCompletado={handleMarcarCompletado}
        onMarcarAusente={handleMarcarAusente}
        onRegistrarPago={handleRegistrarPago}
        onDelete={handleDeleteClick}
      />

      <DeleteTurnoDialog
        turno={turnoSeleccionado}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      <PagoModal
        open={pagoModalOpen}
        onOpenChange={setPagoModalOpen}
        turno={turnoSeleccionado}
        onSuccess={handlePagoSuccess}
      />
    </div>
  );
}

export default Turno;
