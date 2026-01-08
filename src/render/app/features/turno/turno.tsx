import { useState } from "react";
import { Link } from "react-router";
import { Calendar, CalendarDays, CalendarPlus, RefreshCw, Search } from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardHeader } from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@render/components/ui/select";
import { Badge } from "@render/components/ui/badge";
import { useTurnos, type EstadoTurno, type Turno } from "@render/hooks/use-turnos";
import TurnosTable from "./components/turnos-table";
import { DeleteTurnoDialog } from "./components/delete-turno-dialog";
import { PagoModal } from "./components/pago-modal";
import { TurnoDetailSheet } from "./components/turno-detail-sheet";

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

  const filteredTurnos = getFilteredTurnos();
  const turnosHoy = getTurnosHoy();

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
  };

  const hasActiveFilters = filters.estado || filters.clienteNombre || filters.fechaDesde;

  return (
    <div className="flex flex-col h-screen w-full gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Turnos</h1>
          {turnosHoy.length > 0 && (
            <Badge variant="default" className="gap-1">
              <CalendarDays className="h-3 w-3" />
              {turnosHoy.length} hoy
            </Badge>
          )}
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

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9 w-56"
                value={filters.clienteNombre || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Select
              value={filters.estado || "todos"}
              onValueChange={handleEstadoChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredTurnos.length} turno{filteredTurnos.length !== 1 ? "s" : ""}
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
