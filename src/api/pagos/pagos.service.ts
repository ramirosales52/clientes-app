import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { Turno } from '../turnos/entities/turno.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
  ) {}

  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const turno = await this.turnoRepository.findOne({
      where: { id: createPagoDto.turnoId },
      relations: ['cliente', 'tratamientos', 'pagos'],
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    const costoTotal = turno.tratamientos.reduce((sum, t) => sum + t.costo, 0);
    const montoPagado = (turno.pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
    const deuda = costoTotal - montoPagado;

    if (createPagoDto.monto > deuda) {
      throw new BadRequestException(`El monto excede la deuda. Deuda actual: $${deuda}`);
    }

    const pago = this.pagoRepository.create({
      turno,
      cliente: turno.cliente,
      monto: createPagoDto.monto,
      metodoPago: createPagoDto.metodoPago,
      fechaPago: createPagoDto.fechaPago ? new Date(createPagoDto.fechaPago) : new Date(),
      notas: createPagoDto.notas,
    });

    return this.pagoRepository.save(pago);
  }

  async findAll(): Promise<Pago[]> {
    return this.pagoRepository.find({
      relations: ['turno', 'cliente'],
      order: { fechaPago: 'DESC' },
    });
  }

  async findByTurno(turnoId: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { turno: { id: turnoId } },
      order: { fechaPago: 'DESC' },
    });
  }

  async findByCliente(clienteId: string): Promise<Pago[]> {
    return this.pagoRepository.find({
      where: { cliente: { id: clienteId } },
      relations: ['turno'],
      order: { fechaPago: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pago> {
    const pago = await this.pagoRepository.findOne({
      where: { id },
      relations: ['turno', 'cliente'],
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  async remove(id: string): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagoRepository.remove(pago);
  }

  async getDeudaCliente(clienteId: string): Promise<{ deudaTotal: number; turnosConDeuda: number }> {
    const turnos = await this.turnoRepository.find({
      where: { cliente: { id: clienteId } },
      relations: ['tratamientos', 'pagos'],
    });

    let deudaTotal = 0;
    let turnosConDeuda = 0;

    for (const turno of turnos) {
      if (turno.estado === 'completado') {
        const costoTotal = turno.tratamientos.reduce((sum, t) => sum + t.costo, 0);
        const montoPagado = (turno.pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
        const deuda = costoTotal - montoPagado;

        if (deuda > 0) {
          deudaTotal += deuda;
          turnosConDeuda++;
        }
      }
    }

    return { deudaTotal, turnosConDeuda };
  }
}
