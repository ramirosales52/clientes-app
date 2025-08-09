import { Button } from '@render/components/ui/button';
import { Card, CardContent } from '@render/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@render/components/ui/dialog';
import { ProgressCircle } from '@render/components/ui/progress';
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle } from '@render/components/ui/stepper';
import axios from 'axios';
import { Check, EllipsisVertical, Link, LogOut, ScanQrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import WhatsappLogo from "@render/assets/WhatsApp_Symbol_Alternative_0.svg"

function Step1() {
  return (
    <StepperTitle className="flex gap-1">
      Abrí{" "}
      <span className="inline-flex gap-1">
        WhatsApp <img src={WhatsappLogo} className="h-5 w-5 relative -top-0.5" alt="WhatsApp" />
      </span>{" "}
      en tu celular
    </StepperTitle>
  );
}

function Step2() {
  return (
    <StepperTitle className="flex gap-1">
      Tocá{" "}
      <span className="inline-flex gap-1">
        Menu{" "}
        <span className="bg-muted/80 border rounded-sm py-0.5 relative -top-0.5">
          <EllipsisVertical size={14} />
        </span>
      </span>{" "}
      &gt; Dispositivos vinculados
    </StepperTitle>
  );
}

function Step3() {
  return <StepperTitle>Presioná Vincular un dispositivo</StepperTitle>
}

function Step4() {
  return <StepperTitle>Escaneá el código QR que aparece acá</StepperTitle>
}

export default function WhatsappQR() {
  const [connected, setConnected] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'desconectado' | 'conectando' | 'listo'>('desconectado');

  const iniciarSesion = async () => {
    setQrUrl(null)
    try {
      await axios.post('http://localhost:3000/whatsapp/iniciar-sesion');
      pollQr();
      pollStatus();
    } catch (err) {
      toast.error('Error iniciando sesión');
    }
  };

  const cerrarSesion = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:3000/whatsapp/cerrar-sesion');
      console.log('Sesión cerrada:', res.data);
      setLoading(false)
      setStatus('desconectado');
      setConnected(false)
    } catch (error) {
      setLoading(false)
      console.error('Error al cerrar sesión:', error);
    }
  };

  const pollQr = () => {
    const fetchQr = async () => {
      const res = await axios.get("http://localhost:3000/whatsapp/qr");
      const newQr = res.data.qr;

      if (newQr && newQr !== qrUrl) {
        setQrUrl(newQr);
        console.log("nuevo");
      }

      if (status === "listo") {
        clearInterval(interval);
      }
    };

    // Ejecutar inmediatamente la primera vez
    fetchQr();

    // Luego seguir cada 30 segundos
    const interval = setInterval(fetchQr, 30000);
  };

  useEffect(() => { console.log(qrUrl) }, [qrUrl])

  const pollStatus = () => {
    const interval = setInterval(async () => {
      const res = await axios.get('http://localhost:3000/whatsapp/status');

      if (res.data.ready) {
        setStatus('listo');
        setConnected(true)
        clearInterval(interval);
      } else if (res.data.authenticated) {
        setStatus('conectando');
      } else {
        setStatus('desconectado');
        setConnected(false)
      }
    }, 1000);
  };

  const steps = [
    { component: Step1 },
    { component: Step2 },
    { component: Step3 },
    { component: Step4 },
  ];

  return (
    <div className="flex flex-col h-screen w-full p-4 space-y-4">
      <div className='flex justify-between'>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Whatsapp</h1>
          <span
            className={`
      text-sm font-medium px-2 py-0.5 rounded-md
      ${status === 'listo' ? 'bg-green-100 text-green-800' :
                status === 'conectando' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
    `}
          >
            {status === 'listo'
              ? 'Listo'
              : status === 'conectando'
                ? 'Conectando'
                : 'Desconectado'}
          </span>
        </div>
        <div className='flex gap-2'>
          {!connected ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={iniciarSesion} disabled={status === "listo"}>
                  <ScanQrCode />
                  Iniciar sesión
                </Button>
              </DialogTrigger>

              <DialogContent className="min-w-3xl">
                <DialogHeader>
                  <DialogTitle className='flex gap-2'>
                    <Link size={16} />
                    Vincular con WhatsApp
                  </DialogTitle>
                  <DialogDescription>
                    Vinculá tu cuenta una sola vez escaneando el QR con tu celular.
                  </DialogDescription>
                </DialogHeader>
                <Toaster position='bottom-center' />
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 p-4 h-56">
                    <Stepper orientation="vertical">
                      <StepperNav>
                        {steps.map((step, index) => (
                          <StepperItem key={index} step={1} className="relative items-start not-last:flex-1">
                            <div className="flex flex-row items-start pb-7 last:pb-0 gap-2.5">
                              <StepperIndicator className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                {index + 1}
                              </StepperIndicator>

                              <div className="mt-1.25 text-left">
                                <step.component />
                              </div>
                            </div>
                            {index < steps.length - 1 && (
                              <StepperSeparator className="absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-5" />
                            )}
                          </StepperItem>
                        ))}
                      </StepperNav>
                    </Stepper>
                  </div>
                  <div className="col-span-1 flex items-center justify-center w-56 h-56 relative">
                    {qrUrl ? (
                      <>
                        <img
                          src={qrUrl}
                          alt="QR WhatsApp"
                          className={`w-56 h-56 border-2 rounded-md ${status !== 'desconectado' ? 'blur-sm' : ''}`}
                        />

                        {/* Overlay conectando */}
                        {status === 'conectando' && (
                          <div className="absolute inset-0 bg-background/60 rounded-md flex items-center justify-center flex-col gap-1">
                            <>
                              <ProgressCircle
                                value={25}
                                size={24}
                                strokeWidth={3}
                                className="text-primary animate-spin"
                              />
                            </>
                          </div>
                        )}

                        {/* Overlay cuando está listo */}
                        {status === 'listo' && (
                          <div className="absolute inset-0 bg-background/60 rounded-md flex items-center justify-center flex-col gap-1">
                            <div className="rounded-full bg-green-500 p-1.5">
                              <Check size={20} className="text-white" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-56 w-56 flex items-center justify-center rounded-xl bg-muted/30">
                        <ProgressCircle
                          value={25}
                          size={32}
                          strokeWidth={3}
                          className="text-accent animate-spin"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant='destructive' onClick={cerrarSesion} disabled={status === "desconectado"}>
              {loading ? (
                <>
                  <ProgressCircle value={25} size={16} strokeWidth={3} className='text-destructive-foreground animate-spin' />
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Cerrar sesión
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card className="flex-1 bg-background">
        <CardContent className="p-4 h-full">
        </CardContent>
      </Card>
    </div>
  );
}


