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
  CalendarDays,
  CalendarPlus,
  ChevronDownIcon,
  ChevronsUpDown,
  ClipboardList,
  Clock,
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
import { toast } from "sonner";

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
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);

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

  const horaInicio = form.watch("horaInicio");
  const tratamientosSeleccionados = form.watch("tratamientos");
  const fecha = form.watch("fecha")

  const expandirRangosOcupados = (rangos: [string, string][]) => {
    const ocupadas: string[] = [];

    rangos.forEach(([inicio, fin]) => {
      const start = horaStringAMinutos(inicio);
      const end = horaStringAMinutos(fin);

      for (let min = start; min < end; min += 30) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        ocupadas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    });

    return ocupadas;
  };

  useEffect(() => {
    if (!fecha) return;

    const fetchHorasOcupadas = async () => {
      try {
        const res = await axios.get("http://localhost:3000/turnos/horarios", {
          params: { fecha: dayjs(fecha).format("MM-DD-YYYY") },
        });

        setHorasOcupadas(expandirRangosOcupados(res.data.ocupadas || []));
        console.log(fecha)
        console.log(horasOcupadas)
      } catch (error) {
        console.error("Error al obtener horas ocupadas:", error);
      }
    };

    fetchHorasOcupadas();
  }, [fecha]);

  const horasInicioDisponibles = horasDisponibles.filter(
    (hora) => hora <= "11:30" || hora <= "18:30" // Dentro del bloque permitido
  );

  const horasFinDisponibles = horasDisponibles.filter(
    (hora) => hora === "12:00" || hora === "19:00" || (hora > "08:00" && (hora >= "11:30" && hora <= "12:00")) || (hora >= "18:30" && hora <= "19:00")
  );

  useEffect(() => {
    if (!tratamientosSeleccionados?.length) {
      form.setValue("horaFin", "", { shouldDirty: true });
      return;
    }

    if (!horaInicio) return;

    const duracionTotal = tratamientos
      .filter((t) => tratamientosSeleccionados.includes(t.id))
      .reduce((total, t) => total + t.duracion, 0);

    if (!duracionTotal) return;

    const [hora, minuto] = horaInicio.split(":").map(Number);
    const inicio = new Date();
    inicio.setHours(hora, minuto, 0, 0);

    const fin = new Date(inicio.getTime() + duracionTotal * 60000);

    const horaFinStr = fin.toTimeString().slice(0, 5);

    if (horasDisponibles.includes(horaFinStr)) {
      form.setValue("horaFin", horaFinStr);
    } else {
      form.setValue("horaFin", "")
      toast.error("Fuera del horario de trabajo")
    }
    if (!tratamientosSeleccionados.length) {
      form.setValue("horaFin", "")
    }

    const finCruzaConOcupada = horasOcupadas.includes(horaFinStr);
    if (finCruzaConOcupada) {
      form.setValue("horaFin", "");
      toast.error("La hora de fin se superpone con un turno existente.");
      return;
    }

  }, [tratamientosSeleccionados, horaInicio]);

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
      tratamientosIds: tratamientos,
      ...resto,
    };

    try {
      const res = await axios.post("http://localhost:3000/turnos", payload);
      console.log("Turno creado:", res.data);
      form.reset({
        fecha: undefined
      })
      toast.success(`Turno creado el dia ${fecha.toLocaleDateString("es-AR")} a las ${horaInicio}`)
    } catch (err) {
      console.error("Error al crear turno:", err);
    }
  };

  const capitalizar = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <>
      <Dialog
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            form.reset({
              fecha: undefined
            })
          } else {
            fetchClientes()
            fetchTratamientos()
          }
        }}
      >
        <DialogTrigger className={className} asChild>
          <Button className={className}>
            <CalendarPlus />
            <span>Agendar turno</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-96">
          <Toaster position="bottom-center" />
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center">
              <CalendarPlus size={22} />
              <span>Agendar turno</span>
            </DialogTitle>
            <DialogDescription>
              Completá los datos para agendar un turno.
            </DialogDescription>
            <Separator />
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field, fieldState }) => {
                  const selectedCliente = clientes.find((c) => c.id === field.value);

                  return (
                    <FormItem>
                      <FormLabel>
                        <span>Cliente</span>
                      </FormLabel>
                      <FormControl>
                        <Popover modal>
                          <PopoverTrigger asChild className="min-w-full data-[state=open]:border-primary border-2">
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
                                : (
                                  <div className="flex items-center gap-2">
                                    <User size={10} />
                                    Seleccionar cliente
                                  </div>
                                )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command className="min-w-full">
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
                      <span>Tratamientos</span>
                    </FormLabel>
                    <FormControl>
                      <Popover modal open={openTratamientos} onOpenChange={setOpenTratamientos}>
                        <PopoverTrigger asChild className="min-w-full data-[state=open]:border-primary border-2">
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTratamientos}
                            className={cn(
                              "justify-between hover:bg-transparent hover:text-inherit font-normal",
                              !field.value.length && "text-muted-foreground",
                              fieldState.invalid && "border-destructive ring-destructive focus-visible:ring-destructive"
                            )}
                          >
                            <span className="truncate block max-w-[90%] overflow-hidden whitespace-nowrap text-left">
                              {field.value.length > 0
                                ? tratamientos
                                  .filter((t) => field.value.includes(t.id))
                                  .map((t) => t.nombre)
                                  .join(", ")
                                : (
                                  <div className="flex items-center gap-2">
                                    <ClipboardList size={10} />
                                    Seleccionar tratamientos
                                  </div>
                                )}
                            </span>
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
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
                                  <div className="w-full flex items-center justify-between">
                                    <div className="flex flex-row gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.value.includes(t.id)}
                                        readOnly
                                        className="cursor-pointer"
                                      />
                                      <span>{t.nombre}</span>
                                    </div>
                                    <span className="text-muted-foreground/80">{t.duracion} min</span>
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

              <FormField
                control={form.control}
                name="fecha"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Fecha
                    </FormLabel>
                    <FormControl>
                      <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                        <PopoverTrigger asChild className="min-w-full data-[state=open]:border-primary border-2">
                          <Button
                            variant="outline"
                            className={cn(
                              "w-48 justify-between font-normal text-muted-foreground hover:bg-transparent hover:text-inherit",
                              fieldState.invalid && "border-destructive ring-destructive focus-visible:ring-destructive"
                            )}
                          >
                            {field.value
                              ? capitalizar(field.value.toLocaleDateString("es-AR", { dateStyle: "full" }))
                              : (
                                <div className="flex items-center gap-2">
                                  <CalendarDays size={10} />
                                  DD/MM/AAAA
                                </div>
                              )}
                            <ChevronDownIcon className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                          <Calendar
                            locale={es}
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(date) => {
                              field.onChange(date);
                              setOpenCalendar(false);
                            }}
                            disabled={(date) => dayjs(date).isBefore(dayjs().startOf("day"))}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center">
                <FormField
                  control={form.control}
                  name="horaInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hora Inicio
                      </FormLabel>
                      <FormControl>
                        <Select disabled={!fecha} onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="w-36 cursor-pointer data-[state=open]:border-primary border-2">
                            <SelectValue placeholder="HH:MM" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {horasInicioDisponibles.map((hora) => (
                              <SelectItem
                                key={hora}
                                value={hora}
                                disabled={horasOcupadas.includes(hora)}
                                className={cn(
                                  "hover:bg-accent cursor-pointer",
                                  horasOcupadas.includes(hora) && "opacity-50 pointer-events-none"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{hora} hs</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator className="w-4 mt-6" />

                <FormField
                  control={form.control}
                  name="horaFin"
                  render={({ field }) => {
                    const horaInicioMin = horaInicio ? horaStringAMinutos(horaInicio) : 0;

                    return (
                      <FormItem>
                        <FormLabel>
                          Hora Fin
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!horaInicio}>
                            <SelectTrigger className="w-36 cursor-pointer data-[state=open]:border-primary border-2">
                              <SelectValue placeholder="HH:MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {horasFinDisponibles.map((hora) => {
                                const horaMin = horaStringAMinutos(hora);
                                const isDisabled =
                                  horaMin <= horaInicioMin || horasOcupadas.includes(hora);

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
                        </FormControl>
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

