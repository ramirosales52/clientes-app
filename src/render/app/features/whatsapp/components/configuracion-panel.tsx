import { Button } from '@render/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@render/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@render/components/ui/dialog';
import { Input } from '@render/components/ui/input';
import { Label } from '@render/components/ui/label';
import { ProgressCircle } from '@render/components/ui/progress';
import { Skeleton } from '@render/components/ui/skeleton';
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle } from '@render/components/ui/stepper';
import { Switch } from '@render/components/ui/switch';
import { Textarea } from '@render/components/ui/textarea';
import axios from 'axios';
import { Check, Clock, EllipsisVertical, Link, LogOut, MessageSquare, Save, ScanQrCode, Send, Settings, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import WhatsappLogo from '@render/assets/WhatsApp_Symbol_Alternative_0.svg';
import { useConfiguracion, usePlantillas } from '../hooks';
import type { ConfiguracionRecordatorio, PlantillaMensaje } from '../types';

// Steps components for QR Dialog - Tu diseño original
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

const steps = [
  { component: Step1 },
  { component: Step2 },
  { component: Step3 },
  { component: Step4 },
];

export function ConfiguracionPanel({ 
  status, 
  setStatus, 
  connected, 
  setConnected 
}: { 
  status: 'desconectado' | 'conectando' | 'listo';
  setStatus: (s: 'desconectado' | 'conectando' | 'listo') => void;
  connected: boolean;
  setConnected: (c: boolean) => void;
}) {
  const { configuracion, loading: loadingConfig, actualizarConfiguracion } = useConfiguracion();
  const { plantillas, loading: loadingPlantillas, actualizarPlantilla, crearPlantilla } = usePlantillas();
  
  const [formData, setFormData] = useState<Partial<ConfiguracionRecordatorio>>({});
  const [plantillaPrevio, setPlantillaPrevio] = useState<PlantillaMensaje | null>(null);
  const [plantillaConfirmacion, setPlantillaConfirmacion] = useState<PlantillaMensaje | null>(null);
  
  // Connection states
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (configuracion) {
      setFormData(configuracion);
    }
  }, [configuracion]);

  useEffect(() => {
    if (plantillas.length > 0) {
      setPlantillaPrevio(plantillas.find(p => p.tipo === 'previo') || null);
      setPlantillaConfirmacion(plantillas.find(p => p.tipo === 'confirmacion') || null);
    }
  }, [plantillas]);

  const handleChange = <K extends keyof ConfiguracionRecordatorio>(
    key: K,
    value: ConfiguracionRecordatorio[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await actualizarConfiguracion(formData);
    
    if (plantillaPrevio) {
      await actualizarPlantilla(plantillaPrevio.id, { contenido: plantillaPrevio.contenido });
    } else {
      await crearPlantilla({ 
        nombre: 'Recordatorio Previo', 
        tipo: 'previo', 
        contenido: 'Hola {nombre}, te recordamos tu turno para el {fecha} a las {hora}.', 
        activa: true 
      });
    }

    if (plantillaConfirmacion) {
      await actualizarPlantilla(plantillaConfirmacion.id, { contenido: plantillaConfirmacion.contenido });
    } else {
      await crearPlantilla({ 
        nombre: 'Confirmación', 
        tipo: 'confirmacion', 
        contenido: 'Hola {nombre}, tu turno de hoy a las {hora} está confirmado.', 
        activa: true 
      });
    }
  };

  // Connection logic
  const clearAllIntervals = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  const iniciarSesion = async () => {
    clearAllIntervals();
    setQrUrl(null);
    try {
      await axios.post('http://localhost:3000/whatsapp/iniciar-sesion');
      
      const fetchQr = async () => {
        try {
          const res = await axios.get("http://localhost:3000/whatsapp/qr");
          if (res.data.qr) setQrUrl(res.data.qr);
        } catch {
          // ignore
        }
      };
      
      const pollStatus = async () => {
        try {
          const res = await axios.get('http://localhost:3000/whatsapp/status');
          if (res.data.ready) {
            setStatus('listo');
            setConnected(true);
            clearAllIntervals();
          } else if (res.data.authenticated) {
            setStatus('conectando');
          }
        } catch {
          // ignore
        }
      };

      fetchQr();
      pollStatus();
      qrIntervalRef.current = setInterval(fetchQr, 5000);
      statusIntervalRef.current = setInterval(pollStatus, 2000);
    } catch {
      toast.error('Error iniciando sesión');
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      clearAllIntervals();
      setQrUrl(null);
    }
  };

  const cerrarSesion = async () => {
    setLoadingConnection(true);
    try {
      await axios.post('http://localhost:3000/whatsapp/cerrar-sesion');
      setStatus('desconectado');
      setConnected(false);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error(error);
      toast.error('Error al desconectar');
    } finally {
      setLoadingConnection(false);
    }
  };

  const enviarMensajeTest = async () => {
    setSendingTest(true);
    try {
      await axios.post('http://localhost:3000/whatsapp/send', {
        phone: '5493472436328',
        message: 'test'
      });
      toast.success('Mensaje de prueba enviado');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar mensaje de prueba');
    } finally {
      setSendingTest(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAllIntervals();
  }, []);

  if (loadingConfig || loadingPlantillas) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {/* Left Column: Connection & Basic Settings */}
      <div className="space-y-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone size={18} />
              Estado de Conexión
            </CardTitle>
            <CardDescription>
              Vinculá tu WhatsApp para enviar mensajes automáticos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {connected ? 'Conectado y listo' : status === 'conectando' ? 'Conectando...' : 'Desconectado'}
                </span>
              </div>
              
              {!connected ? (
                <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={iniciarSesion}>
                      <ScanQrCode size={14} className="mr-2" />
                      Vincular
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
                                <ProgressCircle
                                  value={25}
                                  size={24}
                                  strokeWidth={3}
                                  className="text-primary animate-spin"
                                />
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={enviarMensajeTest} 
                    disabled={sendingTest}
                  >
                    <Send size={14} className="mr-2" />
                    {sendingTest ? 'Enviando...' : 'Test'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={cerrarSesion} 
                    disabled={loadingConnection}
                  >
                    {loadingConnection ? (
                      <>
                        <ProgressCircle value={25} size={14} strokeWidth={3} className='text-muted-foreground animate-spin mr-2' />
                        Cerrando...
                      </>
                    ) : (
                      <>
                        <LogOut size={14} className="mr-2" />
                        Desconectar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Horario envío (Inicio)</Label>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="h-8" 
                      value={formData.horaEnvioMinima} 
                      onChange={e => handleChange('horaEnvioMinima', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Horario envío (Fin)</Label>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    <Input 
                      type="number" 
                      className="h-8" 
                      value={formData.horaEnvioMaxima} 
                      onChange={e => handleChange('horaEnvioMaxima', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings size={18} />
              Reglas de Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recordatorio previo</Label>
                <p className="text-xs text-muted-foreground">Enviar aviso antes del turno</p>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  className="w-16 h-8 text-right" 
                  value={formData.horasAntesPrevio} 
                  onChange={e => handleChange('horasAntesPrevio', parseInt(e.target.value))}
                />
                <span className="text-xs text-muted-foreground">hs antes</span>
                <Switch 
                  checked={formData.recordatorioPrevioActivo} 
                  onCheckedChange={v => handleChange('recordatorioPrevioActivo', v)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmación inmediata</Label>
                <p className="text-xs text-muted-foreground">Avisar cuando se confirma</p>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  className="w-16 h-8 text-right" 
                  value={formData.horasAntesConfirmacion} 
                  onChange={e => handleChange('horasAntesConfirmacion', parseInt(e.target.value))}
                />
                <span className="text-xs text-muted-foreground">hs antes</span>
                <Switch 
                  checked={formData.recordatorioConfirmacionActivo} 
                  onCheckedChange={v => handleChange('recordatorioConfirmacionActivo', v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Templates */}
      <div className="space-y-6">
        <Card className="h-full shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare size={18} />
              Plantillas de Mensajes
            </CardTitle>
            <CardDescription>
              Personalizá los mensajes que se envían automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="font-medium">Mensaje de Recordatorio (Previo)</Label>
              <Textarea 
                className="min-h-[100px] font-sans resize-none"
                value={plantillaPrevio?.contenido || ''}
                onChange={e => setPlantillaPrevio(prev => prev ? ({...prev, contenido: e.target.value}) : null)}
                placeholder="Hola {nombre}..."
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{nombre}'}, {'{fecha}'}, {'{hora}'}, {'{tratamientos}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Mensaje de Confirmación</Label>
              <Textarea 
                className="min-h-[100px] font-sans resize-none"
                value={plantillaConfirmacion?.contenido || ''}
                onChange={e => setPlantillaConfirmacion(prev => prev ? ({...prev, contenido: e.target.value}) : null)}
                placeholder="Tu turno ha sido confirmado..."
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
