import { Check, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "@render/components/ui/input";
import { cn } from "@render/lib/utils";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  codArea: string;
  numero: string;
}

interface ClientesSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Cliente[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddCliente: () => void;
}

function formatPhone(codArea: string, numero: string): string {
  return `(${codArea}) ${numero}`;
}

export function ClientesSelector({
  open,
  onOpenChange,
  clientes,
  selectedId,
  onSelect,
  onAddCliente,
}: ClientesSelectorProps) {
  const [search, setSearch] = useState("");

  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clientes;

    return clientes.filter((cliente) => {
      const nombre = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
      const telefono = formatPhone(cliente.codArea, cliente.numero).toLowerCase();
      return nombre.includes(term) || telefono.includes(term);
    });
  }, [clientes, search]);

  const clienteSeleccionado = clientes.find((cliente) => cliente.id === selectedId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Seleccionar cliente
          </DialogTitle>
          <DialogDescription>
            Elegí el cliente para este turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9"
            />
          </div>

          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {clientesFiltrados.map((cliente) => {
              const isSelected = cliente.id === selectedId;

              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => onSelect(cliente.id)}
                  className={cn(
                    "w-full rounded-md border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {cliente.nombre[0]}
                      {cliente.apellido[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {cliente.nombre} {cliente.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPhone(cliente.codArea, cliente.numero)}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              );
            })}

            {clientesFiltrados.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No se encontraron clientes.
              </div>
            )}
          </div>
        </div>

        {clienteSeleccionado && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            Seleccionado: <span className="font-medium">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAddCliente}>
            Agregar cliente
          </Button>
          <DialogClose asChild>
            <Button>Confirmar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
