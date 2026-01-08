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
import type { Tratamiento } from "@render/hooks/use-tratamientos";
import { useState } from "react";

interface Props {
  tratamiento: Tratamiento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tratamiento: Tratamiento) => Promise<void>;
}

export default function DeleteTratamientoDialog({
  tratamiento,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!tratamiento) return;

    try {
      setIsDeleting(true);
      await onConfirm(tratamiento);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar tratamiento</AlertDialogTitle>
          <AlertDialogDescription>
            {tratamiento ? (
              <>
                Estas por eliminar el tratamiento{" "}
                <strong>"{tratamiento.nombre}"</strong>. Esta accion no se puede
                deshacer.
              </>
            ) : (
              "Esta accion no se puede deshacer."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
