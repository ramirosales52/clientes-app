import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recordatorio, TipoRecordatorio, EstadoRecordatorio } from './entities/recordatorio.entity';
import { Turno, EstadoTurno } from '../turnos/entities/turno.entity';
import { RecordatorioService } from './recordatorio.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class RespuestaHandlerService implements OnModuleInit {
  private readonly logger = new Logger(RespuestaHandlerService.name);

  constructor(
    @InjectRepository(Recordatorio)
    private recordatorioRepository: Repository<Recordatorio>,

    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,

    private recordatorioService: RecordatorioService,
    private whatsappService: WhatsappService,
  ) {}

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
    const respuesta = this.normalizarRespuesta(mensaje);
    
    if (!respuesta) {
      return;
    }

    // Buscar recordatorio de confirmación enviado a este número
    const recordatorio = await this.recordatorioRepository.findOne({
      where: {
        telefono,
        tipo: TipoRecordatorio.CONFIRMACION,
        estado: EstadoRecordatorio.ENVIADO,
      },
      relations: ['turno', 'turno.cliente', 'turno.tratamientos', 'cliente'],
      order: { fechaEnvio: 'DESC' },
    });

    if (!recordatorio) {
      this.logger.debug(`No hay recordatorio pendiente para ${telefono}`);
      return;
    }

    const turno = recordatorio.turno;
    if (!turno || turno.estado !== EstadoTurno.PENDIENTE) {
      this.logger.debug(`Turno no encontrado o ya procesado para ${telefono}`);
      return;
    }

    if (respuesta === 'confirmar') {
      await this.confirmarTurno(turno, telefono);
    } else {
      await this.cancelarTurno(turno, telefono);
    }
  }

  private normalizarRespuesta(mensaje: string): 'confirmar' | 'cancelar' | null {
    const texto = mensaje.toLowerCase().trim();
    
    if (texto === 'confirmar' || texto === 'confirmo' || texto === 'si' || texto === 'sí') {
      return 'confirmar';
    }
    
    if (texto === 'cancelar' || texto === 'cancelo' || texto === 'no') {
      return 'cancelar';
    }
    
    return null;
  }

  private async confirmarTurno(turno: Turno, telefono: string): Promise<void> {
    this.logger.log(`Confirmando turno ${turno.id} desde WhatsApp`);

    // Actualizar estado del turno
    turno.estado = EstadoTurno.CONFIRMADO;
    await this.turnoRepository.save(turno);

    // Cargar turno completo con relaciones para el recordatorio
    const turnoCompleto = await this.turnoRepository.findOne({
      where: { id: turno.id },
      relations: ['cliente', 'tratamientos'],
    });

    if (turnoCompleto) {
      // Crear recordatorio previo (1h antes)
      await this.recordatorioService.crearRecordatorioPrevio(turnoCompleto);
    }

    // Enviar mensaje de confirmación
    await this.whatsappService.sendMessage(
      telefono,
      'Perfecto! Tu turno ha sido confirmado. Te enviaremos un recordatorio antes de la cita. Gracias!'
    );
  }

  private async cancelarTurno(turno: Turno, telefono: string): Promise<void> {
    this.logger.log(`Cancelando turno ${turno.id} desde WhatsApp`);

    // Actualizar estado del turno
    turno.estado = EstadoTurno.CANCELADO;
    await this.turnoRepository.save(turno);

    // Cancelar recordatorios pendientes
    await this.recordatorioService.cancelarRecordatoriosPorTurno(turno.id);

    // Enviar mensaje de cancelación
    await this.whatsappService.sendMessage(
      telefono,
      'Tu turno ha sido cancelado. Si necesitás reagendar, contactanos. Gracias!'
    );
  }
}
