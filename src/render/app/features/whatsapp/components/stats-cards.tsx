import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@render/components/ui/card";
import { Skeleton } from "@render/components/ui/skeleton";
import { useEstadisticas } from "../hooks";

export function StatsCards() {
  const { estadisticas, loading } = useEstadisticas();

  if (loading || !estadisticas) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Enviados hoy
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{estadisticas.hoy.enviados}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.semana.enviados} acumulados en la semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Programados
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{estadisticas.hoy.pendientes}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.total.pendientes} pendientes en total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Fallidos
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-destructive">
            {estadisticas.hoy.fallidos}
          </div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.semana.fallidos} acumulados en la semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            Historial enviado
            <MessageCircleMore className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{estadisticas.total.enviados}</div>
          <p className="text-xs text-muted-foreground">Mensajes enviados desde el inicio</p>
        </CardContent>
      </Card>
    </div>
  );
}
