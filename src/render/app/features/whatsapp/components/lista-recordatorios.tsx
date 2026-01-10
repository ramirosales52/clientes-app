import { Badge } from '@render/components/ui/badge';
import { Button } from '@render/components/ui/button';
import { Input } from '@render/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@render/components/ui/select';
import { Separator } from '@render/components/ui/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@render/components/ui/sheet';
import { Skeleton } from '@render/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@render/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@render/components/ui/tabs';
import { Textarea } from '@render/components/ui/textarea';
import dayjs from 'dayjs';
import { Calendar, Check, CheckCircle2, Clock, Eye, MessageSquare, Pencil, Phone, Save, Search, Send, Sparkles, User, X, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRecordatorios } from '../hooks';
import type { EstadoRecordatorio, Recordatorio } from '../types';

const estadoConfig: Record<EstadoRecordatorio, { label: string; color: string; icon: typeof Clock }> = {
  programado: { label: 'Programado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  enviado: { label: 'Enviado', color: 'bg-green-50 text-green-700 border-green-200', icon: Check },
  fallido: { label: 'Fallido', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: X },
};

const tipoLabels: Record<string, string> = {
  previo: 'Recordatorio',
  confirmacion: 'Confirmación',
  manual: 'Manual',
};

const VARIABLES_DISPONIBLES = [
  { variable: '{nombre}', descripcion: 'Nombre del cliente' },
  { variable: '{apellido}', descripcion: 'Apellido del cliente' },
  { variable: '{fecha}', descripcion: 'Fecha del turno' },
  { variable: '{hora}', descripcion: 'Hora del turno' },
  { variable: '{tratamientos}', descripcion: 'Lista de tratamientos' },
];

/**
 * Convierte un mensaje renderizado de vuelta a su plantilla con variables.
 * Reemplaza los valores reales (nombre, fecha, etc.) por sus variables correspondientes.
 */
const revertirVariables = (mensaje: string, recordatorio: Recordatorio): string => {
  if (!recordatorio.cliente || !recordatorio.turno) return mensaje;
  
  let plantilla = mensaje;
  const fechaTurno = dayjs(recordatorio.turno.fechaInicio);
  
  // Orden importante: reemplazar primero los más específicos para evitar conflictos
  // Por ejemplo, tratamientos antes que nombres individuales
  
  // Tratamientos (lista completa)
  const tratamientos = recordatorio.turno.tratamientos?.map(t => t.nombre).join(', ');
  if (tratamientos) {
    plantilla = plantilla.replace(new RegExp(escapeRegex(tratamientos), 'g'), '{tratamientos}');
  }
  
  // Fecha formateada (ej: "sábado 19 de agosto")
  const fechaFormateada = fechaTurno.format('dddd D [de] MMMM');
  plantilla = plantilla.replace(new RegExp(escapeRegex(fechaFormateada), 'gi'), '{fecha}');
  
  // Hora (ej: "08:00")
  const horaFormateada = fechaTurno.format('HH:mm');
  plantilla = plantilla.replace(new RegExp(escapeRegex(horaFormateada), 'g'), '{hora}');
  
  // Nombre y apellido del cliente
  if (recordatorio.cliente.nombre) {
    plantilla = plantilla.replace(new RegExp(escapeRegex(recordatorio.cliente.nombre), 'g'), '{nombre}');
  }
  if (recordatorio.cliente.apellido) {
    plantilla = plantilla.replace(new RegExp(escapeRegex(recordatorio.cliente.apellido), 'g'), '{apellido}');
  }
  
  return plantilla;
};

/** Escapa caracteres especiales de regex */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function ListaRecordatorios() {
  const { recordatorios, loading, enviarRecordatorio, cancelarRecordatorio, actualizarMensaje } = useRecordatorios();
  const [selectedRecordatorio, setSelectedRecordatorio] = useState<Recordatorio | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mensajeEditado, setMensajeEditado] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [fechaFilter, setFechaFilter] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Filtrar recordatorios
  const recordatoriosFiltrados = useMemo(() => {
    let resultado = [...recordatorios];

    // Filtro por estado
    if (estadoFilter !== 'todos') {
      resultado = resultado.filter(r => r.estado === estadoFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      resultado = resultado.filter(r => r.tipo === tipoFilter);
    }

    // Filtro por fecha
    if (fechaFilter !== 'todos') {
      const hoy = dayjs().startOf('day');
      resultado = resultado.filter(r => {
        const fechaProgramada = dayjs(r.fechaProgramada);
        switch (fechaFilter) {
          case 'hoy':
            return fechaProgramada.isSame(hoy, 'day');
          case 'semana':
            return fechaProgramada.isAfter(hoy.subtract(1, 'day')) && fechaProgramada.isBefore(hoy.add(7, 'day'));
          case 'mes':
            return fechaProgramada.isSame(hoy, 'month');
          default:
            return true;
        }
      });
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const search = busqueda.toLowerCase();
      resultado = resultado.filter(r => 
        r.cliente?.nombre?.toLowerCase().includes(search) ||
        r.cliente?.apellido?.toLowerCase().includes(search) ||
        r.telefono?.includes(search)
      );
    }

    return resultado;
  }, [recordatorios, estadoFilter, tipoFilter, fechaFilter, busqueda]);

  // Contadores para los tabs
  const contadores = useMemo(() => ({
    todos: recordatorios.length,
    programado: recordatorios.filter(r => r.estado === 'programado').length,
    enviado: recordatorios.filter(r => r.estado === 'enviado').length,
    fallido: recordatorios.filter(r => r.estado === 'fallido').length,
  }), [recordatorios]);

  const handleOpenDetail = (rec: Recordatorio) => {
    setSelectedRecordatorio(rec);
    setMensajeEditado(rec.mensaje);
    setEditando(false);
    setSheetOpen(true);
  };

  const handleEditarClick = () => {
    if (selectedRecordatorio) {
      // Convertir mensaje renderizado a plantilla con variables
      const plantilla = revertirVariables(selectedRecordatorio.mensaje, selectedRecordatorio);
      setMensajeEditado(plantilla);
    }
    setEditando(true);
  };

  const handleGuardarMensaje = async () => {
    if (!selectedRecordatorio) return;
    setGuardando(true);
    const recordatorioActualizado = await actualizarMensaje(selectedRecordatorio.id, mensajeEditado);
    setEditando(false);
    setGuardando(false);
    // Actualizar con el mensaje renderizado del backend
    if (recordatorioActualizado) {
      setSelectedRecordatorio({ ...selectedRecordatorio, mensaje: recordatorioActualizado.mensaje });
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (recordatorios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-lg bg-muted/5">
        <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">No hay mensajes programados</p>
        <p className="text-sm">Los recordatorios aparecerán aquí cuando crees turnos.</p>
      </div>
    );
  }

  const selected = selectedRecordatorio;
  const estadoInfo = selected ? estadoConfig[selected.estado] : null;
  const EstadoIcon = estadoInfo?.icon || Clock;

  return (
    <>
      <div className="space-y-4">
        {/* Tabs por estado */}
        <Tabs value={estadoFilter} onValueChange={setEstadoFilter}>
          <TabsList>
            <TabsTrigger value="todos">
              Todos
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {contadores.todos}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="programado">
              Programados
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {contadores.programado}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="enviado">
              Enviados
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {contadores.enviado}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="fallido">
              Fallidos
              {contadores.fallido > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {contadores.fallido}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros secundarios */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="previo">Recordatorio</SelectItem>
              <SelectItem value="confirmacion">Confirmacion</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fechaFilter} onValueChange={setFechaFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las fechas</SelectItem>
              <SelectItem value="hoy">Hoy</SelectItem>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        {recordatoriosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-lg bg-muted/5">
            <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No hay recordatorios que coincidan</p>
            <p className="text-sm">Proba ajustando los filtros.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha de envio</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordatoriosFiltrados.map((rec) => {
                  const config = estadoConfig[rec.estado];

                  return (
                    <TableRow key={rec.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        {rec.cliente?.nombre} {rec.cliente?.apellido}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tipoLabels[rec.tipo] || rec.tipo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dayjs(rec.fechaProgramada).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {rec.telefono}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${config.color} border font-normal`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs gap-1.5"
                            onClick={() => handleOpenDetail(rec)}
                          >
                            <Eye size={14} />
                            Ver detalle
                          </Button>
                          
                          {rec.estado === 'programado' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                onClick={() => cancelarRecordatorio(rec.id)}
                                title="Cancelar envío"
                              >
                                <X size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary" 
                                onClick={() => enviarRecordatorio(rec.id)}
                                title="Enviar ahora"
                              >
                                <Send size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">
                  {selected?.cliente?.nombre} {selected?.cliente?.apellido}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {tipoLabels[selected?.tipo || ''] || selected?.tipo}
                </p>
              </div>
            </div>
          </SheetHeader>
          
          {selected && (
            <div className="space-y-5">
              {/* Estado destacado */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${estadoInfo?.color}`}>
                <EstadoIcon size={18} />
                <div>
                  <p className="font-medium text-sm">{estadoInfo?.label}</p>
                  <p className="text-xs opacity-80">
                    {selected.estado === 'programado' && 'Pendiente de envío'}
                    {selected.estado === 'enviado' && `Enviado el ${dayjs(selected.fechaEnvio).format('DD/MM/YYYY HH:mm')}`}
                    {selected.estado === 'fallido' && `${selected.intentos} intento(s) fallido(s)`}
                    {selected.estado === 'cancelado' && 'Este recordatorio fue cancelado'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Info del turno */}
              {selected.turno && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Calendar size={12} />
                    Información del Turno
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                      <p className="font-medium text-sm">
                        {dayjs(selected.turno.fechaInicio).format('dddd DD/MM')}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Horario</p>
                      <p className="font-medium text-sm">
                        {dayjs(selected.turno.fechaInicio).format('HH:mm')} - {dayjs(selected.turno.fechaFin).format('HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {selected.turno.tratamientos && selected.turno.tratamientos.length > 0 && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Sparkles size={12} />
                        Tratamientos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.turno.tratamientos.map(t => (
                          <Badge key={t.id} variant="secondary" className="font-normal text-xs">
                            {t.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Datos de envío */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Phone size={12} />
                  Datos de Envío
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                    <p className="font-mono text-sm">+{selected.telefono}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Envío programado</p>
                    <p className="font-medium text-sm">
                      {dayjs(selected.fechaProgramada).format('DD/MM HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Mensaje */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare size={12} />
                    Mensaje
                  </h4>
                  {selected.estado === 'programado' && (
                    editando ? (
                      <Button 
                        size="sm" 
                        onClick={handleGuardarMensaje}
                        disabled={guardando}
                        className="h-7 text-xs"
                      >
                        <Save size={12} className="mr-1" />
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleEditarClick}
                        className="h-7 text-xs"
                      >
                        <Pencil size={12} className="mr-1" />
                        Editar
                      </Button>
                    )
                  )}
                </div>
                {editando ? (
                  <>
                    <Textarea
                      value={mensajeEditado}
                      onChange={(e) => setMensajeEditado(e.target.value)}
                      className="min-h-[120px] text-sm leading-relaxed resize-none"
                      placeholder="Mensaje del recordatorio..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables disponibles: {VARIABLES_DISPONIBLES.map(v => v.variable).join(', ')}
                    </p>
                  </>
                ) : (
                  <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-l-primary/30">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selected.mensaje}
                    </p>
                  </div>
                )}
              </div>

              {/* Error si existe */}
              {selected.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Error en el envío</p>
                    <p className="text-xs text-red-600 mt-1">{selected.error}</p>
                  </div>
                </div>
              )}

              {/* Éxito si fue enviado */}
              {selected.fechaEnvio && selected.estado === 'enviado' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700">Enviado correctamente</p>
                    <p className="text-xs text-green-600 mt-1">
                      {dayjs(selected.fechaEnvio).format('dddd DD/MM/YYYY [a las] HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-2 pt-6">
            {selected?.estado === 'programado' && (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    if (selected) {
                      cancelarRecordatorio(selected.id);
                      setSheetOpen(false);
                    }
                  }}
                >
                  <X size={14} className="mr-2" />
                  Cancelar envío
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    if (selected) {
                      enviarRecordatorio(selected.id);
                      setSheetOpen(false);
                    }
                  }}
                >
                  <Send size={14} className="mr-2" />
                  Enviar ahora
                </Button>
              </>
            )}
            {selected?.estado !== 'programado' && (
              <Button variant="outline" onClick={() => setSheetOpen(false)} className="w-full">
                Cerrar
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
