import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { BrowserWindow } from 'electron';
import { Turno, EstadoTurno } from './entities/turno.entity';
import { HistorialEstadoTurno } from './entities/historial-estado.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { RecordatorioService } from '../whatsapp/recordatorio.service';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';
import {
  calcularCostoHistoricoTratamiento,
  calcularCostoHistoricoTurno,
} from '../tratamientos/costo-historico';

dayjs.extend(isSameOrBefore);

type Interval = { inicio: dayjs.Dayjs; fin: dayjs.Dayjs };
export type DisponibilidadCard = { horaInicio: string; horaFin: string };

const ESTADOS_OCUPAN_HORARIO = new Set<EstadoTurno>([
  EstadoTurno.PENDIENTE,
  EstadoTurno.CONFIRMADO,
  EstadoTurno.SIN_CONFIRMAR,
]);

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,

    @InjectRepository(Tratamiento)
    private tratamientoRepository: Repository<Tratamiento>,

    @InjectRepository(HistorialEstadoTurno)
    private historialRepository: Repository<HistorialEstadoTurno>,

    @Inject(forwardRef(() => RecordatorioService))
    private recordatorioService: RecordatorioService,
  ) { }

  private calcularCostoTotalTurno(turno: Pick<Turno, 'tratamientos' | 'fechaInicio'>): number {
    return calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
  }

  private normalizarTelefono(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private coincideTelefonoWhatsapp(entrada: string, codArea: string, numero: string): boolean {
    const telefonoEntrada = this.normalizarTelefono(entrada);
    const telefonoGuardado = this.normalizarTelefono(`549${codArea}${numero}`);

    if (!telefonoEntrada || !telefonoGuardado) return false;
    if (telefonoEntrada === telefonoGuardado) return true;

    return (
      telefonoEntrada.replace(/^549/, '54') === telefonoGuardado.replace(/^549/, '54') ||
      telefonoEntrada.replace(/^54(?!9)/, '549') === telefonoGuardado ||
      telefonoGuardado.replace(/^54(?!9)/, '549') === telefonoEntrada
    );
  }

  private async cargarTratamientosHistoricos(ids: string[]): Promise<Tratamiento[]> {
    const tratamientos = await Promise.all(
      ids.map((id) =>
        this.tratamientoRepository.findOne({
          where: { id },
          relations: ['historialPrecios'],
        }),
      ),
    );

    const encontrados = tratamientos.filter((tratamiento): tratamiento is Tratamiento => Boolean(tratamiento));

    if (encontrados.length !== ids.length) {
      throw new NotFoundException('Uno o más tratamientos no existen');
    }

    return ids.map((id) => encontrados.find((tratamiento) => tratamiento.id === id)!);
  }

  private async turnoSuperpuesto(
    fechaInicio: Date,
    fechaFin: Date,
    excluirTurnoId?: string,
  ): Promise<Turno | null> {
    return this.turnoRepository.findOne({
      where: {
        ...(excluirTurnoId ? { id: Not(excluirTurnoId) } : {}),
        fechaInicio: LessThan(fechaFin),
        fechaFin: MoreThan(fechaInicio),
        estado: In(['pendiente', 'confirmado', 'sin_confirmar']),
      },
    });
  }

  private estadoOcupaHorario(estado: EstadoTurno): boolean {
    return ESTADOS_OCUPAN_HORARIO.has(estado);
  }

  private estadoRequiereRecordatorios(estado: EstadoTurno): boolean {
    return estado === EstadoTurno.PENDIENTE || estado === EstadoTurno.CONFIRMADO;
  }

  private async sincronizarRecordatoriosTurno(turno: Turno): Promise<void> {
    await this.recordatorioService.cancelarRecordatoriosPorTurno(turno.id);

    if (turno.estado === EstadoTurno.CONFIRMADO) {
      await this.recordatorioService.crearRecordatorioPrevio(turno);
      return;
    }

    if (this.estadoRequiereRecordatorios(turno.estado)) {
      await this.recordatorioService.crearRecordatoriosParaTurno(turno);
    }
  }

  private async validarDisponibilidadTurno(
    fechaInicio: Date,
    fechaFin: Date,
    excluirTurnoId: string,
  ): Promise<void> {
    const overlapping = await this.turnoSuperpuesto(fechaInicio, fechaFin, excluirTurnoId);

    if (overlapping) {
      throw new BadRequestException('El turno se superpone con otro ya existente');
    }
  }

  private congelarTratamientosTurno(turno: Turno): Turno {
    if (turno.tratamientosSnapshot?.length) {
      turno.tratamientos = turno.tratamientosSnapshot.map((tratamiento) => ({
        id: tratamiento.id,
        nombre: tratamiento.nombre,
        costo: tratamiento.costo,
        duracion: tratamiento.duracion,
      })) as Tratamiento[];

      return turno;
    }

    const tratamientosCongelados = turno.tratamientos.map((tratamiento) => {
      const costoHistorico = calcularCostoHistoricoTratamiento(tratamiento, turno.fechaInicio);

      return {
        ...tratamiento,
        costo: costoHistorico,
        costoHistorico,
      };
    });

    turno.tratamientos = tratamientosCongelados;
    turno.tratamientosSnapshot = tratamientosCongelados.map((tratamiento) => ({
      id: tratamiento.id,
      nombre: tratamiento.nombre,
      costo: tratamiento.costo,
      duracion: tratamiento.duracion,
    }));

    turno.costoTotal = this.calcularCostoTotalTurno({
      tratamientos: tratamientosCongelados,
      fechaInicio: turno.fechaInicio,
    });

    return turno;
  }

  async create(createTurnoDto: CreateTurnoDto): Promise<Turno> {
    const fechaInicio = new Date(createTurnoDto.fechaInicio);
    const fechaFin = new Date(createTurnoDto.fechaFin);

    const overlapping = await this.turnoSuperpuesto(fechaInicio, fechaFin);

    if (overlapping) {
      throw new BadRequestException('El turno se superpone con otro ya existente');
    }

    const cliente = await this.clienteRepository.findOneBy({
      id: createTurnoDto.clienteId,
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tratamientos = await this.cargarTratamientosHistoricos(createTurnoDto.tratamientosIds);

    const turno = this.turnoRepository.create({
      ...createTurnoDto,
      fechaInicio,
      fechaFin,
      cliente,
      tratamientos,
      tratamientosSnapshot: tratamientos.map((tratamiento) => ({
        id: tratamiento.id,
        nombre: tratamiento.nombre,
        costo: calcularCostoHistoricoTratamiento(tratamiento, fechaInicio),
        duracion: tratamiento.duracion,
      })),
      costoTotal: this.calcularCostoTotalTurno({ tratamientos, fechaInicio }),
    });

    const saved = await this.turnoRepository.save(turno);

    // Registrar estado inicial en historial
    await this.registrarCambioEstado(saved, null, EstadoTurno.PENDIENTE);

    // Obtener turno completo con relaciones para crear recordatorios
    const turnoCompleto = await this.findOne(saved.id);

    // Crear recordatorios automáticos de WhatsApp
    if (turnoCompleto.estado === EstadoTurno.CONFIRMADO) {
      await this.recordatorioService.crearRecordatorioPrevio(turnoCompleto);
    } else {
      await this.recordatorioService.crearRecordatoriosParaTurno(turnoCompleto);
    }
    this.notificarTurnosActualizados();

    return turnoCompleto;
  }

  private async registrarCambioEstado(
    turno: Turno,
    estadoAnterior: EstadoTurno | null,
    estadoNuevo: EstadoTurno,
  ): Promise<void> {
    const historial = this.historialRepository.create({
      turno,
      estadoAnterior,
      estadoNuevo,
    });
    await this.historialRepository.save(historial);
  }

  private notificarTurnosActualizados(): void {
    for (const ventana of BrowserWindow.getAllWindows()) {
      ventana.webContents.send('turnos:actualizados');
    }
  }

  private async asegurarCostoTotal(turno: Turno): Promise<Turno> {
    if (turno.costoTotal != null) return turno;

    const costoTotal = this.calcularCostoTotalTurno(turno);
    turno.costoTotal = costoTotal;
    await this.turnoRepository.save(turno);

    return turno;
  }

  private bloquesTrabajo(fecha: string): Interval[] {
    return [
      { inicio: dayjs(`${fecha} 08:00`), fin: dayjs(`${fecha} 12:00`) },
      { inicio: dayjs(`${fecha} 15:00`), fin: dayjs(`${fecha} 19:00`) },
    ];
  }

  private mergeIntervals(intervals: Interval[]): Interval[] {
    if (!intervals.length) return [];
    intervals.sort((a, b) => a.inicio.valueOf() - b.inicio.valueOf());
    const merged: Interval[] = [];
    let current = { ...intervals[0] };
    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (!current.fin.isBefore(next.inicio)) {
        if (next.fin.isAfter(current.fin)) current.fin = next.fin;
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  }

  private subtractOccupiedFromBlock(block: Interval, ocupados: Interval[]): Interval[] {
    const relevant = ocupados.filter(o => o.fin.isAfter(block.inicio) && o.inicio.isBefore(block.fin));
    if (relevant.length === 0) return [{ inicio: block.inicio, fin: block.fin }];

    const recortados = relevant.map(o => ({
      inicio: o.inicio.isBefore(block.inicio) ? block.inicio : o.inicio,
      fin: o.fin.isAfter(block.fin) ? block.fin : o.fin,
    }));
    const merged = this.mergeIntervals(recortados);

    const libres: Interval[] = [];
    let cursor = block.inicio;

    for (const m of merged) {
      if (cursor.isBefore(m.inicio)) {
        libres.push({ inicio: cursor, fin: m.inicio });
      }
      cursor = m.fin;
    }

    if (cursor.isBefore(block.fin)) {
      libres.push({ inicio: cursor, fin: block.fin });
    }

    return libres;
  }

  async obtenerDisponibilidades(fecha: string, duracionMinutos: number): Promise<DisponibilidadCard[]> {
    if (duracionMinutos <= 0 || duracionMinutos % 30 !== 0) {
      throw new Error('Duración debe ser múltiplo de 30 minutos y mayor a 0');
    }

    // Traer turnos ocupados del día filtrando por fecha
    const inicioDia = dayjs(`${fecha} 00:00`).toDate();
    const finDia = dayjs(`${fecha} 23:59`).toDate();

    const turnosOcupados = await this.turnoRepository.find({
      where: {
        fechaInicio: Between(inicioDia, finDia),
      },
      order: { fechaInicio: 'ASC' },
    });

    // Mapear a intervals usando directamente los Date de la DB
    const ocupados: Interval[] = turnosOcupados.map(t => ({
      inicio: dayjs(t.fechaInicio),
      fin: dayjs(t.fechaFin),
    }));

    const ocupadosMerged = this.mergeIntervals(ocupados);
    const resultados: DisponibilidadCard[] = [];
    const bloques = this.bloquesTrabajo(fecha);

    for (const bloque of bloques) {
      const libres = this.subtractOccupiedFromBlock(bloque, ocupadosMerged);

      for (const libre of libres) {
        let inicioPropuesto = libre.inicio;
        while (inicioPropuesto.add(duracionMinutos, 'minute').isSameOrBefore(libre.fin)) {
          const finPropuesto = inicioPropuesto.add(duracionMinutos, 'minute');
          if (finPropuesto.isSameOrBefore(bloque.fin)) {
            resultados.push({
              horaInicio: inicioPropuesto.format('HH:mm'),
              horaFin: finPropuesto.format('HH:mm'),
            });
          }
          inicioPropuesto = inicioPropuesto.add(30, 'minute');
        }
      }
    }

    return resultados;
  }

  async obtenerHorasOcupadas(fecha: string): Promise<{ ocupadas: [string, string][] }> {
    const inicioDia = dayjs(`${fecha} 00:00`).toDate();
    const finDia = dayjs(`${fecha} 23:59`).toDate();

    const turnosOcupados = await this.turnoRepository.find({
      where: {
        fechaInicio: Between(inicioDia, finDia),
        estado: In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO]),
      },
      order: { fechaInicio: 'ASC' },
    });

    const ocupadas: [string, string][] = turnosOcupados.map(t => [
      dayjs(t.fechaInicio).format('HH:mm'),
      dayjs(t.fechaFin).format('HH:mm'),
    ]);

    return { ocupadas };
  }

  findAll(): Promise<Turno[]> {
    return this.turnoRepository.find({
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos', 'historialEstados'],
    }).then(async (turnos) => Promise.all(turnos.map(async (turno) => this.congelarTratamientosTurno(await this.asegurarCostoTotal(turno)))));
  }

  async findOne(id: string): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos', 'historialEstados'],
    });

    if (!turno) throw new NotFoundException('Turno no encontrado');
    return this.congelarTratamientosTurno(await this.asegurarCostoTotal(turno));
  }

  async findLastPendienteByTelefono(telefono: string): Promise<Turno | null> {
    const turnos = await this.turnoRepository.find({
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos', 'historialEstados'],
      order: { fechaInicio: 'DESC' },
    });

    const turno = turnos.find((item) => {
      return (
        item.estado === EstadoTurno.PENDIENTE &&
        this.coincideTelefonoWhatsapp(telefono, item.cliente.codArea, item.cliente.numero)
      );
    });

    return turno ? this.congelarTratamientosTurno(await this.asegurarCostoTotal(turno)) : null;
  }

  async update(id: string, dto: UpdateTurnoDto): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios'],
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    const estadoAnterior = turno.estado;
    const fechaInicioAnterior = turno.fechaInicio;
    const fechaFinAnterior = turno.fechaFin;
    const clienteAnteriorId = turno.cliente.id;
    const tratamientosAnterioresIds = turno.tratamientos.map((tratamiento) => tratamiento.id);

    const fechaInicioNueva = dto.fechaInicio ? new Date(dto.fechaInicio) : turno.fechaInicio;
    const fechaFinNueva = dto.fechaFin ? new Date(dto.fechaFin) : turno.fechaFin;
    const fechaCambiada =
      fechaInicioNueva.getTime() !== fechaInicioAnterior.getTime() ||
      fechaFinNueva.getTime() !== fechaFinAnterior.getTime();
    const clienteCambiado = dto.clienteId ? dto.clienteId !== clienteAnteriorId : false;
    const tratamientosCambiados =
      Array.isArray(dto.tratamientosIds) &&
      (dto.tratamientosIds.length !== tratamientosAnterioresIds.length ||
        dto.tratamientosIds.some((id, index) => id !== tratamientosAnterioresIds[index]));
    const estadoNuevo = dto.estado ?? estadoAnterior;
    const requiereValidarDisponibilidad =
      this.estadoOcupaHorario(estadoNuevo) &&
      (fechaCambiada || !this.estadoOcupaHorario(estadoAnterior));

    if (requiereValidarDisponibilidad) {
      await this.validarDisponibilidadTurno(fechaInicioNueva, fechaFinNueva, id);
    }

    if (dto.clienteId) {
      const cliente = await this.clienteRepository.findOneBy({
        id: dto.clienteId,
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');
      turno.cliente = cliente;
    }

    turno.fechaInicio = fechaInicioNueva;
    turno.fechaFin = fechaFinNueva;

    if (dto.notas !== undefined) {
      turno.notas = dto.notas;
    }

    if (dto.estado) {
      turno.estado = dto.estado;
    }

    if (dto.tratamientosIds) {
      const tratamientos = await this.cargarTratamientosHistoricos(dto.tratamientosIds);

      turno.tratamientos = tratamientos;
    }

    if (fechaCambiada || tratamientosCambiados || clienteCambiado) {
      turno.tratamientosSnapshot = turno.tratamientos.map((tratamiento) => ({
        id: tratamiento.id,
        nombre: tratamiento.nombre,
        costo: calcularCostoHistoricoTratamiento(tratamiento, turno.fechaInicio),
        duracion: tratamiento.duracion,
      }));
      turno.costoTotal = this.calcularCostoTotalTurno(turno);
    }

    await this.turnoRepository.save(turno);

    const turnoCompleto = await this.findOne(id);
    const estadoCambiado = dto.estado !== undefined && dto.estado !== estadoAnterior;
    const requiereSincronizarRecordatorios = estadoCambiado || fechaCambiada || tratamientosCambiados || clienteCambiado;

    // Registrar cambio de estado si cambió
    if (estadoCambiado) {
      await this.registrarCambioEstado(turno, estadoAnterior, dto.estado!);
    }

    if (requiereSincronizarRecordatorios) {
      await this.sincronizarRecordatoriosTurno(turnoCompleto);
    }

    this.notificarTurnosActualizados();

    return turnoCompleto;
  }

  async remove(id: string): Promise<void> {
    const result = await this.turnoRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Turno no encontrado');

    this.notificarTurnosActualizados();
  }
}
