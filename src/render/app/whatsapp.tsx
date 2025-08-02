import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@render/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@render/components/ui/dialog';
import { Button } from '@render/components/ui/button';
import { toast, Toaster } from 'sonner';

export default function WhatsappQR() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const iniciarSesion = async () => {
    try {
      await axios.post('http://localhost:3000/whatsapp/iniciar-sesion');
      toast.info('Esperando QR...');
      pollQr();
      pollStatus();
    } catch (err) {
      toast.error('Error iniciando sesión');
    }
  };

  const pollQr = () => {
    const interval = setInterval(async () => {
      const res = await axios.get('http://localhost:3000/whatsapp/qr');
      if (res.data.qr) {
        setQrUrl(res.data.qr);
        clearInterval(interval);
        toast.success('QR listo para escanear');
      }
    }, 1000);
  };

  const pollStatus = () => {
    setCheckingStatus(true);
    const interval = setInterval(async () => {
      const res = await axios.get('http://localhost:3000/whatsapp/status');
      if (res.data.authenticated || res.data.ready) {
        toast.success('Bot autenticado en WhatsApp');
        setCheckingStatus(false);
        clearInterval(interval);
        setQrUrl(null); // limpiamos el QR si querés
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Whatsapp</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={iniciarSesion}>Iniciar sesión WhatsApp</Button>
          </DialogTrigger>

          <DialogContent className="text-center">
            <Toaster position='bottom-center' />

            {qrUrl && (
              <img src={qrUrl} alt="QR de WhatsApp" className="w-64 h-64 border" />
            )}

            {checkingStatus && <p>Verificando estado...</p>}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="flex-1 bg-background">
        <CardContent className="p-4 h-full">
        </CardContent>
      </Card>
    </div>
  );
}

