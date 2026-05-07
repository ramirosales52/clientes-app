import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { Turno } from '../turnos/entities/turno.entity';
import { calcularCostoHistoricoTurno } from '../tratamientos/costo-historico';

type DeudaTurno = {
  turnoId: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: string;
  cliente: {
    id: string;
    nombre: string;
    apellido: string;
  };
  tratamientos: {
    id: string;
    nombre: string;
    costo: number;
  }[];
  pagos: {
    id: string;
    monto: number;
    metodoPago: string;
    fechaPago: Date;
  }[];
  costoTotal: number;
  montoPagado: number;
  deuda: number;
};

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
  ) {}

  private async asegurarCostoTotal(turno: Turno): Promise<Turno> {
    if (turno.costoTotal != null) return turno;

    turno.costoTotal = calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
    await this.turnoRepository.save(turno);
    return turno;
  }

  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const turno = await this.turnoRepository.findOne({
      where: { id: createPagoDto.turnoId },
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos'],
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    await this.asegurarCostoTotal(turno);

    const costoTotal = turno.costoTotal ?? calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
    const montoPagado = (turno.pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
    const deuda = costoTotal - montoPagado;

    if (createPagoDto.monto > deuda) {
      throw new BadRequestException(`El monto excede la deuda. Deuda actual: $${deuda}`);
    }

    if (turno.costoTotal == null) {
      // Congelar el total del turno al registrar el primer pago para que
      // futuros cambios de precios no alteren deudas ya abonadas.
      turno.costoTotal = costoTotal;
      await this.turnoRepository.save(turno);
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
    const pagos = await this.pagoRepository.find({
      relations: ['turno', 'turno.tratamientos', 'cliente'],
      order: { fechaPago: 'DESC' },
    });

    return pagos;
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
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos'],
    });

    let deudaTotal = 0;
    let turnosConDeuda = 0;

    for (const turno of turnos) {
      if (turno.estado === 'completado') {
        await this.asegurarCostoTotal(turno);
        const costoTotal = turno.costoTotal ?? calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
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

  async getTurnosConDeuda(): Promise<DeudaTurno[]> {
    const turnos = await this.turnoRepository.find({
      relations: ['cliente', 'tratamientos', 'tratamientos.historialPrecios', 'pagos'],
      order: { fechaInicio: 'DESC' },
    });

    return turnos
      .filter((turno) => turno.estado === 'completado')
      .map((turno) => {
        const costoTotal = turno.costoTotal ?? calcularCostoHistoricoTurno(turno.tratamientos, turno.fechaInicio);
        const montoPagado = (turno.pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
        const deuda = costoTotal - montoPagado;

        return {
          turnoId: turno.id,
          fechaInicio: turno.fechaInicio,
          fechaFin: turno.fechaFin,
          estado: turno.estado,
          cliente: {
            id: turno.cliente.id,
            nombre: turno.cliente.nombre,
            apellido: turno.cliente.apellido,
          },
          tratamientos: turno.tratamientos.map((tratamiento) => ({
            id: tratamiento.id,
            nombre: tratamiento.nombre,
            costo: Number(tratamiento.costo),
          })),
          pagos: (turno.pagos || []).map((pago) => ({
            id: pago.id,
            monto: Number(pago.monto),
            metodoPago: pago.metodoPago,
            fechaPago: pago.fechaPago,
          })),
          costoTotal,
          montoPagado,
          deuda,
        };
      })
      .filter((turno) => turno.deuda > 0)
      .sort((a, b) => b.deuda - a.deuda || b.fechaInicio.getTime() - a.fechaInicio.getTime());
  }
}
