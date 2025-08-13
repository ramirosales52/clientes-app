import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@render/components/ui/button";
import { Calendar } from "@render/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@render/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@render/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@render/components/ui/popover";
import { cn } from "@render/lib/utils";
import axios from "axios";
import { CalendarDays, CalendarPlus, ChevronDownIcon, ChevronsUpDown, ClipboardList, User } from "lucide-react"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { es } from "react-day-picker/locale";
import dayjs from "dayjs";

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
});

function AgendarTurno() {
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
    },
  });

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
    fetchClientes()
    fetchTratamientos()
  }, [])

  const onSubmit = () => { };

  const capitalizar = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className="flex flex-col w-full p-4 space-y-4">
      <div className="w-full">
        <h1 className="font-bold text-2xl">Agendar turno</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="">
          <div className="flex flex-row space-x-4 h-full justify-center ">
            <Card className="flex-1 bg-background max-w-96">
              <CardContent>
                <CardHeader className="pl-0">
                  <CardTitle className="flex gap-2 items-center">
                    <CalendarPlus size={18} />
                    <span>Agendar turno</span>
                  </CardTitle>
                  <CardDescription>
                    Seleccioná cliente, fecha y tratamientos.
                  </CardDescription>
                </CardHeader>

                <div className="space-y-6">
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
                            <Popover>
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
                          <Popover open={openTratamientos} onOpenChange={setOpenTratamientos}>
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

                </div>

              </CardContent>
            </Card>
            <Card className="flex-1 bg-background max-w-96">
              <CardContent className="">

              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default AgendarTurno
