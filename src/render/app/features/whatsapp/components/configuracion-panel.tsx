import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Check,
  Clock3,
  Link,
  LogOut,
  MessageSquareText,
  Save,
  ScanQrCode,
  Send,
  Smartphone,
} from "lucide-react";
import { Button } from "@render/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@render/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@render/components/ui/dialog";
import { Input } from "@render/components/ui/input";
import { Label } from "@render/components/ui/label";
import { ProgressCircle } from "@render/components/ui/progress";
import { Skeleton } from "@render/components/ui/skeleton";
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle } from "@render/components/ui/stepper";
import { Switch } from "@render/components/ui/switch";
import WhatsappLogo from "@render/assets/WhatsApp_Symbol_Alternative_0.svg";
import { useConfiguracion } from "../hooks";
import type { ConfiguracionRecordatorio } from "../types";

function Step1() {
  return <StepperTitle className="flex gap-1">Abrí <span className="inline-flex gap-1">WhatsApp <img src={WhatsappLogo} className="relative -top-0.5 h-5 w-5" alt="WhatsApp" /></span> en tu celular</StepperTitle>;
}

function Step2() { return <StepperTitle>Entrá a Dispositivos vinculados</StepperTitle>; }
function Step3() { return <StepperTitle>Presioná Vincular un dispositivo</StepperTitle>; }
function Step4() { return <StepperTitle>Escaneá el código QR desde esta pantalla</StepperTitle>; }

const steps = [{ component: Step1 }, { component: Step2 }, { component: Step3 }, { component: Step4 }];

