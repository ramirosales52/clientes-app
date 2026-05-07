import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Clock3, DollarSign, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@render/components/ui/chart";
import { Progress } from "@render/components/ui/progress";
import { Skeleton } from "@render/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import { useClientes } from "@render/hooks/use-clientes";
import { useDashboard } from "@render/hooks/use-dashboard";
import { usePagos } from "@render/hooks/use-pagos";
import { useTratamientos } from "@render/hooks/use-tratamientos";
import { useTurnos } from "@render/hooks/use-turnos";
import dayjs from "dayjs";

type ChartPoint = { month: string; ingresos: number; turnos: number; completados: number; confirmados: number };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

function MetricCard({ title, value, description, icon: Icon }: { title: string; value: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg border bg-muted/30 p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
      <div className="flex flex-col gap-3 p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-[280px]" />
      <Skeleton className="h-[240px]" />
    </div>
  );
}

export default function Metricas() {
  const { stats, refresh, loading: loadingDashboard } = useDashboard();
  const { clientes, loading: loadingClientes } = useClientes();
  const { turnos, loading: loadingTurnos } = useTurnos();
  const { getPagos, getTurnosConDeuda, loading: loadingPagos } = usePagos();
  const { tratamientos, loading: loadingTratamientos } = useTratamientos();

  const [pagos, setPagos] = useState<Array<{ monto: number; metodoPago: string; fechaPago: string }>>([]);
  const [turnosConDeuda, setTurnosConDeuda] = useState<Array<{ deuda: number }>>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([getPagos(), getTurnosConDeuda()]).then(([pagosResult, deudaResult]) => {
      if (!alive) return;
      setPagos(pagosResult);
      setTurnosConDeuda(deudaResult);
    });
    return () => {
      alive = false;
    };
  }, [getPagos, getTurnosConDeuda]);

  const loading = loadingDashboard || loadingClientes || loadingTurnos || loadingPagos || loadingTratamientos;

  const turnosPorDia = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const dayRef = dayjs().subtract(13 - index, "day");
      const start = dayRef.startOf("day");
      const end = dayRef.endOf("day");
      const turnosDelDia = turnos.filter((turno) => dayjs(turno.fechaInicio).isAfter(start.subtract(1, "minute")) && dayjs(turno.fechaInicio).isBefore(end.add(1, "minute")));
      return { day: dayRef.format("D/M"), total: turnosDelDia.length, completados: turnosDelDia.filter((turno) => turno.estado === "completado").length, confirmados: turnosDelDia.filter((turno) => turno.estado === "confirmado").length };
    });
  }, [turnos]);

  const turnosPorEstado = useMemo(() => {
    const counts = turnos.reduce((acc, turno) => {
      acc[turno.estado] = (acc[turno.estado] || 0) + 1;
      return acc;
    }, { pendiente: 0, confirmado: 0, completado: 0, cancelado: 0, ausente: 0 } as Record<string, number>);
    return Object.entries(counts).map(([estado, value]) => ({ estado, value }));
  }, [turnos]);

  const pagosPorMetodo = useMemo(() => {
    const counts = pagos.reduce((acc, pago) => {
      acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + Number(pago.monto);
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([metodo, value]) => ({ metodo, value }));
  }, [pagos]);

  const pagosPorMetodoConteo = useMemo(() => {
    return Object.entries(
      pagos.reduce((acc, pago) => {
        acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([metodo, cantidad]) => ({ metodo, cantidad }));
  }, [pagos]);

  const pagosPorDia = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const dayRef = dayjs().subtract(13 - index, "day");
      const start = dayRef.startOf("day");
      const end = dayRef.endOf("day");
      const pagosDelDia = pagos.filter((pago) => dayjs(pago.fechaPago).isAfter(start.subtract(1, "minute")) && dayjs(pago.fechaPago).isBefore(end.add(1, "minute")));
      return { day: dayRef.format("D/M"), monto: pagosDelDia.reduce((total, pago) => total + Number(pago.monto), 0), cantidad: pagosDelDia.length };
    });
  }, [pagos]);

  const clientesPorMes = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const monthRef = dayjs().subtract(5 - index, "month");
      const start = monthRef.startOf("month");
      const end = monthRef.endOf("month");
      const nuevos = clientes.filter((cliente) => dayjs(cliente.creadoEn).isAfter(start.subtract(1, "day")) && dayjs(cliente.creadoEn).isBefore(end.add(1, "day"))).length;
      const activos = clientes.filter((cliente) => cliente.turnos.some((turno) => dayjs(turno.fechaInicio).isAfter(start.subtract(1, "day")) && dayjs(turno.fechaInicio).isBefore(end.add(1, "day")))).length;
      return { month: monthRef.format("MMM"), nuevos, activos };
    });
  }, [clientes]);

  const topClientes = useMemo(() => {
    return [...clientes].sort((a, b) => b.cantTurnos - a.cantTurnos).slice(0, 5).map((cliente) => ({ nombre: `${cliente.nombre} ${cliente.apellido}`, turnos: cliente.cantTurnos }));
  }, [clientes]);

  const topTratamientos = useMemo(() => {
    return tratamientos
      .map((tratamiento) => ({ nombre: tratamiento.nombre, veces: turnos.filter((turno) => turno.tratamientos.some((item) => item.id === tratamiento.id)).length, costo: tratamiento.costo, duracion: tratamiento.duracion }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, 5);
  }, [tratamientos, turnos]);

  const tratamientosPorCosto = useMemo(() => {
    return [...tratamientos].sort((a, b) => b.costo - a.costo).slice(0, 6).map((tratamiento) => ({ nombre: tratamiento.nombre, costo: tratamiento.costo, duracion: tratamiento.duracion }));
  }, [tratamientos]);

  const chartConfig = {
    total: { label: "Turnos", color: "var(--chart-1)" },
    completados: { label: "Completados", color: "var(--chart-2)" },
    confirmados: { label: "Confirmados", color: "var(--chart-3)" },
    monto: { label: "Monto", color: "var(--chart-1)" },
    cantidad: { label: "Cantidad", color: "var(--chart-2)" },
    nuevos: { label: "Nuevos", color: "var(--chart-1)" },
    activos: { label: "Activos", color: "var(--chart-2)" },
    veces: { label: "Usos", color: "var(--chart-1)" },
    costo: { label: "Costo", color: "var(--chart-2)" },
    duracion: { label: "Duracion", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const monthlyData = useMemo<ChartPoint[]>(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const monthRef = dayjs().subtract(5 - index, "month");
      const start = monthRef.startOf("month");
      const end = monthRef.endOf("month");
      const monthTurnos = turnos.filter((turno) => dayjs(turno.fechaInicio).isAfter(start) && dayjs(turno.fechaInicio).isBefore(end.add(1, "day")));
      const monthPagos = pagos.filter((pago) => dayjs(pago.fechaPago).isAfter(start) && dayjs(pago.fechaPago).isBefore(end.add(1, "day")));
      return {
        month: monthRef.format("MMM"),
        ingresos: monthPagos.reduce((total, pago) => total + Number(pago.monto), 0),
        turnos: monthTurnos.length,
        completados: monthTurnos.filter((turno) => turno.estado === "completado").length,
        confirmados: monthTurnos.filter((turno) => turno.estado === "confirmado").length,
      };
    });
  }, [turnos, pagos]);

  const deudaTotal = useMemo(() => turnosConDeuda.reduce((total, item) => total + item.deuda, 0), [turnosConDeuda]);
  const confirmacion = stats.turnosHoy > 0 ? Math.round((stats.confirmadosHoy / stats.turnosHoy) * 100) : 0;
  const pagosTotales = pagos.reduce((total, pago) => total + Number(pago.monto), 0);
  const pagosHoy = pagos.filter((pago) => dayjs(pago.fechaPago).isSame(dayjs(), "day"));
  const pagosUltimos7Dias = pagos.filter((pago) => dayjs(pago.fechaPago).isAfter(dayjs().subtract(7, "day")));
  const pagosUltimos30Dias = pagos.filter((pago) => dayjs(pago.fechaPago).isAfter(dayjs().subtract(30, "day")));
  const ingresosPromedioPago = pagos.length > 0 ? pagosTotales / pagos.length : 0;
  const mixDigital = pagos.length > 0 ? Math.round((pagos.filter((p) => p.metodoPago !== "efectivo").length / pagos.length) * 100) : 0;
  const proporcionDeuda = pagosTotales > 0 ? Math.round((deudaTotal / pagosTotales) * 100) : 0;
  const pagoMasAlto = pagos.reduce((max, pago) => Math.max(max, Number(pago.monto)), 0);
  const clientesConTurnos = clientes.filter((cliente) => cliente.cantTurnos > 0).length;
  const clientesNuevos30Dias = clientes.filter((cliente) => dayjs(cliente.creadoEn).isAfter(dayjs().subtract(30, "day"))).length;
  const clientesConProximoTurno = clientes.filter((cliente) => cliente.turnos.some((turno) => dayjs(turno.fechaInicio).isAfter(dayjs()) && turno.estado !== "cancelado")).length;
  const promedioTurnosPorCliente = clientes.length > 0 ? Math.round((turnos.length / clientes.length) * 10) / 10 : 0;
  const costoPromedioTratamiento = tratamientos.length > 0 ? Math.round(tratamientos.reduce((total, tratamiento) => total + tratamiento.costo, 0) / tratamientos.length) : 0;
  const duracionPromedioTratamiento = tratamientos.length > 0 ? Math.round(tratamientos.reduce((total, tratamiento) => total + tratamiento.duracion, 0) / tratamientos.length) : 0;
  const tratamientosConHistorial = tratamientos.filter((tratamiento) => tratamiento.historialPrecios.length > 0).length;

  if (loading) return <LoadingState />;

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-auto p-2 md:p-3">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Metricas</h1>
          <p className="text-sm text-muted-foreground">Menos indicadores, más gráficos y lectura visual.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button asChild>
            <Link to="/turno/nuevo">
              <CalendarDays className="mr-2 h-4 w-4" />
              Nuevo turno
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="turnos" className="flex flex-col gap-2">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="turnos">Turnos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="tratamientos">Tratamientos</TabsTrigger>
        </TabsList>

        <TabsContent value="turnos" className="mt-0 flex flex-col gap-2">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Turnos de hoy" value={String(stats.turnosHoy)} description="Agenda de la jornada actual." icon={Clock3} />
            <MetricCard title="Confirmacion" value={`${confirmacion}%`} description="Confirmados sobre los turnos de hoy." icon={CalendarDays} />
            <MetricCard title="Tasa de cierre" value={`${turnos.length > 0 ? Math.round((turnos.filter((t) => t.estado === "completado").length / turnos.length) * 100) : 0}%`} description="Peso de turnos completados." icon={ShieldCheck} />
            <MetricCard title="Pendientes" value={String(stats.pendientes)} description="Sin respuesta todavia." icon={Clock3} />
          </div>
          <div className="grid gap-2 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Actividad mensual</CardTitle>
                <CardDescription>Turnos, confirmados y completados en los ultimos 6 meses.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[240px] w-full">
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="turnos" fill="var(--color-total)" radius={6} />
                    <Bar dataKey="confirmados" fill="var(--color-confirmados)" radius={6} />
                    <Bar dataKey="completados" fill="var(--color-completados)" radius={6} />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de turnos</CardTitle>
                <CardDescription>Distribucion actual por estado.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ value: { label: "Turnos", color: "var(--chart-1)" } }} className="h-[240px] w-full">
                  <BarChart data={turnosPorEstado}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="estado" tickLine={false} axisLine={false} tickMargin={10} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={8}>
                      {turnosPorEstado.map((entry, index) => (
                        <Cell key={entry.estado} fill={`var(--chart-${(index % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actividad diaria</CardTitle>
              <CardDescription>Movimiento de los ultimos 14 dias.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <LineChart data={turnosPorDia}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="confirmados" stroke="var(--color-confirmados)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completados" stroke="var(--color-completados)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="mt-0 flex flex-col gap-2">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Monto total" value={formatCurrency(pagosTotales)} description="Total cobrado en pagos." icon={DollarSign} />
            <MetricCard title="Ticket medio" value={formatCurrency(ingresosPromedioPago)} description="Promedio por cobro." icon={DollarSign} />
            <MetricCard title="Cobro digital" value={`${mixDigital}%`} description="Transferencias y tarjetas." icon={ShieldCheck} />
            <MetricCard title="Deuda / ingresos" value={`${proporcionDeuda}%`} description="Peso de deuda sobre lo cobrado." icon={ShieldCheck} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Ingresos mensuales</CardTitle>
              <CardDescription>Comparativa de ingresos y actividad mensual.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="turnos" fill="var(--color-total)" radius={6} />
                  <Line type="monotone" dataKey="ingresos" stroke="var(--color-confirmados)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos diarios</CardTitle>
              <CardDescription>Evolucion de cobros en los ultimos 14 dias.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <ComposedChart data={pagosPorDia}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={6} />
                  <Line type="monotone" dataKey="monto" stroke="var(--color-monto)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-2 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mix de cobro</CardTitle>
                <CardDescription>Distribucion por monto y por cantidad.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie data={pagosPorMetodo} dataKey="value" nameKey="metodo" innerRadius={55} outerRadius={90} paddingAngle={4}>
                        {pagosPorMetodo.map((entry, index) => (
                          <Cell key={entry.metodo} fill={`var(--chart-${(index % 5) + 1})`} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pagosPorMetodoConteo} layout="vertical">
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} />
                      <YAxis dataKey="metodo" type="category" tickLine={false} axisLine={false} width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" radius={8} fill="var(--color-total)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lectura de caja</CardTitle>
                <CardDescription>Resumen de cobros y deuda.</CardDescription>
              </CardHeader>
                <CardContent className="space-y-3">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Pagos hoy</span><span>{pagosHoy.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Pagos 7 dias</span><span>{pagosUltimos7Dias.length}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Cobrado 30 dias</span><span>{formatCurrency(pagosUltimos30Dias.reduce((total, pago) => total + Number(pago.monto), 0))}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Pago mas alto</span><span>{formatCurrency(pagoMasAlto)}</span></div>
                </div>
                <Progress value={confirmacion} />
                <p className="text-xs text-muted-foreground">Confirmacion diaria: {confirmacion}%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="mt-0 flex flex-col gap-2">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Clientes activos" value={String(stats.totalClientes)} description="Total de clientes cargados." icon={Users} />
            <MetricCard title="Clientes con turnos" value={String(clientesConTurnos)} description="Clientes que ya pasaron por agenda." icon={Users} />
            <MetricCard title="Nuevos 30 dias" value={String(clientesNuevos30Dias)} description="Altas recientes de clientes." icon={CalendarDays} />
            <MetricCard title="Con proximo turno" value={String(clientesConProximoTurno)} description="Clientes que volveran a atenderse." icon={Clock3} />
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Promedio turnos cliente" value={String(promedioTurnosPorCliente)} description="Intensidad de uso de la base." icon={Clock3} />
            <MetricCard title="Monto medio por cliente" value={formatCurrency(pagosTotales / Math.max(clientes.length, 1))} description="Cobranza promedio por cliente." icon={DollarSign} />
            <MetricCard title="Clientes con saldo" value={String(turnosConDeuda.length)} description="Clientes asociados a deuda." icon={ShieldCheck} />
            <MetricCard title="Con proximo turno" value={String(clientesConProximoTurno)} description="Clientes con una próxima visita." icon={Clock3} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Clientes por mes</CardTitle>
              <CardDescription>Altas nuevas vs clientes activos por mes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <ComposedChart data={clientesPorMes}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="nuevos" fill="var(--color-total)" radius={6} />
                  <Line type="monotone" dataKey="activos" stroke="var(--color-confirmados)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes mas activos</CardTitle>
              <CardDescription>Top 5 por cantidad de turnos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={topClientes} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="nombre" type="category" tickLine={false} axisLine={false} width={140} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="turnos" radius={8} fill="var(--color-total)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tratamientos" className="mt-0 flex flex-col gap-2">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Tratamientos creados" value={String(tratamientos.length)} description="Catalogo disponible." icon={CalendarDays} />
            <MetricCard title="Costo promedio" value={formatCurrency(costoPromedioTratamiento)} description="Precio medio del catálogo." icon={DollarSign} />
            <MetricCard title="Duracion promedio" value={`${duracionPromedioTratamiento} min`} description="Tiempo medio por servicio." icon={Clock3} />
            <MetricCard title="Con historial" value={String(tratamientosConHistorial)} description="Tratamientos con cambios de precio." icon={Users} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso por tratamiento</CardTitle>
              <CardDescription>Top 5 por apariciones en turnos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart data={topTratamientos} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis dataKey="nombre" type="category" tickLine={false} axisLine={false} width={140} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="veces" radius={8} fill="var(--color-total)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costo y duración</CardTitle>
              <CardDescription>Los 6 tratamientos con mayor precio.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <ComposedChart data={tratamientosPorCosto}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="costo" fill="var(--color-total)" radius={6} />
                  <Line type="monotone" dataKey="duracion" stroke="var(--color-confirmados)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
