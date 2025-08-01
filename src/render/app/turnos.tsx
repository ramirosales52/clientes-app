import { Card, CardContent } from "@render/components/ui/card";
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useEffect, useState } from "react";
import axios from "axios";

const localizer = dayjsLocalizer(dayjs)
dayjs.locale("es")

type Turno = {
  id: string;
  fechaInicio: string; // ISO string
  fechaFin: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  tratamientos: [{
    nombre: string
  }];
};

function Turnos() {
  const [turnos, setTurnos] = useState<Turno[]>([]);

  const fetchTurnos = async () => {
    try {
      const res = await axios.get<Turno[]>("http://localhost:3000/turnos");
      setTurnos(res.data);
    } catch (err) {
      console.error("Error al cargar turnos:", err);
    }
  };

  useEffect(() => {
    fetchTurnos();
  }, []);

  const eventos = turnos.map((turno) => ({
    id: turno.id,
    title: `${turno.cliente.nombre} ${turno.cliente.apellido}`,
    start: new Date(turno.fechaInicio),
    end: new Date(turno.fechaFin),
    tratamientos: turno.tratamientos.map((t) => t.nombre),
  }));

  const messages = {
    allDay: "Todo el día",
    previous: "Anterior",
    next: "Siguiente",
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "Sin eventos"
  };


  const CustomEvent = ({ event }: { event: any }) => (
    <div className="flex flex-col gap-3">
      <strong>{event.title}</strong>
      <div className="text-sm text-white">
        {event.tratamientos?.join(", ")}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Turnos</h1>
      </div>

      <Card className="flex-1 bg-background">
        <CardContent className="p-4 h-full">
          <Calendar
            className="max-h-[89vh] overflow-auto"
            localizer={localizer}
            events={eventos}
            components={{ event: CustomEvent }}
            views={["month", "week", "day"]}
            defaultView="week"
            messages={messages}
            min={dayjs('2022-12-18T08:00:00').toDate()}
            max={dayjs('2022-12-18T20:00:00').toDate()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Turnos;

