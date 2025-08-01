import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';

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

