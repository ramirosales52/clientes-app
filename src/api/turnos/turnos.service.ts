import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';

dayjs.extend(isSameOrBefore);

type Interval = { inicio: dayjs.Dayjs; fin: dayjs.Dayjs };
export type DisponibilidadCard = { horaInicio: string; horaFin: string };

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,

    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,

    @InjectRepository(Tratamiento)
    private tratamientoRepository: Repository<Tratamiento>,
  ) { }

  async create(createTurnoDto: CreateTurnoDto): Promise<Turno> {
    const { fechaInicio, fechaFin } = createTurnoDto;

    const overlapping = await this.turnoRepository.findOne({
      where: [
        {
          fechaInicio: LessThan(new Date(fechaFin)),
          fechaFin: MoreThan(new Date(fechaInicio)),
          estado: In(['pendiente', 'confirmado']),
        },
      ],
    });

    if (overlapping) {
      throw new BadRequestException('El turno se superpone con otro ya existente');
    }

    const cliente = await this.clienteRepository.findOneBy({
      id: createTurnoDto.clienteId,
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const tratamientos = await this.tratamientoRepository.findBy({
      id: In(createTurnoDto.tratamientosIds),
    });

    if (tratamientos.length !== createTurnoDto.tratamientosIds.length) {
      throw new NotFoundException('Uno o más tratamientos no existen');
    }

    const turno = this.turnoRepository.create({
      ...createTurnoDto,
      fechaInicio: new Date(createTurnoDto.fechaInicio),
      fechaFin: new Date(createTurnoDto.fechaFin),
      cliente,
      tratamientos
    });

    return this.turnoRepository.save(turno);
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

  findAll(): Promise<Turno[]> {
    return this.turnoRepository.find({ relations: ['cliente'] });
  }

  async findOne(id: string): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!turno) throw new NotFoundException('Turno no encontrado');
    return turno;
  }

  async update(id: string, dto: UpdateTurnoDto): Promise<Turno> {
    const turno = await this.turnoRepository.findOneBy({ id });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    if (dto.clienteId) {
      const cliente = await this.clienteRepository.findOneBy({
        id: dto.clienteId,
      });
      if (!cliente) throw new NotFoundException('Cliente no encontrado');
      turno.cliente = cliente;
    }

    Object.assign(turno, {
      ...dto,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : turno.fechaInicio,
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : turno.fechaFin,
    });

    return this.turnoRepository.save(turno);
  }

  async remove(id: string): Promise<void> {
    const result = await this.turnoRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Turno no encontrado');
  }
}

