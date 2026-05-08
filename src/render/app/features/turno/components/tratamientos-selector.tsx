import { Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@render/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@render/components/ui/dialog";
import { cn } from "@render/lib/utils";

interface Tratamiento {
  id: string;
  nombre: string;
  duracion: number;
  costo: number;
}

interface TratamientosSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tratamientos: Tratamiento[];
  seleccionados: string[];
  onToggle: (id: string) => void;
  onAddTratamiento: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TratamientosSelector({
  open,
  onOpenChange,
  tratamientos,
  seleccionados,
  onToggle,
  onAddTratamiento,
}: TratamientosSelectorProps) {
  const cantidad = seleccionados.length;
  const duracionTotal = tratamientos
    .filter((t) => seleccionados.includes(t.id))
    .reduce((sum, t) => sum + t.duracion, 0);
  const costoTotal = tratamientos
    .filter((t) => seleccionados.includes(t.id))
    .reduce((sum, t) => sum + t.costo, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Seleccionar tratamientos
          </DialogTitle>
          <DialogDescription>
            Selecciona los tratamientos para este turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-auto py-1">
          {tratamientos.map((t) => {
            const isSelected = seleccionados.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                className={cn(
                  "w-full p-3 rounded-md border text-left transition-colors",
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-4 w-4 border rounded flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className={cn("font-medium", isSelected && "text-primary")}>
                      {t.nombre}
                    </span>
                  </div>
                  <span className="font-medium shrink-0">
                    {formatCurrency(t.costo)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 ml-6 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t.duracion} min
                </div>
              </button>
            );
          })}
        </div>

        {cantidad > 0 && (
          <div className="flex items-center justify-between text-sm px-1 border-t pt-3">
            <span className="text-muted-foreground">
              {cantidad} {cantidad === 1 ? "tratamiento" : "tratamientos"} - {duracionTotal} min
            </span>
            <span className="font-semibold">{formatCurrency(costoTotal)}</span>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAddTratamiento}>
            Agregar tratamiento
          </Button>
          <DialogClose asChild>
            <Button>Confirmar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
