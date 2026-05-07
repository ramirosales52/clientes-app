import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@render/components/ui/button";
import { Calendar } from "@render/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@render/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@render/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@render/components/ui/popover";
import { Separator } from "@render/components/ui/separator";
import { Badge } from "@render/components/ui/badge";
import { cn } from "@render/lib/utils";
import { dataEvents, EVENTS } from "@render/lib/events";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  ClipboardList,
  Phone,
  User,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { es } from "react-day-picker/locale";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { TratamientosSelector } from "./components/tratamientos-selector";

dayjs.locale("es");

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  codArea: string;
  numero: string;
  notas?: string;
  creadoEn: string;
}

interface Tratamiento {
  id: string;
  nombre: string;
  duracion: number;
  costo: number;
}

interface Slot {
  inicio: string;
  fin: string;
  disponible: boolean;
}

interface FranjaHoraria {
  inicio: string;
  fin: string;
}

interface HorariosDia {
  abierto: boolean;
  franjas: FranjaHoraria[];
  origen: "dia_especial" | "temporada" | "horario_semanal" | "cerrado";
  nombre?: string;
}

const turnoSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente"),
  tratamientos: z.array(z.string()).min(1, "Selecciona al menos un tratamiento"),
  fecha: z.date({ required_error: "Selecciona una fecha" }),
  slotInicio: z.string().min(1, "Selecciona un horario"),
});

type TurnoFormData = z.infer<typeof turnoSchema>;

function generarSlots(
  duracionMinutos: number,
  horasOcupadas: string[],
  horariosDia: HorariosDia | null
): Slot[] {
  if (!horariosDia || !horariosDia.abierto || horariosDia.franjas.length === 0) {
    return [];
  }

  const slots: Slot[] = [];
  const bloques = duracionMinutos / 30;

  // Convertir franjas a formato de horario de trabajo
  const horariosConvertidos = horariosDia.franjas.map((franja) => {
    const [inicioHora, inicioMin] = franja.inicio.split(":").map(Number);
    const [finHora, finMin] = franja.fin.split(":").map(Number);
    return {
      inicio: inicioHora + inicioMin / 60,
      fin: finHora + finMin / 60,
      inicioMinutos: inicioHora * 60 + inicioMin,
      finMinutos: finHora * 60 + finMin,
    };
  });

  for (const horario of horariosConvertidos) {
    for (let minutoActual = horario.inicioMinutos; minutoActual < horario.finMinutos; minutoActual += 30) {
      const hora = Math.floor(minutoActual / 60);
      const minuto = minutoActual % 60;
      const inicio = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
      const finMinutos = minutoActual + duracionMinutos;
      const finHora = Math.floor(finMinutos / 60);
      const finMinuto = finMinutos % 60;
      const fin = `${String(finHora).padStart(2, "0")}:${String(finMinuto).padStart(2, "0")}`;

      // Verificar que el slot cabe dentro de alguna franja
      const cabeEnHorario = horariosConvertidos.some((h) => {
        return minutoActual >= h.inicioMinutos && finMinutos <= h.finMinutos;
      });

      if (!cabeEnHorario) continue;

      let disponible = true;
      for (let i = 0; i < bloques; i++) {
        const checkMinutos = minutoActual + i * 30;
        const checkHora = Math.floor(checkMinutos / 60);
        const checkMinuto = checkMinutos % 60;
        const checkStr = `${String(checkHora).padStart(2, "0")}:${String(checkMinuto).padStart(2, "0")}`;
        if (horasOcupadas.includes(checkStr)) {
          disponible = false;
          break;
        }
      }

      slots.push({ inicio, fin, disponible });
    }
  }

  return slots;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (mins === 0) return `${horas}h`;
  return `${horas}h ${mins}min`;
}

function formatPhone(codArea: string, numero: string): string {
  return `(${codArea}) ${numero}`;
}

