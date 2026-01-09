import { Tabs, TabsContent, TabsList, TabsTrigger } from '@render/components/ui/tabs';
import axios from 'axios';
import { LayoutDashboard, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { ConfiguracionPanel } from './components/configuracion-panel';
import { ListaRecordatorios } from './components/lista-recordatorios';
import { StatsCards } from './components/stats-cards';

type ConnectionStatus = 'desconectado' | 'conectando' | 'listo';

export default function WhatsappPage() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('desconectado');

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get('http://localhost:3000/whatsapp/status');
        if (res.data.ready) {
          setStatus('listo');
          setConnected(true);
        } else if (res.data.authenticated) {
          // authenticated but not ready = still connecting
          setStatus('conectando');
          setConnected(false);
        } else {
          setStatus('desconectado');
          setConnected(false);
        }
      } catch {
        setStatus('desconectado');
        setConnected(false);
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-6 space-y-6 overflow-hidden bg-background">
      <Toaster position='bottom-center' />
      
      <div className='flex justify-between items-start'>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Mensajería</h1>
          <p className="text-muted-foreground">Gestioná los recordatorios automáticos por WhatsApp.</p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border ${
          status === 'listo' ? 'bg-green-50 text-green-700 border-green-200' :
          status === 'conectando' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          <div className={`h-2 w-2 rounded-full ${
            status === 'listo' ? 'bg-green-500' :
            status === 'conectando' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          {status === 'listo' ? 'WhatsApp Conectado' : status === 'conectando' ? 'Conectando...' : 'WhatsApp Desconectado'}
        </div>
      </div>

      <StatsCards />

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-fit">
          <TabsTrigger value="dashboard" className="gap-2 px-4">
            <LayoutDashboard size={16} />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="gap-2 px-4">
            <Settings size={16} />
            Configuración y Conexión
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-4 pr-2">
          <TabsContent value="dashboard" className="space-y-4 m-0 h-full">
            <ListaRecordatorios />
          </TabsContent>

          <TabsContent value="configuracion" className="m-0 h-full">
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
