import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@render/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@render/components/ui/alert-dialog";
import { Input } from "@render/components/ui/input";
import { Label } from "@render/components/ui/label";
import { Switch } from "@render/components/ui/switch";
import { Plus, Trash2, Edit, Calendar, Loader2, Clock, ArrowLeft, Eye } from "lucide-react";
import { cn } from "@render/lib/utils";
import { Temporada, Franja } from "../configuracion";

interface HorarioTemporada {
  id?: string;
  diaSemana: number;
  activo: boolean;
  franjas: Franja[];
}

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const defaultHorarios = (): HorarioTemporada[] =>
  DIAS_SEMANA.map((dia) => ({
    diaSemana: dia.value,
    activo: dia.value !== 0,
    franjas: dia.value === 0 ? [] : [{ horaInicio: "08:00", horaFin: "14:00" }],
  }));

interface TemporadasListProps {
  temporadas: Temporada[];
  onRefresh: () => void;
}

type ModalView = "datos" | "horarios";

function TemporadasList({ temporadas, onRefresh }: TemporadasListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingTemporada, setViewingTemporada] = useState<Temporada | null>(null);
  const [modalView, setModalView] = useState<ModalView>("datos");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activa, setActiva] = useState(true);
  const [horarios, setHorarios] = useState<HorarioTemporada[]>(defaultHorarios());

  const resetForm = () => {
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setActiva(true);
    setHorarios(defaultHorarios());
    setEditingId(null);
    setModalView("datos");
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (temporada: Temporada) => {
    setEditingId(temporada.id);
    setNombre(temporada.nombre);
    setFechaInicio(dayjs(temporada.fechaInicio).format("YYYY-MM-DD"));
    setFechaFin(dayjs(temporada.fechaFin).format("YYYY-MM-DD"));
    setActiva(temporada.activa);
    
    const horariosOrdenados = DIAS_SEMANA.map((dia) => {
      const h = temporada.horarios.find((x) => x.diaSemana === dia.value);
      return h || {
        diaSemana: dia.value,
        activo: dia.value !== 0,
        franjas: dia.value === 0 ? [] : [{ horaInicio: "08:00", horaFin: "14:00" }],
      };
    });
    setHorarios(horariosOrdenados);
    setModalView("datos");
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nombre,
        fechaInicio,
        fechaFin,
        activa,
        horarios: horarios.map((h) => ({
          diaSemana: h.diaSemana,
          activo: h.activo,
          franjas: h.franjas,
        })),
      };

      if (editingId) {
        await axios.put(`http://localhost:3000/configuracion/temporadas/${editingId}`, payload);
        toast.success("Temporada actualizada");
      } else {
        await axios.post("http://localhost:3000/configuracion/temporadas", payload);
        toast.success("Temporada creada");
      }
      handleClose();
      onRefresh();
    } catch (error) {
      console.error("Error saving temporada:", error);
      toast.error("Error al guardar la temporada");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/configuracion/temporadas/${id}`);
      toast.success("Temporada eliminada");
      onRefresh();
    } catch (error) {
      console.error("Error deleting temporada:", error);
      toast.error("Error al eliminar la temporada");
    }
  };

  const handleActivoChange = (diaSemana: number, activo: boolean) => {
    setHorarios((prev) =>
      prev.map((h) =>
        h.diaSemana === diaSemana 
          ? { ...h, activo, franjas: activo && h.franjas.length === 0 ? [{ horaInicio: "09:00", horaFin: "13:00" }] : h.franjas } 
          : h
      )
    );
  };

  const handleFranjaChange = (
    diaSemana: number,
    index: number,
    field: keyof Franja,
    value: string
  ) => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        const newFranjas = [...h.franjas];
        newFranjas[index] = { ...newFranjas[index], [field]: value };
        return { ...h, franjas: newFranjas };
      })
    );
  };

  const addFranja = (diaSemana: number) => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        return {
          ...h,
          franjas: [...h.franjas, { horaInicio: "09:00", horaFin: "13:00" }],
        };
      })
    );
  };

  const removeFranja = (diaSemana: number, index: number) => {
    setHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        return {
          ...h,
          franjas: h.franjas.filter((_, i) => i !== index),
        };
      })
    );
  };

  const formatDateRange = (inicio: string, fin: string) => {
    return `${dayjs(inicio).format("D MMM")} - ${dayjs(fin).format("D MMM YYYY")}`;
  };

  const horariosResumen = () => {
    const activos = horarios.filter((h) => h.activo).length;
    return `${activos} días configurados`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva temporada
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-sm">
          {modalView === "datos" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar temporada" : "Nueva temporada"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    placeholder="Ej: Verano 2026"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Inicio</Label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={activa} onCheckedChange={setActiva} />
                  <Label className="text-sm">Activa</Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setModalView("horarios")}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Configurar horarios
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {horariosResumen()}
                  </span>
                </Button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || !nombre || !fechaInicio || !fechaFin}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setModalView("datos")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  Horarios
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
                {DIAS_SEMANA.map((dia) => {
                  const horario = horarios.find((h) => h.diaSemana === dia.value);
                  if (!horario) return null;

                  return (
                    <div
                      key={dia.value}
                      className={cn(
                        "p-2 rounded border",
                        horario.activo ? "bg-background" : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={horario.activo}
                          onCheckedChange={(checked) => handleActivoChange(dia.value, checked)}
                        />
                        <span className={cn(
                          "font-medium text-sm flex-1",
                          !horario.activo && "text-muted-foreground"
                        )}>
                          {dia.label}
                        </span>
                        {!horario.activo && (
                          <span className="text-xs text-muted-foreground">Cerrado</span>
                        )}
                      </div>

                      {horario.activo && (
                        <div className="mt-2 ml-9 space-y-1">
                          {horario.franjas.map((franja, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={franja.horaInicio}
                                onChange={(e) =>
                                  handleFranjaChange(dia.value, index, "horaInicio", e.target.value)
                                }
                                className="w-32 h-7 text-sm"
                              />
                              <span className="text-muted-foreground text-sm">a</span>
                              <Input
                                type="time"
                                value={franja.horaFin}
                                onChange={(e) =>
                                  handleFranjaChange(dia.value, index, "horaFin", e.target.value)
                                }
                                className="w-32 h-7 text-sm"
                              />
                              {horario.franjas.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeFranja(dia.value, index)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addFranja(dia.value)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar franja
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <DialogFooter>
                <Button onClick={() => setModalView("datos")}>
                  Listo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalle */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {viewingTemporada?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Período</p>
                <p className="text-sm font-medium">
                  {viewingTemporada && formatDateRange(viewingTemporada.fechaInicio, viewingTemporada.fechaFin)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge variant={viewingTemporada?.activa ? "default" : "secondary"}>
                  {viewingTemporada?.activa ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>
            
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Horarios
                </p>
              </div>
              <div className="divide-y">
                {viewingTemporada && DIAS_SEMANA.map((dia) => {
                  const horario = viewingTemporada.horarios.find((h) => h.diaSemana === dia.value);
                  const isOpen = horario?.activo;
                  return (
                    <div 
                      key={dia.value} 
                      className={cn(
                        "flex justify-between items-center px-3 py-2",
                        !isOpen && "bg-muted/30"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        !isOpen && "text-muted-foreground"
                      )}>
                        {dia.label}
                      </span>
                      {isOpen ? (
                        <div className="flex gap-2">
                          {horario.franjas.map((f, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">
                              {f.horaInicio} - {f.horaFin}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {temporadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay temporadas configuradas</p>
          <p className="text-sm text-muted-foreground">
            Crea una temporada para definir horarios especiales
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {temporadas.map((temporada) => (
            <div
              key={temporada.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{temporada.nombre}</span>
                  <Badge variant={temporada.activa ? "default" : "secondary"} className="text-xs">
                    {temporada.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(temporada.fechaInicio, temporada.fechaFin)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setViewingTemporada(temporada);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalle
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleOpenEdit(temporada)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar temporada</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Eliminar "{temporada.nombre}"?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(temporada.id)}>
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemporadasList;
