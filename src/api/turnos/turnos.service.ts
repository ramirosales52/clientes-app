import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import dayjs from 'dayjs';

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

  private generarBloques(intervalos: [number, number][]): string[] {
    const bloques: string[] = [];

    for (const [inicio, fin] of intervalos) {
      for (let hora = inicio; hora <= fin; hora++) {
        if (hora < fin) {
          bloques.push(`${hora.toString().padStart(2, '0')}:00`);
          bloques.push(`${hora.toString().padStart(2, '0')}:30`);
        } else if (hora === fin) {
          bloques.push(`${hora.toString().padStart(2, '0')}:00`); // incluir hora final exacta
        }
      }
    }

    return bloques;
  }

  async obtenerHorasDisponibles(fecha: Date): Promise<{ disponibles: string[], ocupadas: [string, string][] }> {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

    const turnos = await this.turnoRepository.find({
      where: {
        fechaInicio: MoreThan(fechaInicio),
        fechaFin: LessThan(fechaFin),
        estado: In(['pendiente', 'confirmado']),
      },
    });

    const ocupados: [string, string][] = turnos.map(turno => {
      const inicio = dayjs(turno.fechaInicio).format("HH:mm");
      const fin = dayjs(turno.fechaFin).format("HH:mm");
      return [inicio, fin];
    });

    const bloques = this.generarBloques([
      [8, 12],
      [15, 19],
    ]);

    function estaEnIntervalo(bloque: string, intervalos: [string, string][]) {
      const minutos = horaStringAMinutos(bloque);

      return intervalos.some(([inicio, fin]) => {
        const inicioMin = horaStringAMinutos(inicio);
        const finMin = horaStringAMinutos(fin);
        return minutos >= inicioMin && minutos < finMin;
      });
    }

    function horaStringAMinutos(hora: string): number {
      const [h, m] = hora.split(":").map(Number);
      return h * 60 + m;
    }

    return {
      disponibles: bloques.filter((bloque) => !estaEnIntervalo(bloque, ocupados)),
      ocupadas: ocupados
    };
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

