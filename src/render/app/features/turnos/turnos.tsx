import { useState } from "react";
import { Calendar, CalendarDays, RefreshCw, Search } from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
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
import TurnosModal from "./components/turnos-modal";
import { DeleteTurnoDialog } from "./components/delete-turno-dialog";

function Turnos() {
  const {
    loading,
    filters,
    setFilters,
    fetchTurnos,
    confirmarTurno,
    cancelarTurno,
    marcarRealizado,
    deleteTurno,
    getFilteredTurnos,
    getTurnosHoy,
  } = useTurnos();

  const [turnoToDelete, setTurnoToDelete] = useState<Turno | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredTurnos = getFilteredTurnos();
  const turnosHoy = getTurnosHoy();

  const handleConfirmar = async (turno: Turno) => {
    await confirmarTurno(turno.id);
  };

  const handleCancelar = async (turno: Turno) => {
    await cancelarTurno(turno.id);
  };

  const handleMarcarRealizado = async (turno: Turno) => {
    await marcarRealizado(turno.id);
  };

  const handleDeleteClick = (turno: Turno) => {
    setTurnoToDelete(turno);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (turnoToDelete) {
      await deleteTurno(turnoToDelete.id);
      setDeleteDialogOpen(false);
      setTurnoToDelete(null);
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
    <div className="flex flex-col h-full gap-4 p-4">
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
          <TurnosModal />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="realizado">Realizado</SelectItem>
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
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
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
              {!hasActiveFilters && <TurnosModal />}
            </div>
          ) : (
            <TurnosTable
              data={filteredTurnos}
              onConfirmar={handleConfirmar}
              onCancelar={handleCancelar}
              onMarcarRealizado={handleMarcarRealizado}
              onDelete={handleDeleteClick}
            />
          )}
        </CardContent>
      </Card>

      <DeleteTurnoDialog
        turno={turnoToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default Turnos;
