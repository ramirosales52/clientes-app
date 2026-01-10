import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { ConfiguracionSalon } from "./entities/configuracion-salon.entity";
import { HorarioSemanal, Franja } from "./entities/horario-semanal.entity";
import { Temporada } from "./entities/temporada.entity";
import { HorarioTemporada } from "./entities/horario-temporada.entity";
import { DiaEspecial } from "./entities/dia-especial.entity";
import { UpdateConfiguracionSalonDto } from "./dto/update-configuracion-salon.dto";
import { UpdateHorariosSemanalDto } from "./dto/horario-semanal.dto";
import { CreateTemporadaDto, UpdateTemporadaDto } from "./dto/temporada.dto";
import { CreateDiaEspecialDto, UpdateDiaEspecialDto } from "./dto/dia-especial.dto";

export interface HorariosParaFecha {
  fecha: string;
  tipo: "normal" | "temporada" | "especial";
  cerrado: boolean;
  motivo?: string;
  franjas: Franja[];
  temporadaNombre?: string;
}

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(ConfiguracionSalon)
    private readonly configuracionRepo: Repository<ConfiguracionSalon>,
    @InjectRepository(HorarioSemanal)
    private readonly horarioSemanalRepo: Repository<HorarioSemanal>,
    @InjectRepository(Temporada)
    private readonly temporadaRepo: Repository<Temporada>,
    @InjectRepository(HorarioTemporada)
    private readonly horarioTemporadaRepo: Repository<HorarioTemporada>,
    @InjectRepository(DiaEspecial)
    private readonly diaEspecialRepo: Repository<DiaEspecial>,
  ) {}

  // ==================== CONFIGURACIÓN GENERAL ====================

  async getConfiguracion(): Promise<ConfiguracionSalon> {
    let config = await this.configuracionRepo.findOne({ where: {} });
    if (!config) {
      config = this.configuracionRepo.create({
        nombre: "Mi Salón",
        duracionSlotMinutos: 30,
      });
      await this.configuracionRepo.save(config);
    }
    return config;
  }

  async updateConfiguracion(dto: UpdateConfiguracionSalonDto): Promise<ConfiguracionSalon> {
    const config = await this.getConfiguracion();
    Object.assign(config, dto);
    return this.configuracionRepo.save(config);
  }

  // ==================== HORARIOS SEMANALES ====================

  async getHorariosSemanales(): Promise<HorarioSemanal[]> {
    let horarios = await this.horarioSemanalRepo.find({
      order: { diaSemana: "ASC" },
    });

    // Si no hay horarios, crear los defaults
    if (horarios.length === 0) {
      horarios = await this.crearHorariosDefault();
    }

    return horarios;
  }

  private async crearHorariosDefault(): Promise<HorarioSemanal[]> {
    const defaults: Partial<HorarioSemanal>[] = [
      { diaSemana: 0, activo: false, franjas: [] }, // Domingo cerrado
      { diaSemana: 1, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }, { horaInicio: "15:00", horaFin: "19:00" }] },
      { diaSemana: 2, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }, { horaInicio: "15:00", horaFin: "19:00" }] },
      { diaSemana: 3, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }, { horaInicio: "15:00", horaFin: "19:00" }] },
      { diaSemana: 4, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }, { horaInicio: "15:00", horaFin: "19:00" }] },
      { diaSemana: 5, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }, { horaInicio: "15:00", horaFin: "19:00" }] },
      { diaSemana: 6, activo: true, franjas: [{ horaInicio: "09:00", horaFin: "13:00" }] }, // Sábado solo mañana
    ];

    const horarios = defaults.map((h) => this.horarioSemanalRepo.create(h));
    return this.horarioSemanalRepo.save(horarios);
  }

  async updateHorariosSemanales(dto: UpdateHorariosSemanalDto): Promise<HorarioSemanal[]> {
    // Obtener o crear horarios existentes
    await this.getHorariosSemanales();

    for (const horarioDto of dto.horarios) {
      const existing = await this.horarioSemanalRepo.findOne({
        where: { diaSemana: horarioDto.diaSemana },
      });

      if (existing) {
        existing.activo = horarioDto.activo;
        existing.franjas = horarioDto.franjas;
        await this.horarioSemanalRepo.save(existing);
      } else {
        const nuevo = this.horarioSemanalRepo.create(horarioDto);
        await this.horarioSemanalRepo.save(nuevo);
      }
    }

    return this.getHorariosSemanales();
  }

  // ==================== TEMPORADAS ====================

  async getTemporadas(): Promise<Temporada[]> {
    return this.temporadaRepo.find({
      order: { fechaInicio: "DESC" },
      relations: ["horarios"],
    });
  }

  async getTemporada(id: string): Promise<Temporada> {
    const temporada = await this.temporadaRepo.findOne({
      where: { id },
      relations: ["horarios"],
    });
    if (!temporada) {
      throw new NotFoundException("Temporada no encontrada");
    }
    return temporada;
  }

  async createTemporada(dto: CreateTemporadaDto): Promise<Temporada> {
    const temporada = this.temporadaRepo.create({
      nombre: dto.nombre,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: new Date(dto.fechaFin),
      activa: dto.activa ?? true,
    });

    const saved = await this.temporadaRepo.save(temporada);

    // Crear los horarios de la temporada
    if (dto.horarios && dto.horarios.length > 0) {
      const horariosTemporada = dto.horarios.map((h) =>
        this.horarioTemporadaRepo.create({
          temporada: saved,
          diaSemana: h.diaSemana,
          activo: h.activo,
          franjas: h.franjas,
        }),
      );
      await this.horarioTemporadaRepo.save(horariosTemporada);
    }

    return this.getTemporada(saved.id);
  }

  async updateTemporada(id: string, dto: UpdateTemporadaDto): Promise<Temporada> {
    const temporada = await this.getTemporada(id);

    if (dto.nombre !== undefined) temporada.nombre = dto.nombre;
    if (dto.fechaInicio !== undefined) temporada.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin !== undefined) temporada.fechaFin = new Date(dto.fechaFin);
    if (dto.activa !== undefined) temporada.activa = dto.activa;

    await this.temporadaRepo.save(temporada);

    // Actualizar horarios si se proporcionan
    if (dto.horarios) {
      // Eliminar horarios existentes
      await this.horarioTemporadaRepo.delete({ temporada: { id } });

      // Crear nuevos
      const horariosTemporada = dto.horarios.map((h) =>
        this.horarioTemporadaRepo.create({
          temporada,
          diaSemana: h.diaSemana,
          activo: h.activo,
          franjas: h.franjas,
        }),
      );
      await this.horarioTemporadaRepo.save(horariosTemporada);
    }

    return this.getTemporada(id);
  }

  async deleteTemporada(id: string): Promise<void> {
    const result = await this.temporadaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Temporada no encontrada");
    }
  }

  // ==================== DÍAS ESPECIALES ====================

  async getDiasEspeciales(): Promise<DiaEspecial[]> {
    return this.diaEspecialRepo.find({
      order: { fecha: "DESC" },
    });
  }

  async getDiaEspecial(id: string): Promise<DiaEspecial> {
    const dia = await this.diaEspecialRepo.findOne({ where: { id } });
    if (!dia) {
      throw new NotFoundException("Día especial no encontrado");
    }
    return dia;
  }

  async createDiaEspecial(dto: CreateDiaEspecialDto): Promise<DiaEspecial> {
    const dia = this.diaEspecialRepo.create({
      fecha: new Date(dto.fecha),
      cerrado: dto.cerrado,
      motivo: dto.motivo,
      franjas: dto.franjas,
    });
    return this.diaEspecialRepo.save(dia);
  }

  async updateDiaEspecial(id: string, dto: UpdateDiaEspecialDto): Promise<DiaEspecial> {
    const dia = await this.getDiaEspecial(id);

    if (dto.fecha !== undefined) dia.fecha = new Date(dto.fecha);
    if (dto.cerrado !== undefined) dia.cerrado = dto.cerrado;
    if (dto.motivo !== undefined) dia.motivo = dto.motivo;
    if (dto.franjas !== undefined) dia.franjas = dto.franjas;

    return this.diaEspecialRepo.save(dia);
  }

  async deleteDiaEspecial(id: string): Promise<void> {
    const result = await this.diaEspecialRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Día especial no encontrado");
    }
  }

  // ==================== LÓGICA DE RESOLUCIÓN ====================

  /**
   * Obtiene los horarios aplicables para una fecha específica.
   * Prioridad: DiaEspecial > Temporada > HorarioSemanal
   */
  async getHorariosParaFecha(fecha: string): Promise<HorariosParaFecha> {
    const fechaDate = new Date(fecha);
    const diaSemana = fechaDate.getDay();

    // 1. Verificar si es un día especial
    const diaEspecial = await this.diaEspecialRepo.findOne({
      where: { fecha: fechaDate },
    });

    if (diaEspecial) {
      return {
        fecha,
        tipo: "especial",
        cerrado: diaEspecial.cerrado,
        motivo: diaEspecial.motivo,
        franjas: diaEspecial.cerrado ? [] : (diaEspecial.franjas || []),
      };
    }

    // 2. Verificar si hay una temporada activa para esta fecha
    const temporada = await this.temporadaRepo.findOne({
      where: {
        activa: true,
        fechaInicio: LessThanOrEqual(fechaDate),
        fechaFin: MoreThanOrEqual(fechaDate),
      },
      relations: ["horarios"],
    });

    if (temporada) {
      const horarioTemporada = temporada.horarios.find((h) => h.diaSemana === diaSemana);

      if (horarioTemporada) {
        return {
          fecha,
          tipo: "temporada",
          cerrado: !horarioTemporada.activo,
          franjas: horarioTemporada.activo ? horarioTemporada.franjas : [],
          temporadaNombre: temporada.nombre,
        };
      }
    }

    // 3. Usar horario semanal por defecto
    const horarioSemanal = await this.horarioSemanalRepo.findOne({
      where: { diaSemana },
    });

    if (!horarioSemanal) {
      // Si no hay horario configurado, crear defaults y reintentar
      await this.crearHorariosDefault();
      const horarioDefault = await this.horarioSemanalRepo.findOne({
        where: { diaSemana },
      });

      return {
        fecha,
        tipo: "normal",
        cerrado: !horarioDefault?.activo,
        franjas: horarioDefault?.activo ? horarioDefault.franjas : [],
      };
    }

    return {
      fecha,
      tipo: "normal",
      cerrado: !horarioSemanal.activo,
      franjas: horarioSemanal.activo ? horarioSemanal.franjas : [],
    };
  }
}
