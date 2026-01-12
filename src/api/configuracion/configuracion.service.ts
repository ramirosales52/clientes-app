import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

/**
 * Parsea una fecha string (YYYY-MM-DD) a Date sin problemas de timezone.
 * Agrega T12:00:00 para evitar que se interprete como UTC medianoche.
 */
function parseDateString(dateStr: string): Date {
  // Si ya tiene T, usarla directamente
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  // Agregar mediodía para evitar problemas de timezone
  return new Date(dateStr + "T12:00:00");
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
      fechaInicio: parseDateString(dto.fechaInicio),
      fechaFin: parseDateString(dto.fechaFin),
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
    if (dto.fechaInicio !== undefined) temporada.fechaInicio = parseDateString(dto.fechaInicio);
    if (dto.fechaFin !== undefined) temporada.fechaFin = parseDateString(dto.fechaFin);
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
      fecha: parseDateString(dto.fecha),
      cerrado: dto.cerrado,
      motivo: dto.motivo,
      franjas: dto.franjas,
    });
    return this.diaEspecialRepo.save(dia);
  }

  async updateDiaEspecial(id: string, dto: UpdateDiaEspecialDto): Promise<DiaEspecial> {
    const dia = await this.getDiaEspecial(id);

    if (dto.fecha !== undefined) dia.fecha = parseDateString(dto.fecha);
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
    const fechaDate = parseDateString(fecha);
    const diaSemana = fechaDate.getDay();

    // 1. Verificar si es un día especial
    // Buscar todos y filtrar por fecha (SQLite guarda fechas como string)
    const diasEspeciales = await this.diaEspecialRepo.find();
    const diaEspecial = diasEspeciales.find((d) => {
      const diaFecha = parseDateString(String(d.fecha));
      return (
        diaFecha.getFullYear() === fechaDate.getFullYear() &&
        diaFecha.getMonth() === fechaDate.getMonth() &&
        diaFecha.getDate() === fechaDate.getDate()
      );
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
    const temporadas = await this.temporadaRepo.find({
      where: { activa: true },
      relations: ["horarios"],
    });
    
    const temporada = temporadas.find((t) => {
      const inicio = parseDateString(String(t.fechaInicio));
      const fin = parseDateString(String(t.fechaFin));
      // Comparar solo año, mes, día
      const fechaNum = fechaDate.getFullYear() * 10000 + fechaDate.getMonth() * 100 + fechaDate.getDate();
      const inicioNum = inicio.getFullYear() * 10000 + inicio.getMonth() * 100 + inicio.getDate();
      const finNum = fin.getFullYear() * 10000 + fin.getMonth() * 100 + fin.getDate();
      return fechaNum >= inicioNum && fechaNum <= finNum;
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

  /**
   * Obtiene las fechas cerradas dentro de un rango de fechas.
   * Usado para deshabilitar días en el calendario al agendar turnos.
   */
  async getFechasCerradas(desde: string, hasta: string): Promise<string[]> {
    const fechasCerradas: string[] = [];
    const desdeDate = parseDateString(desde);
    const hastaDate = parseDateString(hasta);

    // Obtener datos necesarios
    const diasEspeciales = await this.diaEspecialRepo.find();
    const temporadas = await this.temporadaRepo.find({
      where: { activa: true },
      relations: ["horarios"],
    });
    const horariosSemanales = await this.getHorariosSemanales();

    // Iterar por cada día en el rango
    const currentDate = new Date(desdeDate);
    while (currentDate <= hastaDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const fechaStr = `${year}-${month}-${day}`;
      const diaSemana = currentDate.getDay();

      let cerrado = false;

      // 1. Verificar días especiales
      const diaEspecial = diasEspeciales.find((d) => {
        const diaFecha = parseDateString(String(d.fecha));
        return (
          diaFecha.getFullYear() === currentDate.getFullYear() &&
          diaFecha.getMonth() === currentDate.getMonth() &&
          diaFecha.getDate() === currentDate.getDate()
        );
      });

      if (diaEspecial) {
        cerrado = diaEspecial.cerrado;
      } else {
        // 2. Verificar temporadas
        const temporada = temporadas.find((t) => {
          const inicio = parseDateString(String(t.fechaInicio));
          const fin = parseDateString(String(t.fechaFin));
          const fechaNum = currentDate.getFullYear() * 10000 + currentDate.getMonth() * 100 + currentDate.getDate();
          const inicioNum = inicio.getFullYear() * 10000 + inicio.getMonth() * 100 + inicio.getDate();
          const finNum = fin.getFullYear() * 10000 + fin.getMonth() * 100 + fin.getDate();
          return fechaNum >= inicioNum && fechaNum <= finNum;
        });

        if (temporada) {
          const horarioTemp = temporada.horarios.find((h) => h.diaSemana === diaSemana);
          cerrado = horarioTemp ? !horarioTemp.activo : true;
        } else {
          // 3. Verificar horario semanal
          const horarioSemanal = horariosSemanales.find((h) => h.diaSemana === diaSemana);
          cerrado = horarioSemanal ? !horarioSemanal.activo : true;
        }
      }

      if (cerrado) {
        fechasCerradas.push(fechaStr);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return fechasCerradas;
  }
}
