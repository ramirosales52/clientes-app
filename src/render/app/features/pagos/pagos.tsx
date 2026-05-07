import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  AlertCircle,
  CalendarRange,
  CreditCard,
  DollarSign,
  MessageSquareText,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  WalletCards,
} from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@render/components/ui/card";
import { Input } from "@render/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@render/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@render/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@render/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@render/components/ui/pagination";
import {
  calcularMontoPagado,
  METODOS_PAGO,
  type MetodoPago,
  type Pago,
  type TurnoConDeuda,
  usePagos,
} from "@render/hooks/use-pagos";
import { DeletePagoDialog } from "./components/delete-pago-dialog";

dayjs.locale("es");

const ITEMS_PER_PAGE = 12;

const METODO_BADGE: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Debito",
  tarjeta_credito: "Credito",
  mercadopago: "MercadoPago",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string): string {
  return dayjs(date).format("DD MMM YYYY, HH:mm");
}

function getMetodoVariant(metodo: MetodoPago):
  | "default"
  | "secondary"
  | "outline"
  | "destructive" {
  if (metodo === "efectivo") return "secondary";
  if (metodo === "transferencia") return "outline";
  if (metodo === "mercadopago") return "default";
  return "outline";
}

function isCurrentMonth(date: string): boolean {
  return dayjs(date).isSame(dayjs(), "month");
}

