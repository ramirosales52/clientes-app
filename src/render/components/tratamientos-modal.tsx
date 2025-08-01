import { ClipboardPen, Clock, DollarSign, SquarePen } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "./ui/form"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { toast } from "sonner"
import { Separator } from "./ui/separator"
import { cn } from "@render/lib/utils"

type Props = {
  className?: string;
}

const tratamientoSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  costo: z.coerce.number({ invalid_type_error: "Requerido" }).nonnegative("Debe ser mayor a 0"),
  duracion: z.coerce
    .number({ invalid_type_error: "Requerido" })
    .int("Debe ser un número entero")
    .positive("Debe ser mayor a 0")
    .refine(n => n % 5 === 0, {
      message: "Debe ser múltiplo de 5",
    })
})

type TratamientoFormData = z.infer<typeof tratamientoSchema>

function TratamientosModal({ className }: Props) {
  const form = useForm<TratamientoFormData>({
    resolver: zodResolver(tratamientoSchema),
    defaultValues: {
      nombre: "",
      costo: undefined,
      duracion: undefined
    }
  })

  const onSubmit = async (data: TratamientoFormData) => {
    try {
      await axios.post("http://localhost:3000/tratamientos", data)
      toast.success("Tratamiento creado con éxito")
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error("Error al crear tratamiento")
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
      <DialogTrigger className={className} asChild>
        <Button variant="secondary">
          <ClipboardPen />
          <span>Agregar tratamiento</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <ClipboardPen size={22} />
            <span>Agregar tratamiento</span>
          </DialogTitle>
          <DialogDescription>
            Ingresá los datos del nuevo tratamiento.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                    <span>Duración (min)</span>
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
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default TratamientosModal

