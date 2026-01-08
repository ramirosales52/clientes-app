import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@render/components/ui/sheet";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { Separator } from "@render/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@render/components/ui/table";
import { Skeleton } from "@render/components/ui/skeleton";
import {
  Clock,
  DollarSign,
  History,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  PrecioHistorial,
  Tratamiento,
} from "@render/hooks/use-tratamientos";

interface Props {
  tratamiento: Tratamiento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tratamiento: Tratamiento) => void;
  onDelete: (tratamiento: Tratamiento) => void;
  fetchHistorial: (id: string) => Promise<PrecioHistorial[]>;
}

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function PriceChangeIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (previous === null) {
    return null;
  }

  const diff = current - previous;
  const percentage = ((diff / previous) * 100).toFixed(1);

  if (diff > 0) {
    return (
      <Badge className="gap-1 text-xs bg-green-100 text-green-800 hover:bg-green-100">
        <TrendingUp className="h-3 w-3" />+{percentage}%
      </Badge>
    );
  }

  if (diff < 0) {
    return (
      <Badge className="gap-1 text-xs bg-red-100 text-red-800 hover:bg-red-100">
        <TrendingDown className="h-3 w-3" />
        {percentage}%
      </Badge>
    );
  }

  return null;
}

export default function TratamientoDetailSheet({
  tratamiento,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  fetchHistorial,
}: Props) {
  const [historial, setHistorial] = useState<PrecioHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (open && tratamiento) {
      setLoadingHistorial(true);
      fetchHistorial(tratamiento.id)
        .then((data) => setHistorial(data))
        .catch(() => setHistorial([]))
        .finally(() => setLoadingHistorial(false));
    }
  }, [open, tratamiento, fetchHistorial]);

  const handleEdit = () => {
    if (tratamiento) {
      onOpenChange(false);
      onEdit(tratamiento);
    }
  };

  const handleDelete = () => {
    if (tratamiento) {
      onOpenChange(false);
      onDelete(tratamiento);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{tratamiento?.nombre}</SheetTitle>
          <SheetDescription>Detalle del tratamiento</SheetDescription>
        </SheetHeader>

        {tratamiento && (
          <div className="mt-6 space-y-6">
            {/* Info principal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Precio actual
                </p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(tratamiento.costo)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duracion
                </p>
                <p className="text-2xl font-semibold">
                  {formatDuration(tratamiento.duracion)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Creado el
              </p>
              <p className="text-sm">{formatDate(tratamiento.creadoEn)}</p>
            </div>

            <Separator />

            {/* Acciones */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
            </div>

            <Separator />

            {/* Historial de precios */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial de precios
              </h3>

              {loadingHistorial ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : historial.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin historial de precios
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Precio</TableHead>
                      <TableHead className="text-xs w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map((item, index) => {
                      const previousItem = historial[index + 1];
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {formatDateTime(item.fecha)}
                          </TableCell>
                          <TableCell className="font-medium py-2">
                            {formatCurrency(item.precio)}
                          </TableCell>
                          <TableCell className="py-2">
                            <PriceChangeIndicator
                              current={item.precio}
                              previous={previousItem?.precio ?? null}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
