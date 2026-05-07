import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@render/components/ui/sheet";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import { Separator } from "@render/components/ui/separator";
import {
  Calendar,
  Check,
  Clock,
  DollarSign,
  Phone,
  Trash2,
  User,
  UserX,
  X,
} from "lucide-react";
import type { EstadoTurno, Turno } from "@render/hooks/use-turnos";
import {
  calcularCostoTurno,
  calcularMontoPagado,
  METODOS_PAGO,
} from "@render/hooks/use-pagos";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ScrollArea } from "@render/components/ui/scroll-area";

dayjs.locale("es");

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turno: Turno | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  onMarcarCompletado: () => void;
  onMarcarAusente: () => void;
  onRegistrarPago: () => void;
  onDelete: () => void;
}

const estadoConfig: Record<
  EstadoTurno,
  { label: string; className: string }
> = {
  pendiente: { label: "Pendiente", className: "border-amber-500/40 bg-amber-500/10 text-amber-700" },
  confirmado: { label: "Confirmado", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700" },
  completado: { label: "Completado", className: "border-sky-500/40 bg-sky-500/10 text-sky-700" },
  cancelado: { label: "Cancelado", className: "border-rose-500/40 bg-rose-500/10 text-rose-700" },
  ausente: { label: "Ausente", className: "border-orange-500/40 bg-orange-500/10 text-orange-700" },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFecha(fecha: string): string {
  return dayjs(fecha).format("dddd D [de] MMMM, YYYY");
}

function formatHora(fecha: string): string {
  return dayjs(fecha).format("HH:mm");
}

function formatFechaCorta(fecha: string): string {
  return dayjs(fecha).format("DD/MM/YY HH:mm");
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function TurnoDetailSheet({
  open,
  onOpenChange,
  turno,
  onConfirmar,
  onCancelar,
  onMarcarCompletado,
  onMarcarAusente,
  onRegistrarPago,
  onDelete,
}: Props) {
  if (!turno) return null;

  const config = estadoConfig[turno.estado];
  const costoTotal = turno.costoTotal ?? calcularCostoTurno(turno.tratamientos, turno.costoTotal);
  const montoPagado = calcularMontoPagado(turno.pagos || []);
  const deuda = costoTotal - montoPagado;
  const tratamientosParaDetalle = turno.tratamientosSnapshot?.length
    ? turno.tratamientosSnapshot
    : turno.tratamientos.map((tratamiento) => ({
        id: tratamiento.id,
        nombre: tratamiento.nombre,
        costo: tratamiento.costo,
        duracion: tratamiento.duracion,
      }));

  const canConfirmar = turno.estado === "pendiente";
  const canCancelar = turno.estado === "pendiente" || turno.estado === "confirmado";
  const canMarcarCompletado = turno.estado === "confirmado" || turno.estado === "pendiente";
  const canMarcarAusente = turno.estado === "confirmado" || turno.estado === "pendiente";
  const canRegistrarPago = turno.estado === "completado" && deuda > 0;

  const historial = [...(turno.historialEstados || [])].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Detalle del turno
            <Badge variant="outline" className={config.className}>{config.label}</Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-6.5rem)] pr-2">
          <div className="space-y-4 py-6">
          {/* Fecha y Horario */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-5 w-5 text-primary" />
              <span>
                {capitalizar(formatFecha(turno.fechaInicio))}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatHora(turno.fechaInicio)} - {formatHora(turno.fechaFin)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Cliente */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Cliente</h4>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {turno.cliente.nombre} {turno.cliente.apellido}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {turno.cliente.codArea} {turno.cliente.numero}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tratamientos */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Tratamientos</h4>
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              {tratamientosParaDetalle.map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span>{t.nombre}</span>
                  <span className="text-muted-foreground">{formatCurrency(t.costo)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium pt-1">
                <span>Total</span>
                <span>{formatCurrency(costoTotal)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Estado de pago */}
          {turno.estado === "completado" && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Pagos</h4>
                
                 {turno.pagos && turno.pagos.length > 0 ? (
                  <div className="space-y-2">
                    {turno.pagos.map((pago) => {
                      const metodoLabel = METODOS_PAGO.find(m => m.value === pago.metodoPago)?.label || pago.metodoPago;
                      return (
                        <div key={pago.id} className="space-y-1 rounded-lg bg-muted/50 p-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-600">
                              {formatCurrency(pago.monto)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {metodoLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatFechaCorta(pago.fechaPago)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                )}

                {/* Resumen */}
                 <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total turno</span>
                    <span className="font-medium">{formatCurrency(costoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagado</span>
                    <span className="font-medium text-green-600">{formatCurrency(montoPagado)}</span>
                  </div>
                  {deuda > 0 && (
                    <div className="flex justify-between text-sm pt-1 border-t mt-2">
                      <span className="font-medium text-orange-600">Resta</span>
                      <span className="font-medium text-orange-600">{formatCurrency(deuda)}</span>
                    </div>
                  )}
                  {deuda <= 0 && (
                    <div className="flex justify-center pt-2">
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        Pagado completo
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notas */}
          {turno.notas && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
                <p className="text-sm leading-relaxed">{turno.notas}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Historial de estados */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Historial</h4>
            {historial.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin historial</p>
            ) : (
              <div className="space-y-2">
                {historial.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {h.estadoAnterior ? (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {estadoConfig[h.estadoAnterior]?.label || h.estadoAnterior}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      ) : null}
                      <Badge
                        variant="outline"
                        className={`text-xs ${estadoConfig[h.estadoNuevo]?.className || ""}`}
                      >
                        {estadoConfig[h.estadoNuevo]?.label || h.estadoNuevo}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatFechaCorta(h.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Acciones */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Acciones</h4>
              <div className="grid grid-cols-2 gap-2">
              {canConfirmar && (
                <Button onClick={onConfirmar} variant="outline" className="justify-start">
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar
                </Button>
              )}
              {canMarcarCompletado && (
                <Button onClick={onMarcarCompletado} variant="outline" className="justify-start">
                  <Check className="mr-2 h-4 w-4" />
                  Completar
                </Button>
              )}
              {canMarcarAusente && (
                <Button onClick={onMarcarAusente} variant="outline" className="justify-start">
                  <UserX className="mr-2 h-4 w-4" />
                  Ausente
                </Button>
              )}
              {canRegistrarPago && (
                <Button onClick={onRegistrarPago} variant="outline" className="justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registrar pago
                </Button>
              )}
              {canCancelar && (
                <Button
                  onClick={onCancelar}
                  variant="outline"
                  className="justify-start text-destructive hover:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
            <Separator />
              <Button
                onClick={onDelete}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar turno
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
