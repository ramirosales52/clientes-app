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
import type { Turno } from "@render/hooks/use-turnos";
import dayjs from "dayjs";

interface Props {
  turno: Turno | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteTurnoDialog({ turno, open, onOpenChange, onConfirm }: Props) {
  if (!turno) return null;

  const fecha = dayjs(turno.fechaInicio).format("DD/MM/YYYY HH:mm");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar turno</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara el turno de{" "}
            <span className="font-medium">
              {turno.cliente.nombre} {turno.cliente.apellido}
            </span>{" "}
            del {fecha}. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