export function ConfiguracionPanel({
  status,
  setStatus,
  connected,
  setConnected,
}: {
  status: "desconectado" | "conectando" | "listo";
  setStatus: (s: "desconectado" | "conectando" | "listo") => void;
  connected: boolean;
  setConnected: (c: boolean) => void;
}) {
  const { configuracion, loading: loadingConfig, actualizarConfiguracion } = useConfiguracion();
  const [formData, setFormData] = useState<Partial<ConfiguracionRecordatorio>>({});
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [startingConnection, setStartingConnection] = useState(false);
  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectedRef = useRef(connected);

  useEffect(() => { connectedRef.current = connected; }, [connected]);
  useEffect(() => { if (configuracion) setFormData(configuracion); }, [configuracion]);

  const handleChange = <K extends keyof ConfiguracionRecordatorio>(key: K, value: ConfiguracionRecordatorio[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllIntervals = () => {
    if (qrIntervalRef.current) { clearInterval(qrIntervalRef.current); qrIntervalRef.current = null; }
    if (statusIntervalRef.current) { clearInterval(statusIntervalRef.current); statusIntervalRef.current = null; }
  };

  const iniciarSesion = async () => {
    clearAllIntervals();
    setQrUrl(null);
    setStartingConnection(true);
    try {
      await axios.post("http://localhost:3000/whatsapp/iniciar-sesion");
      const fetchQr = async () => {
        try { const res = await axios.get("http://localhost:3000/whatsapp/qr"); if (res.data.qr) setQrUrl(res.data.qr); } catch {}
      };
      const pollStatus = async () => {
        try {
          const res = await axios.get("http://localhost:3000/whatsapp/status");
          if (res.data.connected) {
            connectedRef.current = true;
            setStatus("listo");
            setConnected(true);
            setDialogOpen(false);
            setQrUrl(null);
            clearAllIntervals();
          } else if (res.data.authenticated) {
            setStatus("conectando");
            setConnected(false);
            connectedRef.current = false;
          }
        } catch {}
      };
      fetchQr();
      pollStatus();
      qrIntervalRef.current = setInterval(fetchQr, 5000);
      statusIntervalRef.current = setInterval(pollStatus, 2000);
    } catch {
      toast.error("Error iniciando sesión");
    } finally {
      setStartingConnection(false);
    }
  };

  const handleDialogChange = async (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      clearAllIntervals();
      setQrUrl(null);
      if (!connectedRef.current) {
        try {
          await axios.post("http://localhost:3000/whatsapp/cancelar-conexion");
          setStatus("desconectado");
          setConnected(false);
        } catch (error) {
          console.error("Error cancelando conexión pendiente:", error);
        }
      }
    }
  };

  const cerrarSesion = async () => {
    setLoadingConnection(true);
    try {
      await axios.post("http://localhost:3000/whatsapp/cerrar-sesion");
      setStatus("desconectado");
      setConnected(false);
      toast.success("WhatsApp desconectado");
    } catch (error) {
      console.error(error);
      toast.error("Error al desconectar");
    } finally {
      setLoadingConnection(false);
    }
  };

  const enviarMensajeTest = async () => {
    const phone = window.prompt("Numero de telefono para enviar test (ej: 5493472000000):");
    if (!phone) return;
    setSendingTest(true);
    try {
      await axios.post("http://localhost:3000/whatsapp/send", { phone, message: "Mensaje de prueba desde Clientas" });
      toast.success("Mensaje de prueba enviado");
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar mensaje de prueba");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSave = async () => {
    await actualizarConfiguracion(formData);
    toast.success("Configuración actualizada");
  };

  useEffect(() => () => clearAllIntervals(), []);

  if (loadingConfig) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Conexion con WhatsApp</CardTitle>
            <CardDescription>Vinculá el dispositivo una sola vez y usa este panel para validar la sesión.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-medium">{connected ? "Conectado y listo" : status === "conectando" ? "Conectando..." : "Desconectado"}</p>
                <p className="text-sm text-muted-foreground">{connected ? "El bot puede enviar mensajes y procesar respuestas." : "Necesitas una sesión activa para enviar recordatorios."}</p>
              </div>
              <div className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : status === "conectando" ? "bg-amber-500 animate-pulse" : "bg-red-500"}`} />
            </div>

            {!connected ? (
              <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={iniciarSesion} disabled={startingConnection}><ScanQrCode className="mr-2 h-4 w-4" />{startingConnection ? "Iniciando..." : "Vincular dispositivo"}</Button>
                </DialogTrigger>
                <DialogContent className="min-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Link className="h-4 w-4" />Vincular con WhatsApp</DialogTitle>
                    <DialogDescription>Escaneá el QR para dejar tu sesión lista y persistida.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                    <div className="p-2"><Stepper orientation="vertical"><StepperNav>{steps.map((step, index) => (<StepperItem key={index} step={1} className="relative items-start not-last:flex-1"><div className="flex flex-row items-start gap-2.5 pb-7 last:pb-0"><StepperIndicator className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{index + 1}</StepperIndicator><div className="mt-1.5 text-left"><step.component /></div></div>{index < steps.length - 1 && <StepperSeparator className="absolute inset-y-0 left-3 top-7 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-5" />}</StepperItem>))}</StepperNav></Stepper></div>
                    <div className="relative flex h-[260px] items-center justify-center rounded-xl border bg-muted/20">
                      {qrUrl ? (<><img src={qrUrl} alt="QR WhatsApp" className={`h-56 w-56 rounded-md border ${status !== "desconectado" ? "blur-sm" : ""}`} />{status === "conectando" && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60"><ProgressCircle value={25} size={28} strokeWidth={3} className="animate-spin text-primary" /></div>}{status === "listo" && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60"><div className="rounded-full bg-green-500 p-2"><Check className="h-5 w-5 text-white" /></div></div>}</>) : (<ProgressCircle value={25} size={32} strokeWidth={3} className="animate-spin text-primary" />)}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={enviarMensajeTest} disabled={sendingTest}><Send className="mr-2 h-4 w-4" />{sendingTest ? "Enviando..." : "Enviar prueba"}</Button>
                <Button variant="outline" onClick={cerrarSesion} disabled={loadingConnection}><LogOut className="mr-2 h-4 w-4" />{loadingConnection ? "Cerrando..." : "Desconectar"}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Ventana de envio</CardTitle>
            <CardDescription>Define entre qué horas puede disparar mensajes automáticos el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="hora-min">Hora de inicio</Label><Input id="hora-min" type="number" min={0} max={23} value={formData.horaEnvioMinima ?? 8} onChange={(e) => handleChange("horaEnvioMinima", parseInt(e.target.value, 10))} /></div>
            <div className="space-y-2"><Label htmlFor="hora-max">Hora de cierre</Label><Input id="hora-max" type="number" min={0} max={23} value={formData.horaEnvioMaxima ?? 21} onChange={(e) => handleChange("horaEnvioMaxima", parseInt(e.target.value, 10))} /></div>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground sm:col-span-2">Recomendado: usar una ventana amplia para no acumular envíos fuera de horario.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquareText className="h-4 w-4" />Reglas de recordatorios</CardTitle>
          <CardDescription>Ajusta cuándo se envía cada mensaje y si cada regla queda activa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Recordatorio previo</p><p className="text-sm text-muted-foreground">Se envía antes del turno según la ventana configurada.</p></div><Switch checked={formData.recordatorioPrevioActivo ?? true} onCheckedChange={(value) => handleChange("recordatorioPrevioActivo", value)} /></div><div className="space-y-2"><Label htmlFor="horas-previo">Horas antes</Label><Input id="horas-previo" type="number" min={0} value={formData.horasAntesPrevio ?? 24} onChange={(e) => handleChange("horasAntesPrevio", parseInt(e.target.value, 10))} /></div></div>
            <div className="rounded-lg border p-4 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Confirmación</p><p className="text-sm text-muted-foreground">Se envía más cerca del turno y solo si el turno ya está confirmado.</p></div><Switch checked={formData.recordatorioConfirmacionActivo ?? true} onCheckedChange={(value) => handleChange("recordatorioConfirmacionActivo", value)} /></div><div className="space-y-2"><Label htmlFor="horas-confirmacion">Horas antes</Label><Input id="horas-confirmacion" type="number" min={0} value={formData.horasAntesConfirmacion ?? 1} onChange={(e) => handleChange("horasAntesConfirmacion", parseInt(e.target.value, 10))} /></div></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Reintento 1</p><p className="text-sm text-muted-foreground">Se envía si no hubo respuesta en el primer intento.</p></div><Switch checked={formData.reintento1Activo ?? true} onCheckedChange={(value) => handleChange("reintento1Activo", value)} /></div><div className="space-y-2"><Label htmlFor="min-reintento-1">Minutos después</Label><Input id="min-reintento-1" type="number" min={0} value={formData.minutosDespuesReintento1 ?? 30} onChange={(e) => handleChange("minutosDespuesReintento1", parseInt(e.target.value, 10))} /></div></div>
            <div className="rounded-lg border p-4 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Reintento 2</p><p className="text-sm text-muted-foreground">Último aviso antes de marcarlo como sin confirmar.</p></div><Switch checked={formData.reintento2Activo ?? true} onCheckedChange={(value) => handleChange("reintento2Activo", value)} /></div><div className="space-y-2"><Label htmlFor="min-reintento-2">Minutos después</Label><Input id="min-reintento-2" type="number" min={0} value={formData.minutosDespuesReintento2 ?? 60} onChange={(e) => handleChange("minutosDespuesReintento2", parseInt(e.target.value, 10))} /></div></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Auto cancelar sin respuesta</p><p className="text-sm text-muted-foreground">Cambia el turno a sin confirmar luego de esperar.</p></div><Switch checked={formData.autoCancelarSinRespuesta ?? true} onCheckedChange={(value) => handleChange("autoCancelarSinRespuesta", value)} /></div><div className="space-y-2"><Label htmlFor="espera-sin-respuesta">Minutos de espera</Label><Input id="espera-sin-respuesta" type="number" min={0} value={formData.minutosEsperaSinRespuesta ?? 120} onChange={(e) => handleChange("minutosEsperaSinRespuesta", parseInt(e.target.value, 10))} /></div></div>
            <div />
          </div>

          <div className="flex justify-end border-t pt-4"><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Guardar configuracion</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
