import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarX,
  Clock,
  Edit3,
  Phone,
  Pencil,
  Plus,
  Save,
  Trash2,
  User,
  Heart,
  DollarSign,
  TrendingUp,
  History,
} from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Badge } from "@render/components/ui/badge";
import { Separator } from "@render/components/ui/separator";
import { Skeleton } from "@render/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import { Textarea } from "@render/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@render/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@render/components/ui/table";
import {
  useClientes,
  type Cliente,
  type ClienteNota,
  type ClienteStats,
  type Turno,
} from "@render/hooks/use-clientes";
import { useTurnos, type Turno as TurnoDetalle } from "@render/hooks/use-turnos";
import { ClientesModal } from "./components/clientes-modal";
import { DeleteClienteDialog } from "./components/delete-cliente-dialog";
import { TurnoDetailSheet } from "../turno/components/turno-detail-sheet";
import axios from "axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/es";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.locale("es");
dayjs.extend(relativeTime);

function formatDate(dateString: string): string {
  return dayjs(dateString).format("DD MMM YYYY");
}

function formatDateTime(dateString: string): string {
  return dayjs(dateString).format("ddd DD MMM, HH:mm");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPhone(codArea: string, numero: string): string {
  return `(${codArea}) ${numero}`;
}

function getEstadoBadgeVariant(estado: string) {
  switch (estado) {
    case "confirmado":
      return "default";
    case "pendiente":
      return "secondary";
    case "cancelado":
      return "destructive";
    case "realizado":
      return "outline";
    default:
      return "secondary";
  }
}

function getEstadoLabel(estado: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    realizado: "Realizado",
  };
  return labels[estado] || estado;
}

