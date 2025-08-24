import { Card, CardContent } from "@render/components/ui/card";
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useEffect, useState } from "react";
import axios from "axios";
import TurnosModal from "./components/turnos-modal";
import { cn } from "@render/lib/utils";

const localizer = dayjsLocalizer(dayjs)
dayjs.locale("es")

type Turno = {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  tratamientos: [{
    nombre: string
  }];
};

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
  noEventsInRange: "Sin eventos",
  showMore: (total: number) => `+${total} más`,
};

function Calendario() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [view, setView] = useState<"month" | "week" | "day">("week");

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

  const CustomEvent = ({ event }: { event: any }) => {
    const duracionMin = dayjs(event.end).diff(dayjs(event.start), 'minute');
    const esCorto = duracionMin <= 30;
    const isMonth = view === "month";

    if (isMonth) {
      return (
        <div className="flex items-center gap-1 h-full justify-between p-1">
          <p className="text-sm font-bold truncate max-w-[calc(100%-75px)]">
            {event.title}
          </p>
          <span className="text-xs whitespace-nowrap">
            {dayjs(event.start).format("HH:mm")} - {dayjs(event.end).format("HH:mm")}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("overflow-hidden flex flex-col justify-between h-full text-white")}>
        {esCorto ? (
          <div className="flex items-center gap-1 h-full justify-between">
            <p className="text-sm font-bold truncate max-w-[calc(100%-75px)]">
              {event.title}
            </p>
            <span className="text-sm whitespace-nowrap">
              {dayjs(event.start).format("HH:mm")} - {dayjs(event.end).format("HH:mm")}
            </span>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold truncate">{event.title}</p>
            <span className="text-sm">
              {dayjs(event.start).format("HH:mm")} - {dayjs(event.end).format("HH:mm")}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Turnos</h1>
        <TurnosModal />
      </div>

      <Card className="flex-1 bg-background">
        <CardContent className="p-4 h-full">
          <Calendar
            showMultiDayTimes={false}
            className="max-h-[89vh] overflow-auto"
            localizer={localizer}
            events={eventos}
            onDoubleClickEvent={() => { }}
            popup
            components={{ event: CustomEvent }}
            views={["month", "week", "day"]}
            defaultView="week"
            view={view}
            onView={(v) => setView(v as "month" | "week" | "day")}
            messages={messages}
            min={dayjs('2022-12-18T08:00:00').toDate()}
            max={dayjs('2022-12-18T20:00:00').toDate()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Calendario;

