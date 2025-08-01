import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Calendar1,
  CalendarClock,
  ChevronDownIcon,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  Clock3,
  Clock9,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Toaster } from "./ui/sonner";
import { es } from "react-day-picker/locale";
import { useEffect, useState } from "react";
import axios from "axios";
import { cn } from "@render/lib/utils";
import { Separator } from "./ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command";
import dayjs from "dayjs";

type Props = {
  className?: string;
};

interface Cliente {
  id: string,
  nombre: string,
  apellido: string
}

interface Tratamiento {
  id: string;
  nombre: string;
  duracion: number
}

const turnoSchema = z.object({
  clienteId: z.string().min(1, "Requerido"),
  tratamientos: z.array(z.string()).min(1, "Seleccioná al menos un tratamiento"),
  fecha: z.date({ required_error: "Seleccioná una fecha" }),
  horaInicio: z.string().min(1, "Requerido"),
  horaFin: z.string().min(1, "Requerido"),
});

function TurnosModal({ className }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openTratamientos, setOpenTratamientos] = useState(false);

  const form = useForm<z.infer<typeof turnoSchema>>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      clienteId: "",
      tratamientos: [],
      fecha: undefined,
      horaInicio: "",
      horaFin: "",
    },
  });

  const generarHorasBloques = (bloques: [number, number][], pasoMinutos = 30) => {
    const horas: string[] = [];
    for (const [inicio, fin] of bloques) {
      for (let h = inicio; h < fin; h++) {
        for (let m = 0; m < 60; m += pasoMinutos) {
          horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }
    }
    return horas;
  };

  const horasDisponibles = generarHorasBloques([
    [8, 12],
    [15, 19],
  ]);

  const fetchClientes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/clientes");
      setClientes(response.data.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const fetchTratamientos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/tratamientos");
      setTratamientos(response.data);
    } catch (error) {
      console.log("Error fetching tratamientos:", error);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchTratamientos();
  }, []);

  const fecha = form.watch("fecha");
  const horaInicio = form.watch("horaInicio");

  useEffect(() => {
    const tratamientosSeleccionados = tratamientos.filter((t) =>
      form.watch("tratamientos")?.includes(t.id)
    );

    const totalDuracion = tratamientosSeleccionados.reduce(
      (acc, t) => acc + t.duracion,
      0
    );


    if (fecha && horaInicio && totalDuracion) {
      const [hora, minuto] = horaInicio.split(":").map(Number);
      const inicio = new Date(fecha);
      inicio.setHours(hora, minuto, 0, 0);

      const fin = new Date(inicio.getTime() + totalDuracion * 60000);

      // Redondeamos a bloques de 30 minutos
      const minutos = fin.getMinutes();
      const redondeado = new Date(fin);
      redondeado.setMinutes(minutos < 15 ? 0 : minutos < 45 ? 30 : 60);
      if (redondeado.getMinutes() === 60) {
        redondeado.setMinutes(0);
        redondeado.setHours(redondeado.getHours() + 1);
      }

      const horaFinStr = redondeado.toTimeString().slice(0, 5); // ej: "14:30"

      // Solo setear si esa hora existe en las opciones disponibles
      if (horasDisponibles.includes(horaFinStr)) {
        form.setValue("horaFin", horaFinStr);
      }
    }
  }, [
    form.watch("horaInicio"),
    form.watch("tratamientos"),
    form.watch("fecha"),
  ]);

  function horaStringAMinutos(hora: string): number {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  }

  function combinarFechaYHora(fecha: Date | string, hora: string): Date {
    const fechaBase = dayjs(fecha).startOf("day");
    const [horaStr, minutoStr] = hora.split(":");
    return fechaBase
      .hour(parseInt(horaStr))
      .minute(parseInt(minutoStr))
      .second(0)
      .toDate();
  }

  type TurnoFormData = z.infer<typeof turnoSchema>;

  const onSubmit = async (data: TurnoFormData) => {
    const { fecha, horaInicio, horaFin, tratamientos, ...resto } = data;

    const fechaInicio = combinarFechaYHora(fecha, horaInicio).toISOString();
    const fechaFin = combinarFechaYHora(fecha, horaFin).toISOString();

    const payload = {
      fechaInicio,
      fechaFin,
      tratamientosIds: tratamientos, // renombrado para el DTO
      ...resto, // clienteId, estado?, notas?
    };

    try {
      const res = await axios.post("http://localhost:3000/turnos", payload);
      console.log("✅ Turno creado:", res.data);
    } catch (err) {
      console.error("❌ Error al crear turno:", err);
    }
  };

  return (
    <>
      <Toaster position="bottom-center" />
      <Dialog
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            form.reset()
          }
        }}
      >
        <DialogTrigger className={className} asChild>
          <Button className={className} variant="secondary">
            <CalendarClock />
            <span>Agendar turno</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full min-w-xl">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              <CalendarClock size={22} />
              <span>Agendar turno</span>
            </DialogTitle>
            <DialogDescription>
              Completá los datos para agendar un turno.
            </DialogDescription>
            <Separator />
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field, fieldState }) => {
                  const selectedCliente = clientes.find((c) => c.id === field.value);

                  return (
                    <FormItem>
                      <FormLabel>
                        <User size={16} />
                        <span>Cliente</span>
                      </FormLabel>
                      <FormControl>
                        <Popover modal>
                          <PopoverTrigger asChild className="data-[state=open]:border-primary">
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-72 justify-between hover:bg-transparent hover:text-inherit font-normal",
                                !field.value && "text-muted-foreground",
                                fieldState.invalid && "border-destructive ring-destructive focus-visible:ring-destructive"
                              )}
                            >
                              {selectedCliente
                                ? `${selectedCliente.nombre} ${selectedCliente.apellido}`
                                : "Seleccionar cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-0">
                            <Command>
                              <CommandInput placeholder="Buscar cliente..." autoFocus />
                              <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                              <CommandGroup>
                                {clientes.map((cliente) => (
                                  <CommandItem
                                    key={cliente.id}
                                    onSelect={() => {
                                      field.onChange(cliente.id);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {cliente.nombre} {cliente.apellido}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="tratamientos"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      <ClipboardList size={16} />
                      <span>Tratamientos</span>
                    </FormLabel>
                    <FormControl>
                      <Popover modal open={openTratamientos} onOpenChange={setOpenTratamientos}>
                        <PopoverTrigger asChild className="data-[state=open]:border-primary">
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTratamientos}
                            className={cn(
                              "w-72 justify-between hover:bg-transparent hover:text-inherit font-normal",
                              !field.value.length && "text-muted-foreground",
                              fieldState.invalid && "border-destructive ring-destructive focus-visible:ring-destructive"
                            )}
                          >
                            {field.value.length > 0
                              ? tratamientos
                                .filter((t) => field.value.includes(t.id))
                                .map((t) => t.nombre)
                                .join(", ")
                              : "Seleccionar tratamientos"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0">
                          <Command className="z-20">
                            <CommandInput autoFocus placeholder="Buscar tratamiento..." />
                            <CommandEmpty>No se encontró ningún tratamiento.</CommandEmpty>
                            <CommandGroup>
                              {tratamientos.map((t) => (
                                <CommandItem
                                  key={t.id}
                                  onSelect={() => {
                                    const selected = field.value.includes(t.id)
                                      ? field.value.filter((id: string) => id !== t.id)
                                      : [...field.value, t.id];
                                    field.onChange(selected);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={field.value.includes(t.id)}
                                      readOnly
                                      className="cursor-pointer"
                                    />
                                    {t.nombre}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field, fieldState }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        <Calendar1 size={16} className="inline mr-1" />
                        Fecha
                      </FormLabel>
                      <FormControl>
                        <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                          <PopoverTrigger asChild className="data-[state=open]:border-primary">
                            <Button
                              variant="outline"
                              className={cn(
                                "border w-48 justify-between font-normal text-muted-foreground hover:bg-transparent hover:text-inherit",
                                fieldState.invalid && "border-destructive ring-destructive focus-visible:ring-destructive"
                              )}
                            >
                              {field.value
                                ? field.value.toLocaleDateString()
                                : "Seleccionar fecha"}
                              <ChevronDownIcon className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setOpenCalendar(false);
                              }}
                              locale={es}

                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Clock3 size={16} className="inline mr-1" />
                        Hora Inicio
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-36 cursor-pointer data-[state=open]:border-primary">
                            <SelectValue placeholder="Elegir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72">
                          {horasDisponibles.map((hora) => (
                            <SelectItem key={hora} value={hora} className="hover:bg-accent cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{hora} hs</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horaFin"
                  render={({ field }) => {
                    const horaInicioMin = horaInicio ? horaStringAMinutos(horaInicio) : 0;

                    return (
                      <FormItem>
                        <FormLabel>
                          <Clock9 size={16} className="inline mr-1" />
                          Hora Fin
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!horaInicio}>
                          <FormControl>
                            <SelectTrigger className="w-36 cursor-pointer data-[state=open]:border-primary">
                              <SelectValue placeholder="Elegir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-72">
                            {horasDisponibles.map((hora) => {
                              const horaMin = horaStringAMinutos(hora);
                              const isDisabled = horaMin <= horaInicioMin;

                              return (
                                <SelectItem
                                  key={hora}
                                  value={hora}
                                  disabled={isDisabled}
                                  className={cn(
                                    "hover:bg-accent cursor-pointer",
                                    isDisabled && "opacity-50 pointer-events-none"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{hora} hs</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Guardar cambios</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TurnosModal;

