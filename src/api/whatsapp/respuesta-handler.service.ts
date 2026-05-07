import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Recordatorio, TipoRecordatorio, EstadoRecordatorio } from './entities/recordatorio.entity';
import { EstadoTurno, Turno } from '../turnos/entities/turno.entity';
import { WhatsappService } from './whatsapp.service';
import { TurnoService } from '../turnos/turnos.service';

function normalizarTelefono(valor: string): string {
  return valor.replace(/\D/g, '');
}

function coincideTelefonoWhatsapp(entrada: string, guardado: string): boolean {
  const telefonoEntrada = normalizarTelefono(entrada);
  const telefonoGuardado = normalizarTelefono(guardado);

  if (!telefonoEntrada || !telefonoGuardado) return false;
  if (telefonoEntrada === telefonoGuardado) return true;

  // WhatsApp puede devolver variantes del prefijo argentino con o sin 9.
  return (
    telefonoEntrada.replace(/^549/, '54') === telefonoGuardado.replace(/^549/, '54') ||
    telefonoEntrada.replace(/^54(?!9)/, '549') === telefonoGuardado ||
    telefonoGuardado.replace(/^54(?!9)/, '549') === telefonoEntrada
  );
}

@Injectable()
export class RespuestaHandlerService implements OnModuleInit {
  private readonly logger = new Logger(RespuestaHandlerService.name);

  constructor(
    @InjectRepository(Recordatorio)
    private recordatorioRepository: Repository<Recordatorio>,
    private whatsappService: WhatsappService,
    private turnoService: TurnoService,
  ) { }

  onModuleInit() {
    // Registrar handler de mensajes de texto
    this.whatsappService.onMessage((telefono, mensaje) =>
      this.procesarMensaje(telefono, mensaje)
    );
    this.logger.log('Handler de respuestas WhatsApp registrado');
  }

  /**
   * Procesa un mensaje de texto entrante de WhatsApp.
   */
  async procesarMensaje(telefono: string, mensaje: string): Promise<void> {
    this.logger.debug(`Mensaje entrante para evaluar: ${telefono} -> ${mensaje}`);
    const respuesta = this.normalizarRespuesta(mensaje);

    if (!respuesta) {
      return;
    }

    const recordatorios = await this.recordatorioRepository.find({
      where: {
        tipo: In([
          TipoRecordatorio.CONFIRMACION,
          TipoRecordatorio.REINTENTO_1,
          TipoRecordatorio.REINTENTO_2,
          TipoRecordatorio.PREVIO,
          TipoRecordatorio.MANUAL,
        ]),
        estado: EstadoRecordatorio.ENVIADO,
      },
      relations: ['turno', 'turno.cliente', 'turno.tratamientos', 'cliente'],
      order: { fechaEnvio: 'DESC' },
    });

    const recordatorio = recordatorios.find(
      (item) =>
        coincideTelefonoWhatsapp(telefono, item.telefono) &&
        item.turno?.estado === EstadoTurno.PENDIENTE,
    );

    let turno = recordatorio?.turno ?? null;

    if (!turno || turno.estado !== EstadoTurno.PENDIENTE) {
      this.logger.debug(
        `No hay recordatorio utilizable para ${telefono}. Candidatos: ${recordatorios
          .filter((item) => coincideTelefonoWhatsapp(telefono, item.telefono))
          .map((item) => `${item.id}:${item.turnoId}:${item.turno?.estado}`)
          .join(', ') || 'ninguno'}`,
      );

      turno = await this.turnoService.findLastPendienteByTelefono(telefono);
      if (!turno) {
        const turnos = await this.turnoService.findAll();
        turno = turnos.find((item) => item.estado === EstadoTurno.PENDIENTE) ?? null;
      }
      if (!turno) return;
    }

    if (respuesta === 'confirmar') {
      await this.confirmarTurno(turno, telefono);
    } else {
      await this.cancelarTurno(turno, telefono);
    }
  }

  private normalizarRespuesta(mensaje: string): 'confirmar' | 'cancelar' | null {
    const texto = mensaje
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (/^(confirmar|confirmo|confirmado|si|ok|dale|perfecto|de una)$/.test(texto)) {
      return 'confirmar';
    }

    if (/^(cancelar|cancelo|cancelado|no|no puedo)$/.test(texto)) {
      return 'cancelar';
    }

    return null;
  }

  private async confirmarTurno(turno: Turno, telefono: string): Promise<void> {
    this.logger.log(`Confirmando turno ${turno.id} desde WhatsApp`);

    await this.turnoService.update(turno.id, { estado: EstadoTurno.CONFIRMADO });
    await this.recordatorioRepository.update(
      { turnoId: turno.id, estado: EstadoRecordatorio.PROGRAMADO },
      { estado: EstadoRecordatorio.CANCELADO },
    );

    // Enviar mensaje de confirmación
    await this.whatsappService.sendMessage(
      telefono,
      `Perfecto ${turno.cliente.nombre} 🙌\n\nTu turno para el ${new Date(turno.fechaInicio).toLocaleDateString('es-AR')} a las ${new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} quedó confirmado.\n\nTe esperamos 😊`
    );
  }

  private async cancelarTurno(turno: Turno, telefono: string): Promise<void> {
    this.logger.log(`Cancelando turno ${turno.id} desde WhatsApp`);

    await this.turnoService.update(turno.id, { estado: EstadoTurno.CANCELADO });
    await this.recordatorioRepository.update(
      { turnoId: turno.id, estado: EstadoRecordatorio.PROGRAMADO },
      { estado: EstadoRecordatorio.CANCELADO },
    );

    // Enviar mensaje de cancelación
    await this.whatsappService.sendMessage(
      telefono,
      `Hola ${turno.cliente.nombre} 👋\n\nTu turno para el ${new Date(turno.fechaInicio).toLocaleDateString('es-AR')} a las ${new Date(turno.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} fue cancelado.\n\nSi querés, podés agendar otro turno más adelante 😊`
    );
  }
}
