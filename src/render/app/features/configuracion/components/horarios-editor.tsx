import { useEffect, useState } from "react";
import { Button } from "@render/components/ui/button";
import { Switch } from "@render/components/ui/switch";
import { Input } from "@render/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@render/lib/utils";
import { HorarioSemanal, Franja } from "../configuracion";

const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface HorariosEditorProps {
  horarios: HorarioSemanal[];
  onSave: (horarios: HorarioSemanal[]) => Promise<void>;
}

function HorariosEditor({ horarios, onSave }: HorariosEditorProps) {
  const [localHorarios, setLocalHorarios] = useState<HorarioSemanal[]>([]);
  const [saving, setSaving] = useState(false);

  // Sincronizar estado local cuando cambian los props
  useEffect(() => {
    // Clonar profundamente para evitar mutaciones
    const cloned = horarios.map(h => ({
      ...h,
      franjas: h.franjas ? [...h.franjas.map(f => ({ ...f }))] : []
    }));
    setLocalHorarios(cloned);
  }, [horarios]);

  const handleActivoChange = (diaSemana: number, activo: boolean) => {
    setLocalHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        // Si se activa y no tiene franjas, agregar una por defecto
        const franjas = activo && h.franjas.length === 0
          ? [{ horaInicio: "09:00", horaFin: "18:00" }]
          : h.franjas;
        return { ...h, activo, franjas };
      })
    );
  };

  const handleFranjaChange = (
    diaSemana: number,
    index: number,
    field: keyof Franja,
    value: string
  ) => {
    setLocalHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        const newFranjas = [...h.franjas];
        newFranjas[index] = { ...newFranjas[index], [field]: value };
        return { ...h, franjas: newFranjas };
      })
    );
  };

  const addFranja = (diaSemana: number) => {
    setLocalHorarios((prev) =>
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
    setLocalHorarios((prev) =>
      prev.map((h) => {
        if (h.diaSemana !== diaSemana) return h;
        return {
          ...h,
          franjas: h.franjas.filter((_, i) => i !== index),
        };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localHorarios);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {DIAS_SEMANA.map((dia) => {
          const horario = localHorarios.find((h) => h.diaSemana === dia.value);
          if (!horario) return null;

          return (
            <div
              key={dia.value}
              className={cn(
                "p-3 rounded-lg border",
                horario.activo ? "bg-background" : "bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={horario.activo}
                    onCheckedChange={(checked) =>
                      handleActivoChange(dia.value, checked)
                    }
                  />
                  <span
                    className={cn(
                      "font-medium text-sm",
                      !horario.activo && "text-muted-foreground"
                    )}
                  >
                    {dia.label}
                  </span>
                </div>
                {!horario.activo && (
                  <span className="text-sm text-muted-foreground">Cerrado</span>
                )}
              </div>

              {horario.activo && (
                <div className="mt-3 ml-10 space-y-2">
                  {horario.franjas.map((franja, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={franja.horaInicio}
                        onChange={(e) =>
                          handleFranjaChange(dia.value, index, "horaInicio", e.target.value)
                        }
                        className="w-28"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <Input
                        type="time"
                        value={franja.horaFin}
                        onChange={(e) =>
                          handleFranjaChange(dia.value, index, "horaFin", e.target.value)
                        }
                        className="w-28"
                      />
                      {horario.franjas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFranja(dia.value, index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addFranja(dia.value)}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar franja
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar horarios
      </Button>
    </div>
  );
}

export default HorariosEditor;
