import { useEffect, useState } from "react";
import axios from "axios";
import { LayoutDashboard, Settings } from "lucide-react";
import { Badge } from "@render/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@render/components/ui/tabs";
import { ConfiguracionPanel } from "./components/configuracion-panel";
import { ListaRecordatorios } from "./components/lista-recordatorios";
import { StatsCards } from "./components/stats-cards";

type ConnectionStatus = "desconectado" | "conectando" | "listo";

function getStatusLabel(status: ConnectionStatus): string {
  if (status === "listo") return "WhatsApp conectado";
  if (status === "conectando") return "Conectando";
  return "WhatsApp desconectado";
}

export default function WhatsappPage() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("desconectado");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get("http://localhost:3000/whatsapp/status");
        if (res.data.connected) {
          setStatus("listo");
          setConnected(true);
        } else if (res.data.authenticated) {
          setStatus("conectando");
          setConnected(false);
        } else {
          setStatus("desconectado");
          setConnected(false);
        }
      } catch {
        setStatus("desconectado");
        setConnected(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-auto p-2 md:p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recordatorios</h1>
          <p className="text-sm text-muted-foreground">
            Centro de control de WhatsApp y mensajes automáticos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={
              status === "listo" ? "default" : status === "conectando" ? "secondary" : "destructive"
            }
            className="gap-2"
          >
            <div
              className={`h-2 w-2 rounded-full ${
                status === "listo"
                  ? "bg-primary-foreground"
                  : status === "conectando"
                    ? "bg-secondary-foreground animate-pulse"
                    : "bg-destructive-foreground"
              }`}
            />
            {getStatusLabel(status)}
          </Badge>
        </div>
      </div>

      <StatsCards />

      <Tabs defaultValue="recordatorios" className="flex flex-col gap-2">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="recordatorios" className="gap-2 px-4">
            <LayoutDashboard size={16} />
            Recordatorios
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2 px-4">
            <Settings size={16} />
            Configuracion
          </TabsTrigger>
        </TabsList>

        <div className="mt-0">
          <TabsContent value="recordatorios" className="mt-0 flex flex-col gap-2">
            <ListaRecordatorios />
          </TabsContent>

          <TabsContent value="configuracion" className="mt-0 flex flex-col gap-2">
            <ConfiguracionPanel
              status={status}
              setStatus={setStatus}
              connected={connected}
              setConnected={setConnected}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
