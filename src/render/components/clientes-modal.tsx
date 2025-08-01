import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@render/components/ui/dialog"
import { Button } from "@render/components/ui/button"
import { Separator } from "@render/components/ui/separator"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@render/components/ui/form"
import { Input } from "@render/components/ui/input"

import { parsePhoneNumberFromString } from "libphonenumber-js"
import { cn } from "@render/lib/utils"

const clientSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  codArea: z.string().regex(/^\d{2,5}$/, "Código de área inválido"),
  numero: z.string().regex(/^\d{6,8}$/, "Número inválido"),
}).refine((data) => {
  const numeroCompleto = `549${data.codArea}${data.numero}`
  const parsed = parsePhoneNumberFromString(numeroCompleto, "AR")
  return parsed?.isValid() ?? false
}, {
  path: ["telefono"],
  message: "Teléfono inválido para Argentina",
})

type ClientFormValues = z.infer<typeof clientSchema>

export function ClientesModal({ className }: { className?: string }) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      codArea: "",
      numero: "",
    },
  })

  const onSubmit = async (data: ClientFormValues) => {
    try {
      await axios.post("http://localhost:3000/clientes", {
        nombre: data.nombre,
        apellido: data.apellido,
        codArea: data.codArea,
        numero: data.numero
      })
      toast("Cliente creado correctamente")
      form.reset()
    } catch (err) {
      console.error("Error creando el cliente:", err)
      toast.error("Error al crear cliente")
    }
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          form.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className={className}>
          <UserPlus />
          <span className="ml-2">Agregar cliente</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <UserPlus size={22} />
                Agregar cliente
              </DialogTitle>
              <DialogDescription>
                Completá los siguientes campos para registrar un nuevo cliente.
              </DialogDescription>
              <Separator />
            </DialogHeader>

            <div className="grid gap-4">
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
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="secondary" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

