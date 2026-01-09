import { Card, CardContent, CardHeader, CardTitle } from '@render/components/ui/card';
import { Skeleton } from '@render/components/ui/skeleton';
import { Check, Clock, Send, XCircle } from 'lucide-react';
import { useEstadisticas } from '../hooks';

export function StatsCards() {
  const { estadisticas, loading } = useEstadisticas();

  if (loading || !estadisticas) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enviados hoy</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.hoy.enviados}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.semana.enviados} esta semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.hoy.pendientes}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.semana.pendientes} esta semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{estadisticas.hoy.fallidos}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.semana.fallidos} esta semana
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total enviados</CardTitle>
          <Check className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.total.enviados}</div>
          <p className="text-xs text-muted-foreground">
            desde el inicio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
