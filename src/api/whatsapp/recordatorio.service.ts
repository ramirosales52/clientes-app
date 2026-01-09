import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import dayjs from 'dayjs';
import { Recordatorio, TipoRecordatorio, EstadoRecordatorio } from './entities/recordatorio.entity';
import { PlantillaMensaje } from './entities/plantilla-mensaje.entity';
import { ConfiguracionRecordatorio } from './entities/configuracion-recordatorio.entity';
import { Turno, EstadoTurno } from '../turnos/entities/turno.entity';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class RecordatorioService {
  constructor(
    @InjectRepository(Recordatorio)
    private recordatorioRepository: Repository<Recordatorio>,

    @InjectRepository(PlantillaMensaje)
    private plantillaRepository: Repository<PlantillaMensaje>,

    @InjectRepository(ConfiguracionRecordatorio)
    private configuracionRepository: Repository<ConfiguracionRecordatorio>,

    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,

    private whatsappService: WhatsappService,
  ) {}

  // ============ CONFIGURACIÓN ============

  async getConfiguracion(): Promise<ConfiguracionRecordatorio> {
    let config = await this.configuracionRepository.findOne({ where: {} });
    if (!config) {
      // Crear configuración por defecto
      config = this.configuracionRepository.create({});
      await this.configuracionRepository.save(config);
    }
    return config;
  }

  async updateConfiguracion(data: Partial<ConfiguracionRecordatorio>): Promise<ConfiguracionRecordatorio> {
    const config = await this.getConfiguracion();
    Object.assign(config, data);
    return this.configuracionRepository.save(config);
  }

  // ============ PLANTILLAS ============

  async getPlantillas(): Promise<PlantillaMensaje[]> {
    return this.plantillaRepository.find({ order: { tipo: 'ASC', nombre: 'ASC' } });
  }

  async getPlantilla(id: string): Promise<PlantillaMensaje> {
    const plantilla = await this.plantillaRepository.findOne({ where: { id } });
    if (!plantilla) throw new NotFoundException('Plantilla no encontrada');
    return plantilla;
  }

  async createPlantilla(data: Partial<PlantillaMensaje>): Promise<PlantillaMensaje> {
    const plantilla = this.plantillaRepository.create(data);
    return this.plantillaRepository.save(plantilla);
  }

  async updatePlantilla(id: string, data: Partial<PlantillaMensaje>): Promise<PlantillaMensaje> {
    const plantilla = await this.getPlantilla(id);
    Object.assign(plantilla, data);
    return this.plantillaRepository.save(plantilla);
  }

  async deletePlantilla(id: string): Promise<void> {
    const result = await this.plantillaRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Plantilla no encontrada');
  }

  // ============ RECORDATORIOS ============

  async getRecordatorios(filtros?: {
    estado?: EstadoRecordatorio;
    tipo?: TipoRecordatorio;
    desde?: Date;
    hasta?: Date;
  }): Promise<Recordatorio[]> {
    const query = this.recordatorioRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.turno', 'turno')
      .leftJoinAndSelect('r.cliente', 'cliente')
      .leftJoinAndSelect('turno.tratamientos', 'tratamientos')
      .orderBy('r.fechaProgramada', 'DESC');

    if (filtros?.estado) {
      query.andWhere('r.estado = :estado', { estado: filtros.estado });
    }
    if (filtros?.tipo) {
      query.andWhere('r.tipo = :tipo', { tipo: filtros.tipo });
    }
    if (filtros?.desde) {
      query.andWhere('r.fechaProgramada >= :desde', { desde: filtros.desde });
    }
    if (filtros?.hasta) {
      query.andWhere('r.fechaProgramada <= :hasta', { hasta: filtros.hasta });
    }

    return query.getMany();
  }

  async getRecordatorio(id: string): Promise<Recordatorio> {
    const recordatorio = await this.recordatorioRepository.findOne({
      where: { id },
      relations: ['turno', 'cliente', 'turno.tratamientos'],
    });
    if (!recordatorio) throw new NotFoundException('Recordatorio no encontrado');
    return recordatorio;
  }

  async cancelarRecordatorio(id: string): Promise<Recordatorio> {
    const recordatorio = await this.getRecordatorio(id);
    recordatorio.estado = EstadoRecordatorio.CANCELADO;
    return this.recordatorioRepository.save(recordatorio);
  }

  async actualizarMensaje(id: string, mensaje: string): Promise<Recordatorio> {
    const recordatorio = await this.getRecordatorio(id);
    
    // Re-renderizar el mensaje reemplazando variables con valores reales
    const mensajeRenderizado = this.renderizarMensajeConDatos(mensaje, recordatorio);
    recordatorio.mensaje = mensajeRenderizado;
    
    return this.recordatorioRepository.save(recordatorio);
  }

  /**
   * Renderiza un mensaje reemplazando las variables con los datos del recordatorio
   */
  private renderizarMensajeConDatos(plantilla: string, recordatorio: Recordatorio): string {
    if (!recordatorio.turno || !recordatorio.cliente) return plantilla;

    const fechaTurno = dayjs(recordatorio.turno.fechaInicio);
    const tratamientos = recordatorio.turno.tratamientos?.map(t => t.nombre).join(', ') || '';

    return plantilla
      .replace(/{nombre}/g, recordatorio.cliente.nombre)
      .replace(/{apellido}/g, recordatorio.cliente.apellido)
      .replace(/{fecha}/g, fechaTurno.format('dddd D [de] MMMM'))
      .replace(/{hora}/g, fechaTurno.format('HH:mm'))
      .replace(/{tratamientos}/g, tratamientos);
  }

  async cancelarRecordatoriosPorTurno(turnoId: string): Promise<void> {
    await this.recordatorioRepository.update(
      { turnoId, estado: EstadoRecordatorio.PROGRAMADO },
      { estado: EstadoRecordatorio.CANCELADO }
    );
  }

  // ============ CREACIÓN AUTOMÁTICA ============

  /**
   * Al crear un turno, solo se crea el recordatorio de CONFIRMACIÓN.
   * El recordatorio PREVIO se crea cuando el cliente confirma.
   */
  async crearRecordatoriosParaTurno(turno: Turno): Promise<Recordatorio[]> {
    const config = await this.getConfiguracion();
    const recordatorios: Recordatorio[] = [];

    const cliente = turno.cliente;
    const telefono = `549${cliente.codArea}${cliente.numero}`;

    // Solo crear recordatorio de confirmación (24h antes por defecto)
    if (config.recordatorioConfirmacionActivo) {
      const fechaProgramada = dayjs(turno.fechaInicio)
        .subtract(config.horasAntesPrevio, 'hour')
        .toDate();

      if (dayjs(fechaProgramada).isAfter(dayjs())) {
        const mensaje = await this.renderizarMensaje(TipoRecordatorio.CONFIRMACION, turno);
        const recordatorio = this.recordatorioRepository.create({
          turno,
          turnoId: turno.id,
          cliente,
          clienteId: cliente.id,
          tipo: TipoRecordatorio.CONFIRMACION,
          estado: EstadoRecordatorio.PROGRAMADO,
          fechaProgramada,
          mensaje,
          telefono,
        });
        recordatorios.push(await this.recordatorioRepository.save(recordatorio));
      }
    }

    return recordatorios;
  }

  /**
   * Crea el recordatorio previo (1h antes) cuando el cliente confirma el turno.
   */
  async crearRecordatorioPrevio(turno: Turno): Promise<Recordatorio | null> {
    const config = await this.getConfiguracion();

    if (!config.recordatorioPrevioActivo) return null;

    const cliente = turno.cliente;
    const telefono = `549${cliente.codArea}${cliente.numero}`;

    const fechaProgramada = dayjs(turno.fechaInicio)
      .subtract(config.horasAntesConfirmacion, 'hour')
      .toDate();

    // Solo crear si la fecha es futura
    if (!dayjs(fechaProgramada).isAfter(dayjs())) return null;

    const mensaje = await this.renderizarMensaje(TipoRecordatorio.PREVIO, turno);
    const recordatorio = this.recordatorioRepository.create({
      turno,
      turnoId: turno.id,
      cliente,
      clienteId: cliente.id,
      tipo: TipoRecordatorio.PREVIO,
      estado: EstadoRecordatorio.PROGRAMADO,
      fechaProgramada,
      mensaje,
      telefono,
    });

    return this.recordatorioRepository.save(recordatorio);
  }

  // ============ ENVÍO ============

  async enviarRecordatorio(id: string): Promise<Recordatorio> {
    const recordatorio = await this.getRecordatorio(id);
    return this.procesarEnvio(recordatorio);
  }

  async enviarMensajeManual(turnoId: string, mensaje: string): Promise<Recordatorio> {
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['cliente'],
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    const cliente = turno.cliente;
    const telefono = `549${cliente.codArea}${cliente.numero}`;

    const recordatorio = this.recordatorioRepository.create({
      turno,
      turnoId: turno.id,
      cliente,
      clienteId: cliente.id,
      tipo: TipoRecordatorio.MANUAL,
      estado: EstadoRecordatorio.PROGRAMADO,
      fechaProgramada: new Date(),
      mensaje,
      telefono,
    });

    await this.recordatorioRepository.save(recordatorio);
    return this.procesarEnvio(recordatorio);
  }

  private async procesarEnvio(recordatorio: Recordatorio): Promise<Recordatorio> {
    const config = await this.getConfiguracion();

    try {
      recordatorio.intentos += 1;

      // Verificar estado de WhatsApp
      const status = this.whatsappService.getStatus();
      if (!status.ready) {
        throw new Error('WhatsApp no está conectado');
      }

      // Enviar mensaje
      await this.whatsappService.sendMessage(recordatorio.telefono, recordatorio.mensaje);

      recordatorio.estado = EstadoRecordatorio.ENVIADO;
      recordatorio.fechaEnvio = new Date();
      recordatorio.error = null;
    } catch (error: any) {
      recordatorio.error = error.message || 'Error desconocido';

      if (recordatorio.intentos >= config.maxReintentos) {
        recordatorio.estado = EstadoRecordatorio.FALLIDO;
      }
    }

    return this.recordatorioRepository.save(recordatorio);
  }

  async procesarRecordatoriosPendientes(): Promise<{ enviados: number; fallidos: number }> {
    const config = await this.getConfiguracion();
    const ahora = dayjs();

    // Verificar horario permitido
    const horaActual = ahora.hour();
    if (horaActual < config.horaEnvioMinima || horaActual >= config.horaEnvioMaxima) {
      return { enviados: 0, fallidos: 0 };
    }

    // Buscar recordatorios pendientes cuya fecha ya pasó
    const pendientes = await this.recordatorioRepository.find({
      where: {
        estado: EstadoRecordatorio.PROGRAMADO,
        fechaProgramada: LessThanOrEqual(ahora.toDate()),
      },
      relations: ['turno', 'cliente'],
    });

    let enviados = 0;
    let fallidos = 0;

    for (const recordatorio of pendientes) {
      // Para recordatorios de confirmación, verificar que el turno esté confirmado
      if (recordatorio.tipo === TipoRecordatorio.CONFIRMACION) {
        const turno = await this.turnoRepository.findOne({ where: { id: recordatorio.turnoId } });
        if (turno?.estado !== EstadoTurno.CONFIRMADO) {
          // Cancelar si no está confirmado
          recordatorio.estado = EstadoRecordatorio.CANCELADO;
          await this.recordatorioRepository.save(recordatorio);
          continue;
        }
      }

      const resultado = await this.procesarEnvio(recordatorio);
      if (resultado.estado === EstadoRecordatorio.ENVIADO) {
        enviados++;
      } else if (resultado.estado === EstadoRecordatorio.FALLIDO) {
        fallidos++;
      }
    }

    return { enviados, fallidos };
  }

  // ============ ESTADÍSTICAS ============

  async getEstadisticas(): Promise<{
    hoy: { enviados: number; pendientes: number; fallidos: number };
    semana: { enviados: number; pendientes: number; fallidos: number };
    total: { enviados: number; pendientes: number; fallidos: number };
  }> {
    const hoyInicio = dayjs().startOf('day').toDate();
    const hoyFin = dayjs().endOf('day').toDate();
    const semanaInicio = dayjs().startOf('week').toDate();

    const stats = await this.recordatorioRepository
      .createQueryBuilder('r')
      .select('r.estado', 'estado')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `CASE 
          WHEN r.fechaProgramada >= :hoyInicio AND r.fechaProgramada <= :hoyFin THEN 'hoy'
          WHEN r.fechaProgramada >= :semanaInicio THEN 'semana'
          ELSE 'anterior'
        END`,
        'periodo'
      )
      .setParameters({ hoyInicio, hoyFin, semanaInicio })
      .groupBy('r.estado')
      .addGroupBy('periodo')
      .getRawMany();

    const resultado = {
      hoy: { enviados: 0, pendientes: 0, fallidos: 0 },
      semana: { enviados: 0, pendientes: 0, fallidos: 0 },
      total: { enviados: 0, pendientes: 0, fallidos: 0 },
    };

    for (const stat of stats) {
      const count = parseInt(stat.count, 10);
      const periodo = stat.periodo as 'hoy' | 'semana' | 'anterior';
      const estado = stat.estado as EstadoRecordatorio;

      if (estado === EstadoRecordatorio.ENVIADO) {
        resultado.total.enviados += count;
        if (periodo === 'hoy') resultado.hoy.enviados += count;
        if (periodo === 'hoy' || periodo === 'semana') resultado.semana.enviados += count;
      } else if (estado === EstadoRecordatorio.PROGRAMADO) {
        resultado.total.pendientes += count;
        if (periodo === 'hoy') resultado.hoy.pendientes += count;
        if (periodo === 'hoy' || periodo === 'semana') resultado.semana.pendientes += count;
      } else if (estado === EstadoRecordatorio.FALLIDO) {
        resultado.total.fallidos += count;
        if (periodo === 'hoy') resultado.hoy.fallidos += count;
        if (periodo === 'hoy' || periodo === 'semana') resultado.semana.fallidos += count;
      }
    }

    return resultado;
  }

  // ============ RENDERIZADO DE MENSAJES ============

  private async renderizarMensaje(tipo: TipoRecordatorio, turno: Turno): Promise<string> {
    // Buscar plantilla activa para el tipo
    const plantilla = await this.plantillaRepository.findOne({
      where: { tipo, activa: true },
    });

    let contenido = plantilla?.contenido || this.getPlantillaDefault(tipo);

    // Reemplazar variables
    const fechaTurno = dayjs(turno.fechaInicio);
    const tratamientos = turno.tratamientos?.map(t => t.nombre).join(', ') || '';

    contenido = contenido
      .replace(/{nombre}/g, turno.cliente.nombre)
      .replace(/{apellido}/g, turno.cliente.apellido)
      .replace(/{fecha}/g, fechaTurno.format('dddd D [de] MMMM'))
      .replace(/{hora}/g, fechaTurno.format('HH:mm'))
      .replace(/{tratamientos}/g, tratamientos);

    return contenido;
  }

  private getPlantillaDefault(tipo: TipoRecordatorio): string {
    switch (tipo) {
      case TipoRecordatorio.CONFIRMACION:
        return `Hola {nombre}! Tenés un turno agendado para el {fecha} a las {hora}.

Tratamientos: {tratamientos}

Respondé *Confirmar* para confirmar tu asistencia o *Cancelar* si no podés asistir.`;
      case TipoRecordatorio.PREVIO:
        return 'Hola {nombre}! Te recordamos que tu turno es hoy a las {hora}. Tratamientos: {tratamientos}. Te esperamos!';
      case TipoRecordatorio.MANUAL:
        return '';
      default:
        return '';
    }
  }
}