function calcularDuracion(fechaInicio: string, fechaFin: string): number {
  return dayjs(fechaFin).diff(dayjs(fechaInicio), "minute");
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function calcularCostoTurno(turno: Turno): number {
  return turno.costoTotal ?? 0;
}

function getMetodoPagoLabel(metodo: string): string {
  const labels: Record<string, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta_debito: "Débito",
    tarjeta_credito: "Crédito",
    mercadopago: "MercadoPago",
  };

  return labels[metodo] || metodo;
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    fetchCliente,
    calcularStats,
    updateCliente,
    deleteCliente,
    createClienteNota,
    updateClienteNota,
    deleteClienteNota,
  } =
    useClientes();
  const {
    confirmarTurno,
    cancelarTurno,
    marcarCompletado,
    marcarAusente,
    deleteTurno,
  } = useTurnos();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [turnoDetailOpen, setTurnoDetailOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoDetalle | null>(null);
  const [loadingTurno, setLoadingTurno] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [notaDraft, setNotaDraft] = useState("");
  const [notaEditando, setNotaEditando] = useState<ClienteNota | null>(null);
  const [notaEditValue, setNotaEditValue] = useState("");
  const [savingNota, setSavingNota] = useState(false);
  const [deletingNotaId, setDeletingNotaId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchCliente(id).then((data) => {
      if (data) {
        setCliente(data);
        setStats(calcularStats(data));
      }
      setLoading(false);
    });
  }, [id, fetchCliente, calcularStats]);

  const handleUpdate = async (data: Parameters<typeof updateCliente>[1]) => {
    if (!id) return;
    const updated = await updateCliente(id, data);
    setCliente(updated);
    setStats(calcularStats(updated));
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCliente(id);
    navigate("/clientes");
  };

  const refreshCliente = useCallback(async () => {
    if (!id) return;
    const updatedCliente = await fetchCliente(id);
    if (updatedCliente) {
      setCliente(updatedCliente);
      setStats(calcularStats(updatedCliente));
    }
  }, [calcularStats, fetchCliente, id]);

  const handleCrearNota = useCallback(async () => {
    if (!id || !notaDraft.trim()) return;
    try {
      setSavingNota(true);
      await createClienteNota(id, { contenido: notaDraft });
      setNotaDraft("");
      await refreshCliente();
    } catch (err) {
      console.error("Error al crear nota:", err);
      toast.error("Error al crear la nota");
    } finally {
      setSavingNota(false);
    }
  }, [createClienteNota, id, notaDraft, refreshCliente]);

  const handleGuardarNota = useCallback(async () => {
    if (!id || !notaEditando) return;
    try {
      setSavingNota(true);
      await updateClienteNota(id, notaEditando.id, { contenido: notaEditValue });
      setNotaEditando(null);
      setNotaEditValue("");
      await refreshCliente();
    } catch (err) {
      console.error("Error al actualizar nota:", err);
      toast.error("Error al actualizar la nota");
    } finally {
      setSavingNota(false);
    }
  }, [id, notaEditValue, notaEditando, refreshCliente, updateClienteNota]);

  const handleBorrarNota = useCallback(async (notaId: string) => {
    if (!id) return;
    try {
      setDeletingNotaId(notaId);
      await deleteClienteNota(id, notaId);
      await refreshCliente();
    } catch (err) {
      console.error("Error al borrar nota:", err);
      toast.error("Error al borrar la nota");
    } finally {
      setDeletingNotaId(null);
    }
  }, [deleteClienteNota, id, refreshCliente]);

  const handleVerDetalleTurno = useCallback(async (turnoId: string) => {
    try {
      setLoadingTurno(true);
      const response = await axios.get<TurnoDetalle>(`http://localhost:3000/turnos/${turnoId}`);
      setTurnoSeleccionado(response.data);
      setTurnoDetailOpen(true);
    } catch (err) {
      console.error("Error al cargar turno:", err);
      toast.error("Error al cargar el turno");
    } finally {
      setLoadingTurno(false);
    }
  }, []);

  const handleCloseTurnoDetail = useCallback((open: boolean) => {
    setTurnoDetailOpen(open);
    if (!open) {
      setTurnoSeleccionado(null);
    }
  }, []);

  const handleTurnoAction = useCallback(
    async (action: () => Promise<unknown>) => {
      if (!turnoSeleccionado) return;
      await action();
      const updatedCliente = await fetchCliente(id!);
      if (updatedCliente) {
        setCliente(updatedCliente);
        setStats(calcularStats(updatedCliente));
      }
      setTurnoDetailOpen(false);
      setTurnoSeleccionado(null);
    },
    [calcularStats, fetchCliente, id, turnoSeleccionado]
  );

  const turnosOrdenados = cliente?.turnos
    ? [...cliente.turnos].sort(
      (a, b) =>
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
    )
    : [];
  const notasOrdenadas = cliente?.notasCliente ?? [];

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full gap-2 p-2 md:p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4 flex-1">
          <Skeleton className="h-full" />
          <Skeleton className="h-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-2 p-2 md:p-3">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button
          variant="outline"
          onClick={() => navigate("/clientes")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-2 p-2 md:p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {cliente.nombre} {cliente.apellido}
          </h1>
        </div>
        <Button asChild>
          <Link to={`/turno/nuevo?clienteId=${cliente.id}`}>
            <Plus className="h-4 w-4 mr-2" />
            Agendar turno
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left column - Client info + Stats */}
        <div className="flex flex-col gap-3 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="mt-0 space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Informacion del cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary shrink-0">
                      {cliente.nombre[0]}
                      {cliente.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-lg truncate">
                        {cliente.nombre} {cliente.apellido}
                      </p>
                      <a
                        href={`tel:+549${cliente.codArea}${cliente.numero}`}
                        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Phone className="h-3 w-3 shrink-0" />
                        {formatPhone(cliente.codArea, cliente.numero)}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Cliente desde {formatDate(cliente.creadoEn)}</span>
                    <span className="text-muted-foreground/50">
                      ({dayjs(cliente.creadoEn).fromNow()})
                    </span>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {stats && (
                <>
                  <Card className={stats.proximoTurno ? "border-primary/30 bg-primary/5" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium">
                        <CalendarClock className={`h-4 w-4 ${stats.proximoTurno ? "text-primary" : "text-muted-foreground"}`} />
                        Proximo turno
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                  {stats.proximoTurno ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {capitalizar(formatDateTime(stats.proximoTurno.fechaInicio))}
                        </span>
                        <Badge variant={getEstadoBadgeVariant(stats.proximoTurno.estado)}>
                          {getEstadoLabel(stats.proximoTurno.estado)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {stats.proximoTurno.tratamientos.map((t) => (
                          <Badge key={t.id} variant="outline" className="text-xs">
                            {t.nombre}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dayjs(stats.proximoTurno.fechaInicio).fromNow()}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Sin turnos agendados</p>
                      <Button asChild size="sm" className="w-full">
                        <Link to={`/turno/nuevo?clienteId=${cliente.id}`}>
                          <Plus className="h-4 w-4 mr-2" />
                          Agendar turno
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <History className="h-4 w-4" />
                        Ultimo turno
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.ultimoTurno ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {capitalizar(formatDateTime(stats.ultimoTurno.fechaInicio))}
                            </span>
                            <Badge variant={getEstadoBadgeVariant(stats.ultimoTurno.estado)}>
                              {getEstadoLabel(stats.ultimoTurno.estado)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {stats.ultimoTurno.tratamientos.slice(0, 2).map((t) => (
                              <Badge key={t.id} variant="outline" className="text-xs">
                                {t.nombre}
                              </Badge>
                            ))}
                            {stats.ultimoTurno.tratamientos.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{stats.ultimoTurno.tratamientos.length - 2}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dayjs(stats.ultimoTurno.fechaInicio).fromNow()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin turnos anteriores</p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="text-xs">Total turnos</span>
                        </div>
                        <p className="text-2xl font-bold">{stats.totalTurnos}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stats.turnosPorEstado.realizado && (
                            <Badge variant="outline" className="text-xs">
                              {stats.turnosPorEstado.realizado} realizados
                            </Badge>
                          )}
                          {stats.turnosPorEstado.cancelado && (
                            <Badge variant="destructive" className="text-xs">
                              {stats.turnosPorEstado.cancelado} cancelados
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs">Gasto total</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(stats.gastoTotal)}</p>
                        {stats.totalTurnos > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Promedio: {formatCurrency(stats.gastoTotal / (stats.turnosPorEstado.realizado || 1))}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {stats.tratamientoFavorito && (
                      <Card className="col-span-2">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Heart className="h-3.5 w-3.5" />
                            <span className="text-xs">Tratamiento favorito</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{stats.tratamientoFavorito.nombre}</p>
                            <Badge variant="secondary">{stats.tratamientoFavorito.cantidad} veces</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}

              {stats && stats.totalTurnos === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarX className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Este cliente aun no tiene turnos</p>
                    <Button asChild className="mt-3">
                      <Link to={`/turno/nuevo?clienteId=${cliente.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agendar turno
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notas" className="mt-0 space-y-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Edit3 className="h-4 w-4" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={notaDraft}
                    onChange={(e) => setNotaDraft(e.target.value)}
                    placeholder="Escribi una nota..."
                    className="min-h-28"
                  />
                  <Button onClick={handleCrearNota} disabled={savingNota || !notaDraft.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Agregar nota
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {notasOrdenadas.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Todavia no hay notas para este cliente
                    </CardContent>
                  </Card>
                ) : (
                  notasOrdenadas.map((nota) => (
                    <Card key={nota.id}>
                      <CardContent className="pt-4 space-y-3">
                        <p className="text-sm whitespace-pre-wrap">{nota.contenido}</p>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>Creado: {capitalizar(formatDateTime(nota.creadoEn))}</span>
                          <span>Ult. modificacion: {capitalizar(formatDateTime(nota.actualizadoEn))}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotaEditando(nota);
                              setNotaEditValue(nota.contenido);
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleBorrarNota(nota.id)}
                            disabled={deletingNotaId === nota.id}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Borrar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Turnos history */}
        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Historial de turnos
              {turnosOrdenados.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {turnosOrdenados.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto px-4 pb-4" style={{ maxHeight: "clamp(20rem, 48vh, 32rem)" }}>
            {turnosOrdenados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Calendar className="h-10 w-10 opacity-50" />
                </div>
                <p className="font-medium">No hay turnos registrados</p>
                <p className="text-sm text-muted-foreground/70">
                  Los turnos de este cliente apareceran aqui
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tratamientos</TableHead>
                    <TableHead>Duracion</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Pagos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnosOrdenados.map((turno) => {
                    const esFuturo = dayjs(turno.fechaInicio).isAfter(dayjs());
                    return (
                      <TableRow
                        key={turno.id}
                        className={esFuturo ? "bg-primary/5" : ""}
                      >
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <span className="font-medium">
                              {capitalizar(formatDateTime(turno.fechaInicio))}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {dayjs(turno.fechaInicio).fromNow()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {turno.tratamientos.slice(0, 2).map((t) => (
                              <Badge
                                key={t.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {t.nombre}
                              </Badge>
                            ))}
                            {turno.tratamientos.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{turno.tratamientos.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-muted-foreground">
                            {formatDuration(
                              calcularDuracion(turno.fechaInicio, turno.fechaFin)
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(calcularCostoTurno(turno))}
                        </TableCell>
                        <TableCell>
                          {turno.pagos && turno.pagos.length > 0 ? (
                            <div className="space-y-1">
                              {turno.pagos.map((pago) => (
                                <div
                                  key={pago.id}
                                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1"
                                >
                                  <span className="text-xs font-medium text-green-700">
                                    {formatCurrency(pago.monto)}
                                  </span>
                                  <Badge variant="outline" className="text-[11px]">
                                    {getMetodoPagoLabel(pago.metodoPago)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin pagos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getEstadoBadgeVariant(turno.estado)}>
                            {getEstadoLabel(turno.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVerDetalleTurno(turno.id)}
                            disabled={loadingTurno}
                            aria-label="Ver detalle del turno"
                            title="Ver detalle del turno"
                          >
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <ClientesModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        cliente={cliente}
        onSubmit={handleUpdate}
      />

      {/* Delete Dialog */}
      <DeleteClienteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cliente={cliente}
        onConfirm={handleDelete}
      />

      <TurnoDetailSheet
        open={turnoDetailOpen}
        onOpenChange={handleCloseTurnoDetail}
        turno={turnoSeleccionado}
        onConfirmar={() => handleTurnoAction(() => confirmarTurno(turnoSeleccionado!.id))}
        onCancelar={() => handleTurnoAction(() => cancelarTurno(turnoSeleccionado!.id))}
        onMarcarCompletado={() => handleTurnoAction(() => marcarCompletado(turnoSeleccionado!.id))}
        onMarcarAusente={() => handleTurnoAction(() => marcarAusente(turnoSeleccionado!.id))}
        onRegistrarPago={() => handleCloseTurnoDetail(false)}
        onDelete={() => handleTurnoAction(() => deleteTurno(turnoSeleccionado!.id))}
      />

      <Dialog open={!!notaEditando} onOpenChange={(open) => !open && setNotaEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={notaEditValue}
              onChange={(e) => setNotaEditValue(e.target.value)}
              className="min-h-28"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotaEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarNota} disabled={savingNota || !notaEditValue.trim()}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClienteDetalle;
