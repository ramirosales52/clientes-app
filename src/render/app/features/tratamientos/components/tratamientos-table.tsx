import { Badge } from "@render/components/ui/badge";
import { Button } from "@render/components/ui/button";
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
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Tratamiento } from "@render/hooks/use-tratamientos";

interface Props {
  data: Tratamiento[];
  onViewDetail: (tratamiento: Tratamiento) => void;
  onEdit: (tratamiento: Tratamiento) => void;
  onDelete: (tratamiento: Tratamiento) => void;
}

type SortField = "nombre" | "costo" | "duracion";
type SortDirection = "asc" | "desc" | null;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

function getDurationVariant(
  minutes: number
): "default" | "secondary" | "outline" {
  if (minutes <= 30) return "secondary";
  if (minutes <= 60) return "default";
  return "outline";
}

export default function TratamientosTable({
  data,
  onViewDetail,
  onEdit,
  onDelete,
}: Props) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, "es", {
          sensitivity: "base",
        });
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    if (sortDirection === "asc") return <ChevronUp className="ml-2 h-4 w-4" />;
    if (sortDirection === "desc")
      return <ChevronDown className="ml-2 h-4 w-4" />;
    return <ChevronsUpDown className="ml-2 h-4 w-4" />;
  };

  const sortedData = getSortedData();

  return (
    <TooltipProvider>
      <div className="h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-muted scrollbar-track-transparent">
        <Table>
          <TableHeader className="bg-background sticky top-0 z-20">
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("nombre")}
              >
                <div className="flex items-center">
                  Nombre
                  {getSortIcon("nombre")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("costo")}
              >
                <div className="flex items-center">
                  Precio
                  {getSortIcon("costo")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("duracion")}
              >
                <div className="flex items-center">
                  Duracion
                  {getSortIcon("duracion")}
                </div>
              </TableHead>
              <TableHead className="w-[200px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.map((tratamiento) => (
              <TableRow key={tratamiento.id}>
                <TableCell className="font-medium">
                  {tratamiento.nombre}
                </TableCell>
                <TableCell>{formatCurrency(tratamiento.costo)}</TableCell>
                <TableCell>
                  <Badge
                    variant={getDurationVariant(tratamiento.duracion)}
                    className="gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {formatDuration(tratamiento.duracion)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetail(tratamiento)}
                    >
                      Ver detalle
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(tratamiento)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(tratamiento)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
