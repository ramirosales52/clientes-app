import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import parsePhoneNumberFromString from 'libphonenumber-js';

function validarTelefonoCompleto(codArea: string, numero: string) {
  const telefonoCompleto = `549${codArea}${numero}`;
  const parsed = parsePhoneNumberFromString(telefonoCompleto, 'AR');
  if (!parsed?.isValid()) {
    throw new BadRequestException('Número de teléfono inválido');
  }
}

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) { }

  create(dto: CreateClienteDto): Promise<Cliente> {
    validarTelefonoCompleto(dto.codArea, dto.numero);

    const cliente = this.clienteRepository.create(dto);
    return this.clienteRepository.save(cliente);
  }

  findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find({ relations: ['turnos'] });
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['turnos', 'turnos.tratamientos'],
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async findPaginated(limit = 10, offset = 0, search = '') {
    const options: any = {
      where: search ? { nombre: ILike(`%${search}%`) } : {},
      relations: ['turnos'],
      order: { apellido: 'ASC' },
      take: limit,
      skip: offset,
    };

    const [data, total] = await this.clienteRepository.findAndCount(options);

    return {
      data,
      total,
      hasMore: offset + data.length < total && data.length > 0,
    };
  }

  async update(id: string, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOneBy({ id });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    if (dto.codArea || dto.numero) {
      validarTelefonoCompleto(dto.codArea ?? cliente.codArea, dto.numero ?? cliente.numero);
    }

    Object.assign(cliente, dto);
    return this.clienteRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const result = await this.clienteRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Cliente no encontrado');
  }
}

