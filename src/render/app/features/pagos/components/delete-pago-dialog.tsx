import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@render/components/ui/alert-dialog";
import type { Pago } from "@render/hooks/use-pagos";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pago: Pago | null;
  onConfirm: () => Promise<void>;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function DeletePagoDialog({
  open,
  onOpenChange,
  pago,
  onConfirm,
}: Props) {
  if (!pago) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar pago</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar el pago de {formatCurrency(Number(pago.monto))} de{" "}
            {pago.cliente
              ? `${pago.cliente.nombre} ${pago.cliente.apellido}`
              : "este cliente"}
            . Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
