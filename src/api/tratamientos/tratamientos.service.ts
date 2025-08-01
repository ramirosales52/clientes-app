import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { PrecioHistorial } from './entities/precio-historial.entity';

@Injectable()
export class TratamientoService {
  constructor(
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepo: Repository<Tratamiento>,

    @InjectRepository(PrecioHistorial)
    private readonly historialRepo: Repository<PrecioHistorial>,
  ) { }

  async create(dto: CreateTratamientoDto) {
    const tratamiento = this.tratamientoRepo.create(dto);
    await this.tratamientoRepo.save(tratamiento);

    const historial = this.historialRepo.create({
      precio: tratamiento.costo,
      tratamiento,
    });
    await this.historialRepo.save(historial);

    return tratamiento;
  }

  findAll() {
    return this.tratamientoRepo.find({ relations: ['historialPrecios'] });
  }

  async findOne(id: string) {
    const tratamiento = await this.tratamientoRepo.findOne({
      where: { id },
      relations: ['historialPrecios'],
    });
    if (!tratamiento) throw new NotFoundException('Tratamiento no encontrado');
    return tratamiento;
  }

  async findHistorialPrecios(id: string) {
    const tratamiento = await this.tratamientoRepo.findOne({
      where: { id },
      relations: ['historialPrecios'],
      order: {
        historialPrecios: {
          fecha: 'DESC',
        },
      },
    });

    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }

    return tratamiento.historialPrecios;
  }

  async update(id: string, dto: UpdateTratamientoDto) {
    const tratamiento = await this.findOne(id);

    if (dto.costo && dto.costo !== tratamiento.costo) {
      const historial = this.historialRepo.create({
        precio: dto.costo,
        tratamiento,
      });
      await this.historialRepo.save(historial);
    }

    Object.assign(tratamiento, dto);
    return this.tratamientoRepo.save(tratamiento);
  }

  async remove(id: string) {
    const tratamiento = await this.findOne(id);
    return this.tratamientoRepo.remove(tratamiento);
  }
}

