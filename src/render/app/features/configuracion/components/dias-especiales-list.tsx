import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Trash2, Edit, CalendarOff } from "lucide-react";
import { DiaEspecial, Franja } from "../configuracion";

interface DiasEspecialesListProps {
  diasEspeciales: DiaEspecial[];
  onRefresh: () => void;
}

function DiasEspecialesList({ diasEspeciales, onRefresh }: DiasEspecialesListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fecha, setFecha] = useState("");
  const [cerrado, setCerrado] = useState(true);
  const [motivo, setMotivo] = useState("");
  const [franjas, setFranjas] = useState<Franja[]>([]);

  const resetForm = () => {
    setFecha("");
    setCerrado(true);
    setMotivo("");
    setFranjas([]);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (dia: DiaEspecial) => {
    setEditingId(dia.id);
    // Agregar T12:00:00 para evitar problemas de timezone
    const fechaStr = String(dia.fecha).split("T")[0];
    setFecha(fechaStr);
    setCerrado(dia.cerrado);
    setMotivo(dia.motivo || "");
    setFranjas(dia.franjas || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        fecha,
        cerrado,
        motivo: motivo || null,
        franjas: cerrado ? null : franjas,
      };

      if (editingId) {
        await axios.put(`http://localhost:3000/configuracion/dias-especiales/${editingId}`, payload);
        toast.success("Día especial actualizado");
      } else {
        await axios.post("http://localhost:3000/configuracion/dias-especiales", payload);
        toast.success("Día especial creado");
      }
      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving dia especial:", error);
      toast.error("Error al guardar el día especial");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/configuracion/dias-especiales/${id}`);
      toast.success("Día especial eliminado");
      onRefresh();
    } catch (error) {
      console.error("Error deleting dia especial:", error);
      toast.error("Error al eliminar el día especial");
    }
  };

  const addFranja = () => {
    setFranjas([...franjas, { horaInicio: "09:00", horaFin: "13:00" }]);
  };

  const updateFranja = (index: number, field: keyof Franja, value: string) => {
    const newFranjas = [...franjas];
    newFranjas[index] = { ...newFranjas[index], [field]: value };
    setFranjas(newFranjas);
  };

  const removeFranja = (index: number) => {
    setFranjas(franjas.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo día especial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar día especial" : "Nuevo día especial"}
              </DialogTitle>
              <DialogDescription>
                Marca un día como feriado o con horario especial
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input
                  placeholder="Ej: Feriado Nacional"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={cerrado} onCheckedChange={setCerrado} />
                <Label>Cerrado todo el día</Label>
              </div>
              {!cerrado && (
                <div className="space-y-2">
                  <Label>Horario especial</Label>
                  {franjas.map((franja, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={franja.horaInicio}
                        onChange={(e) => updateFranja(index, "horaInicio", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={franja.horaFin}
                        onChange={(e) => updateFranja(index, "horaFin", e.target.value)}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFranja(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFranja}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar franja
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {diasEspeciales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay días especiales configurados</p>
          <p className="text-sm text-muted-foreground">
            Agrega feriados o días con horario especial
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {diasEspeciales.map((dia) => (
            <div
              key={dia.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {dayjs(String(dia.fecha).split("T")[0] + "T12:00:00").format("dddd D [de] MMMM YYYY")}
                    </span>
                    <Badge variant={dia.cerrado ? "destructive" : "secondary"}>
                      {dia.cerrado ? "Cerrado" : "Horario especial"}
                    </Badge>
                  </div>
                  {dia.motivo && (
                    <p className="text-sm text-muted-foreground">{dia.motivo}</p>
                  )}
                  {!dia.cerrado && dia.franjas && dia.franjas.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {dia.franjas.map((f) => `${f.horaInicio} - ${f.horaFin}`).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(dia)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar día especial</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que querés eliminar este día especial?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(dia.id)}>
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

export default DiasEspecialesList;
