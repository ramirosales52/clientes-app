import { ClipboardPen, Clock, DollarSign, Pencil, SquarePen } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@render/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@render/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@render/lib/utils";
import { Button } from "@render/components/ui/button";
import { Separator } from "@render/components/ui/separator";
import { Input } from "@render/components/ui/input";
import { useEffect, useState } from "react";
import type { Tratamiento } from "@render/hooks/use-tratamientos";

type Props = {
  className?: string;
  tratamiento?: Tratamiento | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: TratamientoFormData) => Promise<void>;
};

const tratamientoSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  costo: z.coerce
    .number({ invalid_type_error: "Requerido" })
    .nonnegative("Debe ser mayor a 0"),
  duracion: z.coerce
    .number({ invalid_type_error: "Requerido" })
    .int("Debe ser un numero entero")
    .positive("Debe ser mayor a 0")
    .refine((n) => n % 5 === 0, {
      message: "Debe ser multiplo de 5",
    }),
});

export type TratamientoFormData = z.infer<typeof tratamientoSchema>;

function TratamientosModal({
  className,
  tratamiento,
  open,
  onOpenChange,
  onSubmit,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!tratamiento;

  const form = useForm<TratamientoFormData>({
    resolver: zodResolver(tratamientoSchema),
    defaultValues: {
      nombre: "",
      costo: undefined,
      duracion: undefined,
    },
  });

  useEffect(() => {
    if (tratamiento) {
      form.reset({
        nombre: tratamiento.nombre,
        costo: tratamiento.costo,
        duracion: tratamiento.duracion,
      });
    } else {
      form.reset({
        nombre: "",
        costo: undefined,
        duracion: undefined,
      });
    }
  }, [tratamiento, form]);

  const handleSubmit = async (data: TratamientoFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onOpenChange?.(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange?.(isOpen);
  };

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex gap-2 items-center">
          {isEditing ? (
            <>
              <Pencil size={22} />
              <span>Editar tratamiento</span>
            </>
          ) : (
            <>
              <ClipboardPen size={22} />
              <span>Agregar tratamiento</span>
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Modifica los datos del tratamiento."
            : "Ingresa los datos del nuevo tratamiento."}
        </DialogDescription>
      </DialogHeader>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  <SquarePen size={16} />
                  <span>Nombre</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Limpieza facial"
                    {...field}
                    className={cn(
                      fieldState.invalid &&
                        "border-destructive ring-destructive focus-visible:ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costo"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  <DollarSign size={16} />
                  <span>Costo</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="$"
                    type="number"
                    {...field}
                    className={cn(
                      fieldState.invalid &&
                        "border-destructive ring-destructive focus-visible:ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duracion"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  <Clock size={16} />
                  <span>Duracion (min)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="min"
                    type="number"
                    {...field}
                    className={cn(
                      fieldState.invalid &&
                        "border-destructive ring-destructive focus-visible:ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear tratamiento"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger className={className} asChild>
        <Button className={className}>
          <ClipboardPen />
          <span>Agregar tratamiento</span>
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}

export default TratamientosModal;
