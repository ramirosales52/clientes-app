import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@render/components/ui/dialog";
import { Button } from "@render/components/ui/button";
import { Input } from "@render/components/ui/input";
import { Label } from "@render/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@render/components/ui/select";
import { Separator } from "@render/components/ui/separator";
import { DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import {
  usePagos,
  METODOS_PAGO,
  type MetodoPago,
  calcularCostoTurno,
  calcularMontoPagado,
  calcularDeudaTurno,
} from "@render/hooks/use-pagos";

interface Turno {
  id: string;
  tratamientos: { id: string; nombre: string; costo: number }[];
  pagos?: { id: string; monto: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turno: Turno | null;
  onSuccess?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PagoModal({ open, onOpenChange, turno, onSuccess }: Props) {
  const { createPago, loading } = usePagos();
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [pagoCompleto, setPagoCompleto] = useState(true);

  const costoTotal = turno ? calcularCostoTurno(turno.tratamientos) : 0;
  const montoPagado = turno ? calcularMontoPagado(turno.pagos || []) : 0;
  const deuda = turno ? calcularDeudaTurno(turno.tratamientos, turno.pagos || []) : 0;

  useEffect(() => {
    if (open) {
      setMonto(deuda.toString());
      setPagoCompleto(true);
      setMetodoPago("efectivo");
    }
  }, [open, deuda]);

  useEffect(() => {
    if (pagoCompleto) {
      setMonto(deuda.toString());
    }
  }, [pagoCompleto, deuda]);

  const handleSubmit = async () => {
    if (!turno) return;

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    const result = await createPago({
      turnoId: turno.id,
      monto: montoNum,
      metodoPago,
    });

    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const montoNum = parseFloat(monto) || 0;
  const restaLuegoDePago = deuda - montoNum;
  const isValid = montoNum > 0 && montoNum <= deuda;

  if (!turno) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar pago
          </DialogTitle>
          <DialogDescription>
            Registra un pago para este turno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{formatCurrency(costoTotal)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagado</p>
              <p className="font-semibold text-green-600">{formatCurrency(montoPagado)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Resta</p>
              <p className="font-semibold text-orange-600">{formatCurrency(deuda)}</p>
            </div>
          </div>

          <Separator />

          {/* Tipo de pago */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={pagoCompleto ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPagoCompleto(true)}
            >
              Pago completo
            </Button>
            <Button
              type="button"
              variant={!pagoCompleto ? "default" : "outline"}
              className="flex-1"
              onClick={() => setPagoCompleto(false)}
            >
              Pago parcial
            </Button>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={pagoCompleto}
                className="pl-7"
                min={0}
                max={deuda}
              />
            </div>
            {!pagoCompleto && montoNum > 0 && montoNum < deuda && (
              <p className="text-xs text-muted-foreground">
                Resta pagar: {formatCurrency(restaLuegoDePago)}
              </p>
            )}
            {montoNum > deuda && (
              <p className="text-xs text-destructive">
                El monto excede la deuda
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as MetodoPago)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? "Registrando..." : `Registrar ${formatCurrency(montoNum)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
