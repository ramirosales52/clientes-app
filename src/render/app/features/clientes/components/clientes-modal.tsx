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
import { Button } from "@render/components/ui/button";
import { Separator } from "@render/components/ui/separator";
import { UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@render/components/ui/form";
import { Input } from "@render/components/ui/input";
import { Textarea } from "@render/components/ui/textarea";

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn } from "@render/lib/utils";
import { dataEvents, EVENTS } from "@render/lib/events";
import { useEffect, useState } from "react";
import type { Cliente, UpdateClienteData } from "@render/hooks/use-clientes";

const clientSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    apellido: z.string().min(1, "El apellido es obligatorio"),
    codArea: z.string().regex(/^\d{2,5}$/, "Código de área inválido"),
    numero: z.string().regex(/^\d{6,8}$/, "Número inválido"),
    notas: z.string().optional(),
  })
  .refine(
    (data) => {
      const numeroCompleto = `549${data.codArea}${data.numero}`;
      const parsed = parsePhoneNumberFromString(numeroCompleto, "AR");
      return parsed?.isValid() ?? false;
    },
    {
      path: ["telefono"],
      message: "Teléfono inválido para Argentina",
    }
  );

type ClientFormValues = z.infer<typeof clientSchema>;

interface Props {
  className?: string;
  // Controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cliente?: Cliente | null;
  onSubmit?: (data: UpdateClienteData) => Promise<void>;
}

export function ClientesModal({
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  cliente,
  onSubmit: externalOnSubmit,
}: Props) {
  const isControlled = controlledOpen !== undefined;
  const isEditMode = !!cliente;
  const [internalOpen, setInternalOpen] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      codArea: "",
      numero: "",
      notas: "",
    },
  });

  // Reset form when cliente changes (edit mode)
  useEffect(() => {
    if (cliente) {
      form.reset({
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        codArea: cliente.codArea,
        numero: cliente.numero,
        notas: cliente.notas || "",
      });
    } else {
      form.reset({
        nombre: "",
        apellido: "",
        codArea: "",
        numero: "",
        notas: "",
      });
    }
  }, [cliente, form]);

  const onSubmit = async (data: ClientFormValues) => {
    try {
      if (externalOnSubmit) {
        await externalOnSubmit(data);
      } else {
        await axios.post("http://localhost:3000/clientes", {
          nombre: data.nombre,
          apellido: data.apellido,
          codArea: data.codArea,
          numero: data.numero,
          notas: data.notas,
        });
        toast.success("Cliente creado correctamente");
        form.reset();
        setInternalOpen(false);
        dataEvents.emit(EVENTS.CLIENTE_CREATED);
      }
    } catch (err) {
      console.error("Error guardando el cliente:", err);
      toast.error(isEditMode ? "Error al actualizar cliente" : "Error al crear cliente");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    controlledOnOpenChange?.(isOpen);
  };

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Pencil size={22} />
              Editar cliente
            </>
          ) : (
            <>
              <UserPlus size={22} />
              Agregar cliente
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Modificá los datos del cliente."
            : "Completá los siguientes campos para registrar un nuevo cliente."}
        </DialogDescription>
        <Separator />
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del cliente"
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
              name="apellido"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Apellido del cliente"
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

            <div className="grid gap-2">
              <FormLabel>Teléfono</FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="codArea"
                  render={({ field, fieldState }) => (
                    <FormItem className="w-1/3">
                      <FormControl>
                        <Input
                          placeholder="Código área (sin 0)"
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
                  name="numero"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Número (sin 15)"
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
              </div>
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el cliente..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="secondary" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">
              {isEditMode ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  // Controlled mode (for edit)
  if (isControlled) {
    return (
      <Dialog open={controlledOpen} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // Uncontrolled mode (for create with trigger button)
  return (
    <Dialog
      open={internalOpen}
      onOpenChange={(isOpen) => {
        setInternalOpen(isOpen);
        if (!isOpen) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className={className}>
          <UserPlus />
          <span className="ml-2">Agregar cliente</span>
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