export default function PagosPage() {
  const { getPagos, getTurnosConDeuda, deletePago } = usePagos();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [deudas, setDeudas] = useState<TurnoConDeuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metodoFilter, setMetodoFilter] = useState<MetodoPago | "todos">("todos");
  const [periodo, setPeriodo] = useState<"todos" | "mes">("mes");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoToDelete, setPagoToDelete] = useState<Pago | null>(null);
  const [pagoDetalle, setPagoDetalle] = useState<Pago | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"historial" | "deudas">("historial");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pagosData, deudasData] = await Promise.all([getPagos(), getTurnosConDeuda()]);
      setPagos(pagosData);
      setDeudas(deudasData);
    } finally {
      setLoading(false);
    }
  }, [getPagos, getTurnosConDeuda]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pagosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    return pagos.filter((pago) => {
      if (metodoFilter !== "todos" && pago.metodoPago !== metodoFilter) {
        return false;
      }

      if (periodo === "mes" && !isCurrentMonth(pago.fechaPago)) {
        return false;
      }

      if (!term) return true;

      const cliente = pago.cliente
        ? `${pago.cliente.nombre} ${pago.cliente.apellido}`.toLowerCase()
        : "";
      const metodo = METODO_BADGE[pago.metodoPago].toLowerCase();
      const monto = formatCurrency(Number(pago.monto)).toLowerCase();
      const turno = pago.turno ? dayjs(pago.turno.fechaInicio).format("DD/MM/YYYY HH:mm") : "";

      return (
        cliente.includes(term) ||
        metodo.includes(term) ||
        monto.includes(term) ||
        turno.includes(term) ||
        pago.notas?.toLowerCase().includes(term)
      );
    });
  }, [metodoFilter, pagos, periodo, search]);

  const deudasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return deudas.filter((deuda) => {
      if (!term) return true;

      const cliente = `${deuda.cliente.nombre} ${deuda.cliente.apellido}`.toLowerCase();
      const tratamientos = deuda.tratamientos.map((tratamiento) => tratamiento.nombre).join(", ").toLowerCase();

      return (
        cliente.includes(term) ||
        tratamientos.includes(term) ||
        formatCurrency(deuda.deuda).toLowerCase().includes(term)
      );
    });
  }, [deudas, search]);

  const totalPages = Math.max(1, Math.ceil(pagosFiltrados.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [search, metodoFilter, periodo, activeTab]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagosPaginados = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return pagosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [page, pagosFiltrados]);

  const stats = useMemo(() => {
    const pagosMes = pagos.filter((pago) => isCurrentMonth(pago.fechaPago));
    const totalMes = pagosMes.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const totalGeneral = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const promedio = pagosMes.length > 0 ? totalMes / pagosMes.length : 0;

    const metodosMes = pagosMes.reduce<Record<string, number>>((acc, pago) => {
      acc[pago.metodoPago] = (acc[pago.metodoPago] || 0) + Number(pago.monto);
      return acc;
    }, {});

    const metodoDestacado = Object.entries(metodosMes).sort((a, b) => b[1] - a[1])[0];
    const deudaTotal = deudas.reduce((sum, deuda) => sum + deuda.deuda, 0);

    return {
      totalMes,
      totalGeneral,
      cantidadMes: pagosMes.length,
      promedio,
      metodoDestacado: metodoDestacado?.[0] as MetodoPago | undefined,
      deudaTotal,
      turnosConDeuda: deudas.length,
    };
  }, [deudas, pagos]);

  const handleDeleteClick = (pago: Pago) => {
    setPagoToDelete(pago);
    setDeleteDialogOpen(true);
  };

  const handleOpenDetalle = (pago: Pago) => {
    setPagoDetalle(pago);
    setDetalleOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pagoToDelete) return;

    const ok = await deletePago(pagoToDelete.id);
    if (!ok) return;

    setPagos((prev) => prev.filter((p) => p.id !== pagoToDelete.id));
    setDeleteDialogOpen(false);
    setPagoToDelete(null);
    fetchData();
  };

  const renderPagination = totalPages > 1 && activeTab === "historial";

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2 md:p-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Caja, historial de cobros y seguimiento de turnos con saldo pendiente.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos del mes</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              {formatCurrency(stats.totalMes)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.cantidadMes} pago{stats.cantidadMes !== 1 ? "s" : ""} registrados este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket promedio mensual</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              {formatCurrency(stats.promedio)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Promedio por pago del mes actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total historico cobrado</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <WalletCards className="h-5 w-5 text-muted-foreground" />
              {formatCurrency(stats.totalGeneral)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Suma de todos los pagos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Metodo mas usado del mes</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              {stats.metodoDestacado ? METODO_BADGE[stats.metodoDestacado] : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Segun monto total cobrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deuda pendiente</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              {formatCurrency(stats.deudaTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.turnosConDeuda} turno{stats.turnosConDeuda !== 1 ? "s" : ""} con saldo pendiente
            </p>
          </CardContent>
        </Card>
      </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="gap-2 pb-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "historial" ? "Buscar por cliente, turno o monto..." : "Buscar cliente, tratamiento o deuda..."}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "historial" | "deudas")}>
              <TabsList>
                <TabsTrigger value="historial" className="gap-2">
                  <ReceiptText className="h-4 w-4" />
                  Historial
                </TabsTrigger>
                <TabsTrigger value="deudas" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Deudas
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "historial" && (
              <>
                <Tabs
                  value={periodo}
                  onValueChange={(value) => setPeriodo(value as "todos" | "mes")}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                    <TabsTrigger value="mes">Este mes</TabsTrigger>
                    <TabsTrigger value="todos">Historico</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex flex-wrap gap-2 lg:ml-auto">
                  <Button
                    variant={metodoFilter === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMetodoFilter("todos")}
                  >
                    Todos
                  </Button>
                  {METODOS_PAGO.map((metodo) => (
                    <Button
                      key={metodo.value}
                      variant={metodoFilter === metodo.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMetodoFilter(metodo.value)}
                    >
                      {metodo.label}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {activeTab === "historial" ? (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {pagosFiltrados.length} pago{pagosFiltrados.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarRange className="h-4 w-4" />
                  {periodo === "mes" ? "Filtrado por mes actual" : "Mostrando historial completo"}
                </span>
              </div>

              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Cargando pagos...
                </div>
              ) : pagosPaginados.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground/40" />
                  <p className="font-medium">No hay pagos para mostrar</p>
                  <p className="text-sm text-muted-foreground">
                    Ajusta los filtros o registra pagos desde los turnos completados.
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha de pago</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Metodo</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="w-[170px] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosPaginados.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {pago.cliente
                                  ? `${pago.cliente.nombre} ${pago.cliente.apellido}`
                                  : "Cliente eliminado"}
                              </span>
                              {pago.notas && (
                                <span className="max-w-xs truncate text-xs text-muted-foreground">
                                  {pago.notas}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(pago.fechaPago)}</TableCell>
                          <TableCell>
                            {pago.turno ? (
                              <div className="flex flex-col">
                                <span>{formatDate(pago.turno.fechaInicio)}</span>
                                {pago.turno.estado && (
                                  <span className="text-xs capitalize text-muted-foreground">
                                    {pago.turno.estado}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getMetodoVariant(pago.metodoPago)}>
                              {METODO_BADGE[pago.metodoPago]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(Number(pago.monto))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {pago.turno && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleOpenDetalle(pago)}
                                >
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Detalle
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(pago)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          ) : loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Cargando deudas...
            </div>
          ) : deudasFiltradas.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">No hay deudas pendientes</p>
              <p className="text-sm text-muted-foreground">
                Todos los turnos completados figuran pagos o no hay cobros pendientes.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Tratamientos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudasFiltradas.map((deuda) => (
                    <TableRow key={deuda.turnoId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {deuda.cliente.nombre} {deuda.cliente.apellido}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {deuda.estado}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(deuda.fechaInicio)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {deuda.tratamientos.map((tratamiento) => (
                            <span key={tratamiento.id} className="text-sm">
                              {tratamiento.nombre}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(deuda.costoTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(deuda.montoPagado || calcularMontoPagado(deuda.pagos))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">
                        {formatCurrency(deuda.deuda)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {renderPagination && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((prev) => Math.max(1, prev - 1));
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                  <PaginationItem key={value}>
                    <PaginationLink
                      href="#"
                      isActive={page === value}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(value);
                      }}
                    >
                      {value}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <DeletePagoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        pago={pagoToDelete}
        onConfirm={handleDeleteConfirm}
      />

      <Sheet open={detalleOpen} onOpenChange={setDetalleOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle del pago y turno</SheetTitle>
            <SheetDescription>
              Información completa del turno asociado al pago seleccionado.
            </SheetDescription>
          </SheetHeader>

          {pagoDetalle && (
            <div className="mt-6 flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pago</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium">
                      {pagoDetalle.cliente
                        ? `${pagoDetalle.cliente.nombre} ${pagoDetalle.cliente.apellido}`
                        : "Cliente eliminado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha de pago</p>
                    <p className="font-medium">{formatDate(pagoDetalle.fechaPago)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Metodo</p>
                    <Badge variant={getMetodoVariant(pagoDetalle.metodoPago)}>
                      {METODO_BADGE[pagoDetalle.metodoPago]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto</p>
                    <p className="font-semibold">{formatCurrency(Number(pagoDetalle.monto))}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Turno asociado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {pagoDetalle.turno ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Inicio</p>
                          <p className="font-medium">{formatDate(pagoDetalle.turno.fechaInicio)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fin</p>
                          <p className="font-medium">
                            {pagoDetalle.turno.fechaFin ? formatDate(pagoDetalle.turno.fechaFin) : "-"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Estado</p>
                        <p className="font-medium capitalize">{pagoDetalle.turno.estado || "-"}</p>
                      </div>

                      <div>
                        <p className="mb-2 text-muted-foreground">Tratamientos</p>
                        {pagoDetalle.turno.tratamientos?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {pagoDetalle.turno.tratamientos.map((tratamiento) => (
                              <Badge key={tratamiento.id} variant="outline">
                                {tratamiento.nombre} - {formatCurrency(Number(tratamiento.costo))}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Sin tratamientos asociados</p>
                        )}
                      </div>

                      {pagoDetalle.turno.notas && (
                        <div className="rounded-md border bg-muted/30 p-3">
                          <p className="mb-1 flex items-center gap-2 text-muted-foreground">
                            <MessageSquareText className="h-4 w-4" />
                            Notas del turno
                          </p>
                          <p>{pagoDetalle.turno.notas}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No hay turno asociado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
