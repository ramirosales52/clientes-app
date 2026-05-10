import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import dayjs from 'dayjs';
import { Recordatorio, TipoRecordatorio, EstadoRecordatorio } from './entities/recordatorio.entity';
import { PlantillaMensaje } from './entities/plantilla-mensaje.entity';
import { ConfiguracionRecordatorio } from './entities/configuracion-recordatorio.entity';
import { Turno, EstadoTurno } from '../turnos/entities/turno.entity';
import { WhatsappService } from './whatsapp.service';
import { TurnoService } from '../turnos/turnos.service';

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

    @Inject(forwardRef(() => TurnoService))
    private turnoService: TurnoService,
  ) {}

  async getConfiguracion(): Promise<ConfiguracionRecordatorio> {
    let config = await this.configuracionRepository.findOne({ where: {} });
    if (!config) {
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

  async getPlantillas(): Promise<PlantillaMensaje[]> {
    await this.asegurarPlantillasBase();
    return this.plantillaRepository.find({ order: { tipo: 'ASC', nombre: 'ASC' } });
  }

  private async asegurarPlantillasBase(): Promise<void> {
    const plantillasBase: Array<Partial<PlantillaMensaje>> = [
      { nombre: 'Confirmación', tipo: TipoRecordatorio.CONFIRMACION, contenido: this.getPlantillaDefault(TipoRecordatorio.CONFIRMACION), activa: true },
      { nombre: 'Reintento 1', tipo: TipoRecordatorio.REINTENTO_1, contenido: this.getPlantillaDefault(TipoRecordatorio.REINTENTO_1), activa: true },
      { nombre: 'Reintento 2', tipo: TipoRecordatorio.REINTENTO_2, contenido: this.getPlantillaDefault(TipoRecordatorio.REINTENTO_2), activa: true },
      { nombre: 'Recordatorio final', tipo: TipoRecordatorio.PREVIO, contenido: this.getPlantillaDefault(TipoRecordatorio.PREVIO), activa: true },
    ];

    for (const plantillaBase of plantillasBase) {
      const existente = await this.plantillaRepository.findOne({
        where: { tipo: plantillaBase.tipo as TipoRecordatorio },
      });

      if (!existente) {
        await this.plantillaRepository.save(this.plantillaRepository.create(plantillaBase));
      }
    }
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

  async getRecordatorios(filtros?: {
    estado?: EstadoRecordatorio;
    tipo?: TipoRecordatorio;
    desde?: Date;
    hasta?: Date;
  }): Promise<Recordatorio[]> {
    const query = this.recordatorioRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.turno', 'turno')
      .leftJoinAndSelect('r.cliente', 'cliente')
      .leftJoinAndSelect('turno.tratamientos', 'tratamientos')
      .orderBy('r.fechaProgramada', 'DESC');

    if (filtros?.estado) query.andWhere('r.estado = :estado', { estado: filtros.estado });
    if (filtros?.tipo) query.andWhere('r.tipo = :tipo', { tipo: filtros.tipo });
    if (filtros?.desde) query.andWhere('r.fechaProgramada >= :desde', { desde: filtros.desde });
    if (filtros?.hasta) query.andWhere('r.fechaProgramada <= :hasta', { hasta: filtros.hasta });

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
    recordatorio.mensaje = this.renderizarMensajeConDatos(mensaje, recordatorio);
    return this.recordatorioRepository.save(recordatorio);
  }

  private renderizarMensajeConDatos(plantilla: string, recordatorio: Recordatorio): string {
    if (!recordatorio.turno || !recordatorio.cliente) return plantilla;

    const fechaTurno = dayjs(recordatorio.turno.fechaInicio);
    const tratamientos = recordatorio.turno.tratamientos?.map((t) => t.nombre).join(', ') || '';

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
      { estado: EstadoRecordatorio.CANCELADO },
    );
  }

  async crearRecordatoriosParaTurno(turno: Turno): Promise<Recordatorio[]> {
    const config = await this.getConfiguracion();
    const recordatorios: Recordatorio[] = [];
    const cliente = turno.cliente;
    const telefono = `549${cliente.codArea}${cliente.numero}`;
    const crear = async (tipo: TipoRecordatorio, fechaProgramada: dayjs.Dayjs) => {
      if (!fechaProgramada.isAfter(dayjs())) return;

      const mensaje = await this.renderizarMensaje(tipo, turno);
      const recordatorio = this.recordatorioRepository.create({
        turno,
        turnoId: turno.id,
        cliente,
        clienteId: cliente.id,
        tipo,
        estado: EstadoRecordatorio.PROGRAMADO,
        fechaProgramada: fechaProgramada.toDate(),
        mensaje,
        telefono,
      });

      recordatorios.push(await this.recordatorioRepository.save(recordatorio));
    };

    if (config.recordatorioConfirmacionActivo) {
      await crear(
        TipoRecordatorio.CONFIRMACION,
        dayjs(turno.fechaInicio).subtract(config.horasAntesConfirmacion, 'hour'),
      );
    }

    if (config.recordatorioPrevioActivo) {
      await crear(
        TipoRecordatorio.PREVIO,
        dayjs(turno.fechaInicio).subtract(config.horasAntesPrevio, 'hour'),
      );
    }

    const fechaBaseReintentos = dayjs(turno.fechaInicio).subtract(config.horasAntesConfirmacion, 'hour');

    if (config.reintento1Activo) {
      await crear(
        TipoRecordatorio.REINTENTO_1,
        fechaBaseReintentos.add(config.minutosDespuesReintento1, 'minute'),
      );
    }

    if (config.reintento2Activo) {
      await crear(
        TipoRecordatorio.REINTENTO_2,
        fechaBaseReintentos.add(config.minutosDespuesReintento2, 'minute'),
      );
    }

    return recordatorios;
  }

  async crearRecordatorioPrevio(turno: Turno): Promise<Recordatorio | null> {
    const config = await this.getConfiguracion();
    if (!config.recordatorioPrevioActivo) return null;

    const cliente = turno.cliente;
    const telefono = `549${cliente.codArea}${cliente.numero}`;
    const fechaProgramada = dayjs(turno.fechaInicio).subtract(config.horasAntesPrevio, 'hour');
    if (!fechaProgramada.isAfter(dayjs())) return null;

    const mensaje = await this.renderizarMensaje(TipoRecordatorio.PREVIO, turno);
    const recordatorio = this.recordatorioRepository.create({
      turno,
      turnoId: turno.id,
      cliente,
      clienteId: cliente.id,
      tipo: TipoRecordatorio.PREVIO,
      estado: EstadoRecordatorio.PROGRAMADO,
      fechaProgramada: fechaProgramada.toDate(),
      mensaje,
      telefono,
    });

    return this.recordatorioRepository.save(recordatorio);
  }

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

      const status = this.whatsappService.getStatus();
      if (!status.connected) throw new Error('WhatsApp no está conectado');

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

  private async marcarSinRespuestaVencidos(): Promise<void> {
    const config = await this.getConfiguracion();
    if (!config.autoCancelarSinRespuesta) return;

    const limite = dayjs().subtract(config.minutosEsperaSinRespuesta, 'minute');
    const candidatos = await this.recordatorioRepository.find({
      where: {
        tipo: TipoRecordatorio.REINTENTO_2,
        estado: EstadoRecordatorio.ENVIADO,
      },
      relations: ['turno'],
    });

    for (const recordatorio of candidatos) {
      if (!recordatorio.fechaEnvio || !dayjs(recordatorio.fechaEnvio).isBefore(limite)) continue;

      const turno = await this.turnoRepository.findOne({
        where: { id: recordatorio.turnoId },
        relations: ['cliente', 'tratamientos'],
      });

      if (!turno || turno.estado !== EstadoTurno.PENDIENTE) continue;

      await this.turnoService.update(turno.id, { estado: EstadoTurno.SIN_CONFIRMAR });
    }
  }

  async procesarRecordatoriosPendientes(): Promise<{ enviados: number; fallidos: number }> {
    const ahora = dayjs();

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
      if (recordatorio.tipo === TipoRecordatorio.PREVIO) {
        const turno = await this.turnoRepository.findOne({ where: { id: recordatorio.turnoId } });
        if (turno?.estado !== EstadoTurno.CONFIRMADO) {
          recordatorio.estado = EstadoRecordatorio.CANCELADO;
          await this.recordatorioRepository.save(recordatorio);
          continue;
        }
      }

      const resultado = await this.procesarEnvio(recordatorio);
      if (resultado.estado === EstadoRecordatorio.ENVIADO) enviados += 1;
      if (resultado.estado === EstadoRecordatorio.FALLIDO) fallidos += 1;
    }

    await this.marcarSinRespuestaVencidos();

    return { enviados, fallidos };
  }

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
        'periodo',
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

  private async renderizarMensaje(tipo: TipoRecordatorio, turno: Turno): Promise<string> {
    const plantilla = await this.plantillaRepository.findOne({ where: { tipo, activa: true } });
    let contenido = plantilla?.contenido || this.getPlantillaDefault(tipo);
    const fechaTurno = dayjs(turno.fechaInicio);
    const tratamientos = turno.tratamientos?.map((t) => t.nombre).join(', ') || '';

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
        return `Hola {nombre} {apellido} 👋\n\nTe recordamos que tenés un turno el día {fecha} a las {hora} para:\n👉 {tratamientos}\n\n⏰ Tenés tiempo hasta 2 horas antes para confirmar o cancelar.\n\nRespondé con:\n✅ CONFIRMAR\n❌ CANCELAR`;
      case TipoRecordatorio.REINTENTO_1:
        return `Hola {nombre} 👋\n\nTodavía no recibimos tu confirmación para el turno del {fecha} a las {hora}.\n\n👉 {tratamientos}\n\nPor favor respondé:\n✅ CONFIRMAR\n❌ CANCELAR`;
      case TipoRecordatorio.REINTENTO_2:
        return `Hola {nombre} 👋\n\nEste es el último recordatorio para tu turno del {fecha} a las {hora}.\n\nSi no confirmás, el turno puede ser cancelado automáticamente.\n\n👉 {tratamientos}\n\nRespondé:\n✅ CONFIRMAR\n❌ CANCELAR`;
      case TipoRecordatorio.PREVIO:
        return `Hola {nombre} 👋\n\nTe recordamos que tu turno para {tratamientos} es en {hora} ⏰\n\n¡Te esperamos! 😊`;
      case TipoRecordatorio.MANUAL:
        return '';
      default:
        return '';
    }
  }
}