function NuevoTurno() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientePrefijado = searchParams.get("clienteId") || "";
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [openClientes, setOpenClientes] = useState(false);
  const [openTratamientos, setOpenTratamientos] = useState(false);
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [horariosDia, setHorariosDia] = useState<HorariosDia | null>(null);
  const [fechasCerradas, setFechasCerradas] = useState<Date[]>([]);
  const [mesVisible, setMesVisible] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      clienteId: clientePrefijado,
      tratamientos: [],
      fecha: undefined,
      slotInicio: "",
    },
  });

  const fecha = form.watch("fecha");
  const tratamientosSeleccionados = form.watch("tratamientos");
  const slotInicio = form.watch("slotInicio");
  const clienteId = form.watch("clienteId");

  const duracionTotal = tratamientos
    .filter((t) => tratamientosSeleccionados.includes(t.id))
    .reduce((sum, t) => sum + t.duracion, 0);

  const costoTotal = tratamientos
    .filter((t) => tratamientosSeleccionados.includes(t.id))
    .reduce((sum, t) => sum + t.costo, 0);

  const slots = duracionTotal > 0 ? generarSlots(duracionTotal, horasOcupadas, horariosDia) : [];

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);
  const tratamientosDetalle = tratamientos.filter((t) =>
    tratamientosSeleccionados.includes(t.id)
  );
  const slotSeleccionado = slots.find((s) => s.inicio === slotInicio);

  const fetchClientes = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:3000/clientes");
      setClientes(response.data.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  }, []);

  const fetchTratamientos = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:3000/tratamientos");
      setTratamientos(response.data);
    } catch (error) {
      console.error("Error fetching tratamientos:", error);
    }
  }, []);

  const fetchHorasOcupadas = useCallback(async (fechaSeleccionada: Date) => {
    try {
      const res = await axios.get("http://localhost:3000/turnos/ocupados", {
        params: { fecha: dayjs(fechaSeleccionada).format("MM-DD-YYYY") },
      });

      const ocupadas: string[] = [];
      const rangos = res.data.ocupadas || [];

      for (const [inicio, fin] of rangos) {
        const [hi, mi] = inicio.split(":").map(Number);
        const [hf, mf] = fin.split(":").map(Number);
        const startMin = hi * 60 + mi;
        const endMin = hf * 60 + mf;

        for (let min = startMin; min < endMin; min += 30) {
          const h = Math.floor(min / 60);
          const m = min % 60;
          ocupadas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
      }

      setHorasOcupadas(ocupadas);
    } catch (error) {
      console.error("Error al obtener horas ocupadas:", error);
    }
  }, []);

  const fetchHorariosDia = useCallback(async (fechaSeleccionada: Date) => {
    try {
      const res = await axios.get("http://localhost:3000/configuracion/horarios-para-fecha", {
        params: { fecha: dayjs(fechaSeleccionada).format("YYYY-MM-DD") },
      });
      // El backend devuelve "cerrado", convertimos a "abierto" para el frontend
      const data = res.data;
      setHorariosDia({
        abierto: !data.cerrado,
        franjas: (data.franjas || []).map((f: { horaInicio: string; horaFin: string }) => ({
          inicio: f.horaInicio,
          fin: f.horaFin,
        })),
        origen: data.tipo === "especial" ? "dia_especial" : data.tipo === "temporada" ? "temporada" : "horario_semanal",
        nombre: data.motivo || data.temporadaNombre,
      });
    } catch (error) {
      console.error("Error al obtener horarios del día:", error);
      // Fallback a horario por defecto si falla
      setHorariosDia({
        abierto: true,
        franjas: [
          { inicio: "08:00", fin: "12:00" },
          { inicio: "15:00", fin: "20:00" },
        ],
        origen: "horario_semanal",
      });
    }
  }, []);

  const fetchFechasCerradas = useCallback(async (mesBase: Date) => {
    try {
      // Cargar fechas cerradas: 1 mes antes y 2 meses después del mes visible
      const desde = dayjs(mesBase).subtract(1, "month").startOf("month").format("YYYY-MM-DD");
      const hasta = dayjs(mesBase).add(2, "month").endOf("month").format("YYYY-MM-DD");
      const res = await axios.get("http://localhost:3000/configuracion/fechas-cerradas", {
        params: { desde, hasta },
      });
      // Convertir strings a Date objects
      const fechas = (res.data || []).map((f: string) => {
        const [year, month, day] = f.split("-").map(Number);
        return new Date(year, month - 1, day);
      });
      setFechasCerradas(fechas);
    } catch (error) {
      console.error("Error al obtener fechas cerradas:", error);
    }
  }, []);

  const handleMonthChange = useCallback((month: Date) => {
    setMesVisible(month);
    fetchFechasCerradas(month);
  }, [fetchFechasCerradas]);

  // Carga inicial
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    fetchClientes();
    fetchTratamientos();
    fetchFechasCerradas(new Date());

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clientePrefijado) {
      form.setValue("clienteId", clientePrefijado);
    }
  }, [clientePrefijado, form]);

  // Listen for data refresh events
  useEffect(() => {
    const unsubCliente = dataEvents.on(EVENTS.CLIENTE_CREATED, fetchClientes);
    const unsubTratamiento = dataEvents.on(EVENTS.TRATAMIENTO_CREATED, fetchTratamientos);

    return () => {
      unsubCliente();
      unsubTratamiento();
    };
  }, [fetchClientes, fetchTratamientos]);

  useEffect(() => {
    if (fecha) {
      fetchHorasOcupadas(fecha);
      fetchHorariosDia(fecha);
      form.setValue("slotInicio", "");
    }
  }, [fecha, fetchHorasOcupadas, fetchHorariosDia, form]);

  useEffect(() => {
    form.setValue("slotInicio", "");
  }, [tratamientosSeleccionados, form]);

  const onSubmit = async (data: TurnoFormData) => {
    const slot = slots.find((s) => s.inicio === data.slotInicio);
    if (!slot) return;

    const fechaInicio = dayjs(data.fecha)
      .hour(parseInt(slot.inicio.split(":")[0]))
      .minute(parseInt(slot.inicio.split(":")[1]))
      .second(0)
      .toISOString();

    const fechaFin = dayjs(data.fecha)
      .hour(parseInt(slot.fin.split(":")[0]))
      .minute(parseInt(slot.fin.split(":")[1]))
      .second(0)
      .toISOString();

    const payload = {
      clienteId: data.clienteId,
      tratamientosIds: data.tratamientos,
      fechaInicio,
      fechaFin,
    };

    try {
      setSubmitting(true);
      await axios.post("http://localhost:3000/turnos", payload);
      toast.success("Turno agendado correctamente");

      form.reset({
        clienteId: "",
        tratamientos: [],
        fecha: undefined,
        slotInicio: "",
      });
      setHorasOcupadas([]);
      setHorariosDia(null);
    } catch (err: any) {
      console.error("Error al crear turno:", err);
      const message = err.response?.data?.message || "Error al agendar turno";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    clienteId &&
    tratamientosSeleccionados.length > 0 &&
    fecha &&
    slotInicio &&
    slotSeleccionado?.disponible;

  const toggleTratamiento = (id: string) => {
    const current = form.getValues("tratamientos");
    const updated = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    form.setValue("tratamientos", updated);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden overscroll-none p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/turno")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Agendar turno</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none">
          <div className="grid flex-1 min-h-0 w-full grid-cols-[20rem_minmax(0,1fr)_20rem] grid-rows-[minmax(0,1fr)] gap-6 overflow-hidden">
            {/* Columna izquierda - Cliente, Tratamientos, Calendario */}
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden pr-1">
              {/* Cliente */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <Popover open={openClientes} onOpenChange={setOpenClientes}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground",
                                  fieldState.invalid && "border-destructive"
                                )}
                              >
                                {clienteSeleccionado
                                  ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
                                  : "Seleccionar cliente"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-80">
                              <Command>
                                <CommandInput placeholder="Buscar cliente..." />
                                <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {clientes.map((cliente) => (
                                    <CommandItem
                                      key={cliente.id}
                                      onSelect={() => {
                                        field.onChange(cliente.id);
                                        setOpenClientes(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                                          {cliente.nombre[0]}{cliente.apellido[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">
                                            {cliente.nombre} {cliente.apellido}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatPhone(cliente.codArea, cliente.numero)}
                                          </p>
                                        </div>
                                        {field.value === cliente.id && (
                                          <Check className="h-4 w-4 text-primary" />
                                        )}
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
                </CardContent>
              </Card>

              {/* Tratamientos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Tratamientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                    onClick={() => setOpenTratamientos(true)}
                  >
                    <span className={cn(
                      tratamientosSeleccionados.length === 0 && "text-muted-foreground"
                    )}>
                      {tratamientosSeleccionados.length > 0
                        ? `${tratamientosSeleccionados.length} ${tratamientosSeleccionados.length === 1 ? "tratamiento" : "tratamientos"}`
                        : "Seleccionar tratamientos"}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                  {tratamientosDetalle.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {tratamientosDetalle.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{t.nombre}</span>
                          <span>{t.duracion} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calendario */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Calendar
                            locale={es}
                            mode="single"
                            month={mesVisible}
                            onMonthChange={handleMonthChange}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              // Deshabilitar días pasados
                              if (dayjs(date).isBefore(dayjs().startOf("day"))) {
                                return true;
                              }
                              // Deshabilitar días cerrados
                              return fechasCerradas.some(
                                (fc) =>
                                  fc.getFullYear() === date.getFullYear() &&
                                  fc.getMonth() === date.getMonth() &&
                                  fc.getDate() === date.getDate()
                              );
                            }}
                            className="rounded-md border w-72 h-auto"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Columna central - Horarios */}
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <Card className="flex flex-1 min-h-0 flex-col overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horarios disponibles
                    </CardTitle>
                    {duracionTotal > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatDuracion(duracionTotal)}
                      </Badge>
                    )}
                  </div>
                  {fecha && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {dayjs(fecha).format("dddd D [de] MMMM")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-auto w-full pr-2">
                  {!fecha ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                      <CalendarDays className="h-8 w-8 opacity-30" />
                      <p>Selecciona una fecha</p>
                    </div>
                  ) : horariosDia && !horariosDia.abierto ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                      <XCircle className="h-8 w-8 opacity-30" />
                      <p>Día cerrado</p>
                      {horariosDia.nombre && (
                        <p className="text-xs">{horariosDia.nombre}</p>
                      )}
                    </div>
                  ) : duracionTotal === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                      <Sparkles className="h-8 w-8 opacity-30" />
                      <p>Selecciona tratamientos</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
                      <Clock className="h-8 w-8 opacity-30" />
                      <p>No hay horarios disponibles</p>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="slotInicio"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <div className="space-y-4">
                              {/* Mañana */}
                              {slots.some((s) => parseInt(s.inicio.split(":")[0]) < 12) && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Mañana
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {slots
                                      .filter((s) => parseInt(s.inicio.split(":")[0]) < 12)
                                      .map((slot) => (
                                        <button
                                          key={slot.inicio}
                                          type="button"
                                          disabled={!slot.disponible}
                                          onClick={() => field.onChange(slot.inicio)}
                                          className={cn(
                                            "w-full rounded-md border p-3 text-center font-medium transition-colors",
                                            slot.disponible
                                              ? field.value === slot.inicio
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background hover:bg-muted"
                                              : "cursor-not-allowed border-border bg-muted/50 text-muted-foreground line-through opacity-50"
                                          )}
                                        >
                                          {slot.inicio} - {slot.fin}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Tarde */}
                              {slots.some((s) => parseInt(s.inicio.split(":")[0]) >= 12) && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Tarde
                                  </p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {slots
                                      .filter((s) => parseInt(s.inicio.split(":")[0]) >= 12)
                                      .map((slot) => (
                                        <button
                                          key={slot.inicio}
                                          type="button"
                                          disabled={!slot.disponible}
                                          onClick={() => field.onChange(slot.inicio)}
                                          className={cn(
                                            "w-full rounded-md border p-3 text-center font-medium transition-colors",
                                            slot.disponible
                                              ? field.value === slot.inicio
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background hover:bg-muted"
                                              : "cursor-not-allowed border-border bg-muted/50 text-muted-foreground line-through opacity-50"
                                          )}
                                        >
                                          {slot.inicio} - {slot.fin}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna derecha - Resumen */}
            <div className="flex h-full min-h-0 flex-col overflow-hidden pr-1">
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Resumen del turno
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden space-y-4">

                  {/* Cliente */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                    {clienteSeleccionado ? (
                      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                          {clienteSeleccionado.nombre[0]}{clienteSeleccionado.apellido[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {formatPhone(clienteSeleccionado.codArea, clienteSeleccionado.numero)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>

                  <Separator />

                  {/* Fecha, hora y duracion */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fecha y hora</p>
                    {fecha && slotSeleccionado ? (
                      <div>
                        <p className="font-medium">
                          {dayjs(fecha).format("dddd D [de] MMMM")}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{slotSeleccionado.inicio} - {slotSeleccionado.fin}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatDuracion(duracionTotal)}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>

                  <Separator />

                  {/* Tratamientos */}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Tratamientos</p>
                    {tratamientosDetalle.length > 0 ? (
                      <div className="bg-muted/50 rounded-md p-3 space-y-2">
                        {tratamientosDetalle.map((t) => (
                          <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium text-sm">{t.nombre}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {t.duracion} min
                              </div>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(t.costo)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between py-2 bg-muted/50 rounded-md px-3 -mx-1">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-semibold">
                      {costoTotal > 0 ? formatCurrency(costoTotal) : "-"}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? "Agendando..." : "Agendar turno"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      <TratamientosSelector
        open={openTratamientos}
        onOpenChange={setOpenTratamientos}
        tratamientos={tratamientos}
        seleccionados={tratamientosSeleccionados}
        onToggle={toggleTratamiento}
      />
    </div>
  );
}

export default NuevoTurno;
