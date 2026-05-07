import { Card, CardContent } from "@render/components/ui/card";
import { Button } from "@render/components/ui/button";
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { CalendarPlus } from "lucide-react";
import { cn } from "@render/lib/utils";
import { useTurnos, type Turno } from "@render/hooks/use-turnos";
import { TurnoDetailSheet } from "./components/turno-detail-sheet";
import { DeleteTurnoDialog } from "./components/delete-turno-dialog";
import { PagoModal } from "./components/pago-modal";
import type { Franja } from "../configuracion/configuracion";

const localizer = dayjsLocalizer(dayjs)
dayjs.locale("es")

const messages = {
  allDay: "Todo el dia",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Sin eventos",
  showMore: (total: number) => `+${total} mas`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  turno: Turno;
}

function useCalendarBounds() {
  const [min, setMin] = useState(dayjs().hour(8).minute(0).second(0).toDate());
  const [max, setMax] = useState(dayjs().hour(20).minute(0).second(0).toDate());

  useEffect(() => {
    axios.get<{ diaSemana: number; activo: boolean; franjas: Franja[] }[]>(
      "http://localhost:3000/configuracion/horarios"
    ).then((res) => {
      const activos = res.data.filter(h => h.activo && h.franjas.length > 0);
      if (activos.length === 0) return;

      let earliest = 24;
      let latest = 0;

      for (const horario of activos) {
        for (const franja of horario.franjas) {
          const [h1] = franja.horaInicio.split(":").map(Number);
          const [h2, m2] = franja.horaFin.split(":").map(Number);
          if (h1 < earliest) earliest = h1;
          const fin = m2 > 0 ? h2 + 1 : h2;
          if (fin > latest) latest = fin;
        }
      }

      setMin(dayjs().hour(earliest).minute(0).second(0).toDate());
      setMax(dayjs().hour(latest).minute(0).second(0).toDate());
    }).catch(() => {
      // keep defaults
    });
  }, []);

  return { min, max };
}

function Calendario() {
  const {
    turnos,
    fetchTurnos,
    confirmarTurno,
    cancelarTurno,
    marcarCompletado,
    marcarAusente,
    deleteTurno,
  } = useTurnos();

  const [view, setView] = useState<"month" | "week" | "day">("week");
  const { min, max } = useCalendarBounds();

  // Detail sheet state
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);

  const eventos: CalendarEvent[] = useMemo(() =>
    turnos
      .filter(t => t.estado !== "cancelado")
      .map((turno) => ({
        id: turno.id,
        title: `${turno.cliente.nombre} ${turno.cliente.apellido}`,
        start: new Date(turno.fechaInicio),
        end: new Date(turno.fechaFin),
        turno,
      })),
    [turnos]
  );

  const handleSelectEvent = (event: CalendarEvent) => {
    setTurnoSeleccionado(event.turno);
    setSheetOpen(true);
  };

  const handleConfirmar = async () => {
    if (turnoSeleccionado) {
      await confirmarTurno(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleCancelar = async () => {
    if (turnoSeleccionado) {
      await cancelarTurno(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleMarcarCompletado = async () => {
    if (turnoSeleccionado) {
      await marcarCompletado(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleMarcarAusente = async () => {
    if (turnoSeleccionado) {
      await marcarAusente(turnoSeleccionado.id);
      setSheetOpen(false);
    }
  };

  const handleRegistrarPago = () => {
    setSheetOpen(false);
    setPagoModalOpen(true);
  };

  const handleDeleteClick = () => {
    setSheetOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (turnoSeleccionado) {
      await deleteTurno(turnoSeleccionado.id);
      setDeleteDialogOpen(false);
      setTurnoSeleccionado(null);
    }
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
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
    <div className="flex flex-col h-full w-full gap-3 p-3 md:p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Calendario</h1>
          <p className="text-sm text-muted-foreground">Vista semanal de turnos</p>
        </div>
        <Button asChild>
          <Link to="/turno/nuevo">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar turno
          </Link>
        </Button>
      </div>

      <Card className="flex-1 bg-background min-h-0 overflow-hidden flex flex-col">
        <CardContent className="flex-1 min-h-0 p-3 md:p-4">
          <Calendar<CalendarEvent>
            showMultiDayTimes={false}
            className="h-full overflow-auto"
            localizer={localizer}
            events={eventos}
            onSelectEvent={handleSelectEvent}
            popup
            components={{ event: CustomEvent }}
            views={["month", "week", "day"]}
            defaultView="week"
            view={view}
            onView={(v) => setView(v as "month" | "week" | "day")}
            messages={messages}
            min={min}
            max={max}
          />
        </CardContent>
      </Card>

      <TurnoDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        turno={turnoSeleccionado}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
        onMarcarCompletado={handleMarcarCompletado}
        onMarcarAusente={handleMarcarAusente}
        onRegistrarPago={handleRegistrarPago}
        onDelete={handleDeleteClick}
      />

      <DeleteTurnoDialog
        turno={turnoSeleccionado}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      <PagoModal
        open={pagoModalOpen}
        onOpenChange={setPagoModalOpen}
        turno={turnoSeleccionado}
        onSuccess={() => fetchTurnos()}
      />
    </div>
  );
}

export default Calendario;
