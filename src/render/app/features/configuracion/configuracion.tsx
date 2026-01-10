import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card";
import { Clock, Calendar, CalendarOff } from "lucide-react";
import HorariosEditor from "./components/horarios-editor";
import TemporadasList from "./components/temporadas-list";
import DiasEspecialesList from "./components/dias-especiales-list";

export interface Franja {
  horaInicio: string;
  horaFin: string;
}

export interface HorarioSemanal {
  id: string;
  diaSemana: number;
  activo: boolean;
  franjas: Franja[];
}

export interface Temporada {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  horarios: {
    id: string;
    diaSemana: number;
    activo: boolean;
    franjas: Franja[];
  }[];
}

export interface DiaEspecial {
  id: string;
  fecha: string;
  cerrado: boolean;
  motivo: string | null;
  franjas: Franja[] | null;
}

function Configuracion() {
  const [horarios, setHorarios] = useState<HorarioSemanal[]>([]);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [diasEspeciales, setDiasEspeciales] = useState<DiaEspecial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [horariosRes, temporadasRes, diasRes] = await Promise.all([
        axios.get<HorarioSemanal[]>("http://localhost:3000/configuracion/horarios"),
        axios.get<Temporada[]>("http://localhost:3000/configuracion/temporadas"),
        axios.get<DiaEspecial[]>("http://localhost:3000/configuracion/dias-especiales"),
      ]);
      setHorarios(horariosRes.data);
      setTemporadas(temporadasRes.data);
      setDiasEspeciales(diasRes.data);
    } catch (error) {
      console.error("Error fetching configuracion:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleHorariosUpdate = async (data: HorarioSemanal[]) => {
    try {
      const res = await axios.put<HorarioSemanal[]>("http://localhost:3000/configuracion/horarios", {
        horarios: data,
      });
      setHorarios(res.data);
      toast.success("Horarios guardados");
    } catch (error) {
      console.error("Error updating horarios:", error);
      toast.error("Error al guardar los horarios");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen p-6 gap-4 overflow-auto">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Horarios de atención del salón</p>
      </div>

      <Tabs defaultValue="horarios" className="flex-1">
        <TabsList>
          <TabsTrigger value="horarios" className="gap-2">
            <Clock className="h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="temporadas" className="gap-2">
            <Calendar className="h-4 w-4" />
            Temporadas
          </TabsTrigger>
          <TabsTrigger value="dias-especiales" className="gap-2">
            <CalendarOff className="h-4 w-4" />
            Días especiales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Horarios semanales</CardTitle>
              <CardDescription>
                Horarios habituales para cada día de la semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HorariosEditor
                horarios={horarios}
                onSave={handleHorariosUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporadas" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temporadas</CardTitle>
              <CardDescription>
                Horarios especiales para períodos del año (ej: verano)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemporadasList
                temporadas={temporadas}
                onRefresh={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dias-especiales" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Días especiales</CardTitle>
              <CardDescription>
                Feriados o días con horario especial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiasEspecialesList
                diasEspeciales={diasEspeciales}
                onRefresh={fetchData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Configuracion;
