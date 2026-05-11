import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { ClienteNota } from './entities/cliente-nota.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CreateClienteNotaDto } from './dto/create-cliente-nota.dto';
import { UpdateClienteNotaDto } from './dto/update-cliente-nota.dto';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { calcularCostoHistoricoTurno } from '../tratamientos/costo-historico';

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
    @InjectRepository(ClienteNota)
    private clienteNotaRepository: Repository<ClienteNota>,
  ) { }

  private async asegurarCostoTotalTurno(turno: Cliente['turnos'][number]) {
    if (turno.costoTotal != null) return turno;

    turno.costoTotal = calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
    return turno;
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    validarTelefonoCompleto(dto.codArea, dto.numero);

    // Check if the full phone number already exists
    const existing = await this.clienteRepository.findOne({
      where: { codArea: dto.codArea, numero: dto.numero },
    });
    if (existing) {
      throw new BadRequestException('Ya existe un cliente con ese número de teléfono');
    }

    const cliente = this.clienteRepository.create(dto);
    return this.clienteRepository.save(cliente);
  }

  findAll(): Promise<Cliente[]> {
    return this.clienteRepository
      .find({
        relations: ['turnos', 'turnos.tratamientos', 'turnos.tratamientos.historialPrecios', 'turnos.pagos', 'turnos.historialEstados', 'notasCliente'],
      })
      .then(async (clientes) =>
        Promise.all(
          clientes.map(async (cliente) => ({
            ...cliente,
            notasCliente: [...(cliente.notasCliente || [])].sort(
              (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
            ),
            turnos: await Promise.all(cliente.turnos.map((turno) => this.asegurarCostoTotalTurno(turno))),
          })),
        ),
      );
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id },
      relations: ['turnos', 'turnos.tratamientos', 'turnos.tratamientos.historialPrecios', 'turnos.pagos', 'turnos.historialEstados', 'notasCliente'],
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return {
      ...cliente,
      notasCliente: [...(cliente.notasCliente || [])].sort(
        (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
      ),
      turnos: await Promise.all(cliente.turnos.map((turno) => this.asegurarCostoTotalTurno(turno))),
    };
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

  async createNota(clienteId: string, dto: CreateClienteNotaDto): Promise<ClienteNota> {
    const cliente = await this.clienteRepository.findOneBy({ id: clienteId });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const nota = this.clienteNotaRepository.create({
      contenido: dto.contenido.trim(),
      cliente,
    });

    return this.clienteNotaRepository.save(nota);
  }

  async updateNota(
    clienteId: string,
    notaId: string,
    dto: UpdateClienteNotaDto,
  ): Promise<ClienteNota> {
    const nota = await this.clienteNotaRepository.findOne({
      where: { id: notaId },
      relations: ['cliente'],
    });

    if (!nota || nota.cliente.id !== clienteId) {
      throw new NotFoundException('Nota no encontrada');
    }

    if (dto.contenido !== undefined) {
      nota.contenido = dto.contenido.trim();
    }

    return this.clienteNotaRepository.save(nota);
  }

  async removeNota(clienteId: string, notaId: string): Promise<void> {
    const nota = await this.clienteNotaRepository.findOne({
      where: { id: notaId },
      relations: ['cliente'],
    });

    if (!nota || nota.cliente.id !== clienteId) {
      throw new NotFoundException('Nota no encontrada');
    }

    await this.clienteNotaRepository.delete(notaId);
  }
}

