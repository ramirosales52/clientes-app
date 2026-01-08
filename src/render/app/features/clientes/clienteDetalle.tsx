import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Clock,
  Phone,
  Pencil,
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
  type ClienteStats,
  type Turno,
} from "@render/hooks/use-clientes";
import { ClientesModal } from "./components/clientes-modal";
import { DeleteClienteDialog } from "./components/delete-cliente-dialog";
import TurnosModal from "../turnos/components/turnos-modal";
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
  return turno.tratamientos.reduce((sum, t) => sum + t.costo, 0);
}

function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchCliente, calcularStats, updateCliente, deleteCliente } =
    useClientes();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const turnosOrdenados = cliente?.turnos
    ? [...cliente.turnos].sort(
        (a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
      )
    : [];

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
          <Skeleton className="h-full" />
          <Skeleton className="h-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col h-screen w-full p-4 items-center justify-center">
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
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">
            {cliente.nombre} {cliente.apellido}
          </h1>
        </div>
        <TurnosModal />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left column - Client info + Stats */}
        <div className="flex flex-col gap-4 overflow-auto">
          {/* Client info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Informacion del cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
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

              {cliente.notas && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Notas
                    </p>
                    <p className="text-sm bg-muted/50 p-2 rounded">
                      {cliente.notas}
                    </p>
                  </div>
                </>
              )}

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

          {/* Stats section */}
          {stats && (
            <>
              {/* Proximo turno */}
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
                    <p className="text-sm text-muted-foreground">
                      Sin turnos agendados
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Ultimo turno */}
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
                    <p className="text-sm text-muted-foreground">
                      Sin turnos anteriores
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Stats grid */}
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
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.gastoTotal)}
                    </p>
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
                        <p className="font-semibold">
                          {stats.tratamientoFavorito.nombre}
                        </p>
                        <Badge variant="secondary">
                          {stats.tratamientoFavorito.cantidad} veces
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Empty state for no stats */}
          {stats && stats.totalTurnos === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarX className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Este cliente aun no tiene turnos
                </p>
                <TurnosModal className="mt-3" />
              </CardContent>
            </Card>
          )}
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
          <CardContent className="flex-1 overflow-auto px-4 pb-4">
            {turnosOrdenados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <div className="rounded-full bg-muted p-4 mb-3">
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
                    <TableHead>Estado</TableHead>
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
                          <Badge variant={getEstadoBadgeVariant(turno.estado)}>
                            {getEstadoLabel(turno.estado)}
                          </Badge>
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
    </div>
  );
}

export default ClienteDetalle;
