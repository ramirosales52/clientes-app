import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Bell, Check, CheckCircle2, Info, Trash2, WifiOff } from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Badge } from "@render/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@render/components/ui/sheet";
import { Skeleton } from "@render/components/ui/skeleton";
import { cn } from "@render/lib/utils";
import { useAlertas, type AlertaItem } from "@render/hooks/use-alertas";

const STORAGE_READ_KEY = "clientas_alertas_read";
const STORAGE_DISMISSED_KEY = "clientas_alertas_dismissed";

function getStoredIds(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

function setStoredIds(key: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
}

function getVisual(alerta: AlertaItem) {
  if (alerta.tipo === "error") {
    return {
      icon: WifiOff,
      className: "border-destructive/30 bg-destructive/5 text-foreground",
    };
  }

  if (alerta.tipo === "warning") {
    return {
      icon: AlertTriangle,
      className: "border-amber-500/30 bg-amber-500/5 text-foreground",
    };
  }

  if (alerta.tipo === "success") {
    return {
      icon: CheckCircle2,
      className: "border-green-500/30 bg-green-500/5 text-foreground",
    };
  }

  return {
    icon: Info,
    className: "border-border bg-muted/40 text-foreground",
  };
}

export function AlertasPanel() {
  const { alertas, loading } = useAlertas();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(getStoredIds(STORAGE_READ_KEY)));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() =>
    new Set(getStoredIds(STORAGE_DISMISSED_KEY))
  );

  useEffect(() => {
    const currentIds = new Set(alertas.map((alerta) => alerta.id));

    setReadIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => currentIds.has(id)));
      setStoredIds(STORAGE_READ_KEY, next);
      return next;
    });

    setDismissedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => currentIds.has(id)));
      setStoredIds(STORAGE_DISMISSED_KEY, next);
      return next;
    });
  }, [alertas]);

  const visibles = useMemo(() => {
    const sinDismissed = alertas.filter((alerta) => !dismissedIds.has(alerta.id));
    if (sinDismissed.length > 0) return sinDismissed;
    return [
      {
        id: "sin-alertas",
        tipo: "info",
        titulo: "Sin alertas visibles",
        descripcion: "No hay novedades activas. Si ocultaste alertas, reaparecen cuando cambie su estado.",
      } as AlertaItem,
    ];
  }, [alertas, dismissedIds]);

  const activas = visibles.filter((alerta) => alerta.id !== "sin-alertas");
  const unreadCount = activas.filter((alerta) => !readIds.has(alerta.id)).length;

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      setStoredIds(STORAGE_READ_KEY, next);
      return next;
    });
  };

  const dismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      setStoredIds(STORAGE_DISMISSED_KEY, next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      activas.forEach((alerta) => next.add(alerta.id));
      setStoredIds(STORAGE_READ_KEY, next);
      return next;
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Abrir alertas">
          <Bell data-icon="inline-start" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 min-w-5 px-1 text-[10px]" variant="destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Alertas y notificaciones</SheetTitle>
          <SheetDescription>
            Estado operativo de WhatsApp, recordatorios y turnos con atención pendiente.
          </SheetDescription>
        </SheetHeader>

        {!loading && activas.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {unreadCount} sin leer de {activas.length}
            </p>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check data-icon="inline-start" />
              Marcar todo leído
            </Button>
          </div>
        )}

        <div className="mt-4 flex h-[calc(100%-5rem)] flex-col gap-3 overflow-auto pr-1">
          {loading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            visibles.map((alerta) => {
              const visual = getVisual(alerta);
              const Icon = visual.icon;
              const leida = readIds.has(alerta.id);

              return (
                <div
                  key={alerta.id}
                  className={cn("rounded-lg border p-4", visual.className, leida && "opacity-75")}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{alerta.titulo}</p>
                      <p className="mt-1 text-sm opacity-90">{alerta.descripcion}</p>
                      {alerta.ctaHref && alerta.ctaLabel && (
                        <div className="mt-3">
                          <Button asChild size="sm" variant="outline" className="bg-background/70">
                            <Link to={alerta.ctaHref}>{alerta.ctaLabel}</Link>
                          </Button>
                        </div>
                      )}

                      {alerta.id !== "sin-alertas" && (
                        <div className="mt-2 flex items-center justify-end gap-1">
                          {!leida && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => markRead(alerta.id)}
                            >
                              Marcar leída
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => dismiss(alerta.id)}
                            aria-label="Ocultar alerta"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
