import { Badge } from "@render/components/ui/badge";
import { Button } from "@render/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@render/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@render/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@render/components/ui/tooltip";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { EstadoTurno, Turno } from "@render/hooks/use-turnos";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface Props {
  data: Turno[];
  onConfirmar: (turno: Turno) => void;
  onCancelar: (turno: Turno) => void;
  onMarcarRealizado: (turno: Turno) => void;
  onDelete: (turno: Turno) => void;
}

type SortField = "fechaInicio" | "cliente" | "estado";
type SortDirection = "asc" | "desc" | null;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFecha(fecha: string): string {
  return dayjs(fecha).format("ddd DD MMM, HH:mm");
}

function formatDuration(inicio: string, fin: string): string {
  const minutos = dayjs(fin).diff(dayjs(inicio), "minute");
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const hours = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const estadoConfig: Record<
  EstadoTurno,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  confirmado: { label: "Confirmado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  realizado: { label: "Realizado", variant: "outline" },
};

function calcularCostoTotal(turno: Turno): number {
  return turno.tratamientos.reduce((total, t) => total + t.costo, 0);
}

export default function TurnosTable({
  data,
  onConfirmar,
  onCancelar,
  onMarcarRealizado,
  onDelete,
}: Props) {
  const [sortField, setSortField] = useState<SortField | null>("fechaInicio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : sortDirection === "desc"
            ? null
            : "asc"
      );
      if (sortDirection === "desc") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedData = () => {
    if (!sortField || !sortDirection) return data;

    return [...data].sort((a, b) => {
      if (sortField === "fechaInicio") {
        const comparison = new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (sortField === "cliente") {
        const aName = `${a.cliente.nombre} ${a.cliente.apellido}`;
        const bName = `${b.cliente.nombre} ${b.cliente.apellido}`;
        const comparison = aName.localeCompare(bName, "es", { sensitivity: "base" });
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (sortField === "estado") {
        const comparison = a.estado.localeCompare(b.estado);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === "asc") return <ChevronUp className="ml-2 h-4 w-4" />;
    if (sortDirection === "desc") return <ChevronDown className="ml-2 h-4 w-4" />;
    return <ChevronsUpDown className="ml-2 h-4 w-4" />;
  };

  const sortedData = getSortedData();

  const canConfirmar = (turno: Turno) => turno.estado === "pendiente";
  const canCancelar = (turno: Turno) =>
    turno.estado === "pendiente" || turno.estado === "confirmado";
  const canMarcarRealizado = (turno: Turno) =>
    turno.estado === "confirmado" || turno.estado === "pendiente";

  return (
    <TooltipProvider>
      <div className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-muted scrollbar-track-transparent">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-20">
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("cliente")}
              >
                <div className="flex items-center">
                  Cliente
                  {getSortIcon("cliente")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("fechaInicio")}
              >
                <div className="flex items-center">
                  Fecha
                  {getSortIcon("fechaInicio")}
                </div>
              </TableHead>
              <TableHead>Duracion</TableHead>
              <TableHead>Tratamientos</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("estado")}
              >
                <div className="flex items-center">
                  Estado
                  {getSortIcon("estado")}
                </div>
              </TableHead>
              <TableHead>Costo</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.map((turno) => {
              const config = estadoConfig[turno.estado];
              const tratamientosVisibles = turno.tratamientos.slice(0, 2);
              const tratamientosRestantes = turno.tratamientos.length - 2;

              return (
                <TableRow key={turno.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {turno.cliente.nombre} {turno.cliente.apellido}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-default">
                            <Phone className="h-3 w-3" />
                            {turno.cliente.codArea} {turno.cliente.numero}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          +54 9 {turno.cliente.codArea} {turno.cliente.numero}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{capitalizar(formatFecha(turno.fechaInicio))}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(turno.fechaInicio, turno.fechaFin)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tratamientosVisibles.map((t) => (
                        <Badge key={t.id} variant="outline" className="text-xs">
                          {t.nombre}
                        </Badge>
                      ))}
                      {tratamientosRestantes > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs cursor-default">
                              +{tratamientosRestantes}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col gap-1">
                              {turno.tratamientos.slice(2).map((t) => (
                                <span key={t.id}>{t.nombre}</span>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(calcularCostoTotal(turno))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canConfirmar(turno) && (
                          <DropdownMenuItem onClick={() => onConfirmar(turno)}>
                            <Check className="mr-2 h-4 w-4" />
                            Confirmar
                          </DropdownMenuItem>
                        )}
                        {canMarcarRealizado(turno) && (
                          <DropdownMenuItem onClick={() => onMarcarRealizado(turno)}>
                            <Check className="mr-2 h-4 w-4" />
                            Marcar realizado
                          </DropdownMenuItem>
                        )}
                        {canCancelar(turno) && (
                          <DropdownMenuItem
                            onClick={() => onCancelar(turno)}
                            className="text-destructive focus:text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar turno
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(turno)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
