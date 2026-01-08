# 📋 PLAN DE IMPLEMENTACIÓN COMPLETO
## Sistema de Gestión de Salón de Belleza

---

## 🎯 Objetivos del Proyecto

Completar la aplicación de gestión del salón de belleza con las siguientes funcionalidades clave:

1. **CRUD completo con UI** para clientes, tratamientos y turnos
2. **Sistema de recordatorios automáticos por WhatsApp** con confirmación/cancelación
3. **Dashboard de gestión del bot** con histórico, configuración y envío manual
4. **Servicio con cron jobs** para recordatorios automáticos (integrado en Electron)

---

## 🎯 Decisiones Confirmadas

✅ **Arquitectura:** Opción A - Todo en Electron con cron jobs  
✅ **Mensajes WhatsApp:** Sin personalización de nombre de salón  
✅ **Recordatorio 1h antes:** Solo si turno está CONFIRMADO  
✅ **Restricción horaria:** Configurable (por defecto sin restricción, pero opción en config)  
✅ **Orden de implementación:** Seguir orden propuesto  

---

## 📦 Paquetes a Instalar

```bash
npm install @nestjs/schedule
npm install --save-dev @types/cron
```

---

## 🗂️ Estructura de Archivos a Crear/Modificar

### 📁 Archivos NUEVOS (16 archivos)

```
src/api/recordatorios/
├── entities/
│   └── recordatorio.entity.ts          [✨ Entity con estados y tipos]
├── dto/
│   ├── create-recordatorio.dto.ts      [✨ DTO validado]
│   └── update-recordatorio.dto.ts      [✨ DTO validado]
├── recordatorios.controller.ts         [✨ Endpoints REST]
├── recordatorios.service.ts            [✨ Lógica de negocio + plantillas]
├── recordatorios.cron.ts               [✨ Cron jobs automáticos]
└── recordatorios.module.ts             [✨ Módulo NestJS]

src/api/whatsapp/entities/
└── configuracion-bot.entity.ts         [✨ Config persistente]

src/api/whatsapp/dto/
├── create-configuracion.dto.ts         [✨ DTO validado]
└── update-configuracion.dto.ts         [✨ DTO validado]
```

### 📝 Archivos MODIFICADOS (13 archivos)

#### Backend (6 archivos):
```
src/main/app.module.ts                  [Importar ScheduleModule + RecordatoriosModule]
src/api/whatsapp/whatsapp.service.ts    [Listener de mensajes + métodos helper]
src/api/whatsapp/whatsapp.controller.ts [Endpoints de configuración]
src/api/clientes/clientes.service.ts    [Método findByTelefono()]
src/api/turnos/turnos.service.ts        [Hook para crear recordatorios]
src/api/entities/index.ts               [Exportar nuevas entities]
```

#### Frontend (7 archivos):
```
src/render/app/features/tratamientos/tratamientos.tsx      [Tabla completa + CRUD UI]
src/render/app/features/turnos/turnos.tsx                   [Tabla + filtros + badges]
src/render/app/features/turnos/components/turnos-modal.tsx  [Agregar modo edición]
src/render/app/features/clientes/clienteDetalle.tsx         [Vista completa con stats]
src/render/app/features/clientes/components/clientes-modal.tsx [Modo edición]
src/render/app/principal.tsx                                [Dashboard con métricas]
src/render/app/features/whatsapp/whatsapp.tsx               [Tabs: Estado, Recordatorios, Config, Manual]
```

---

## 🚀 Plan de Implementación Detallado

---

### **FASE 1: UI Básica de Features Core** (3-4 horas)

#### **1.1 Página de Tratamientos** ✅ Backend listo

**Archivo:** `src/render/app/features/tratamientos/tratamientos.tsx`

**Componentes a crear:**
- Tabla con react-table/tabla nativa
- Columnas: Nombre | Costo | Duración | Acciones
- Modal de edición (reutilizar tratamientos-modal.tsx con modo edit)
- Formateo de precio: `new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
- Badge de duración con colores según tiempo
- Botón eliminar con confirmación
- Estado vacío con SVG

**Endpoints a usar:**
- `GET /tratamientos` → Listar
- `PUT /tratamientos/:id` → Actualizar (ya existe)
- `DELETE /tratamientos/:id` → Eliminar (ya existe)

---

#### **1.2 Página de Turnos** ✅ Backend listo

**Archivo:** `src/render/app/features/turnos/turnos.tsx`

**Componentes a crear:**

**A) Barra de filtros:**
```tsx
- Select: Estado (Todos, Pendiente, Confirmado, Cancelado, Realizado)
- DateRangePicker: Rango de fechas (react-day-picker ya instalado)
- Input: Buscar por cliente (nombre/apellido)
- Badge: "Hoy" con contador
```

**B) Tabla de turnos:**
```tsx
Columnas:
- Cliente (nombre + apellido + badge con teléfono en hover)
- Fecha (formato: "Lun 08 Ene, 09:30")
- Duración (calculada: fechaFin - fechaInicio)
- Tratamientos (badges horizontales, max 2 visible + "+N más")
- Estado (badge con colores)
- Costo total (suma de tratamientos.costo)
- Acciones (Dropdown: Ver, Editar, Cancelar, Marcar realizado)
```

**C) Estados y colores:**
```tsx
PENDIENTE → yellow (amber)
CONFIRMADO → green
CANCELADO → red
REALIZADO → blue
```

**D) Lógica de acciones:**
- **Cancelar:** `PATCH /turnos/:id` → `{ estado: 'cancelado' }`
- **Marcar realizado:** `PATCH /turnos/:id` → `{ estado: 'realizado' }`
- **Editar:** Abrir modal con datos precargados

**Endpoints a usar:**
- `GET /turnos` → Listar con paginación
- `PATCH /turnos/:id` → Actualizar
- `DELETE /turnos/:id` → Eliminar

---

#### **1.3 Detalle de Cliente**

**Archivo:** `src/render/app/features/clientes/clienteDetalle.tsx`

**Layout de 2 columnas:**

**Columna izquierda (30%):**
```tsx
Card "Información del Cliente"
- Avatar con iniciales (nombre[0] + apellido[0])
- Nombre completo (h2)
- Teléfono (con formato +54 9 XXX XXX-XXXX)
- Miembro desde (creadoEn formateado)
- Botón "Editar cliente"
- Botón "Agendar turno"
```

**Columna derecha (70%):**

**Tabs:**
1. **Historial de Turnos**
   - Lista de turnos ordenados por fecha desc
   - Cada item muestra: fecha, tratamientos, estado, costo
   - Paginación

2. **Estadísticas**
   - Cards con métricas:
     - Total turnos: badge por estado
     - Último turno: fecha
     - Próximo turno: fecha + countdown
     - Gasto total: suma de turnos realizados
     - Tratamiento favorito: el más frecuente

**Endpoints a usar:**
- `GET /clientes/:id` → Datos del cliente
- `GET /turnos?clienteId=:id` → Turnos del cliente (NECESITA agregarse al controller)

---

#### **1.4 Dashboard Principal**

**Archivo:** `src/render/app/principal.tsx`

**Grid de 3 columnas:**

**Fila 1: Cards de métricas (4 cards)**
```tsx
1. Turnos de hoy
   - Número grande
   - Lista de próximos 3 turnos
   - Botón "Ver todos"

2. Turnos pendientes de confirmar
   - Número grande con badge rojo si > 0
   - Link a /turnos?estado=pendiente

3. Total de clientes
   - Número grande
   - Crecimiento vs mes anterior (opcional)

4. Ingresos del mes
   - Suma de turnos REALIZADOS del mes actual
   - Formateo de moneda
```

**Fila 2: Sección de acción rápida**
```tsx
- 3 botones grandes con iconos:
  - Agendar Turno
  - Agregar Cliente
  - Ver Calendario
```

**Fila 3: Notificaciones/Alertas**
```tsx
- Card de alertas:
  - WhatsApp desconectado (si aplica)
  - Turnos sin confirmar próximos (< 24h)
  - Recordatorios fallidos
```

**Endpoints a usar:**
- `GET /turnos?fecha=hoy` → Necesita implementar filtro por fecha
- `GET /turnos?estado=pendiente`
- `GET /clientes?limit=1` → Solo necesitamos el total
- `GET /turnos?estado=realizado&mes=X` → Necesita implementar filtro por mes

---

### **FASE 2: Sistema de Recordatorios WhatsApp** (5-6 horas)

#### **2.1 Entity: Recordatorio**

**Archivo:** `src/api/recordatorios/entities/recordatorio.entity.ts`

```typescript
export enum TipoRecordatorio {
  DIA_ANTERIOR = 'dia_anterior',
  UNA_HORA_ANTES = 'una_hora_antes',
}

export enum EstadoRecordatorio {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  FALLIDO = 'fallido',
}

@Entity()
export class Recordatorio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Turno, { eager: true, onDelete: 'CASCADE' })
  turno: Turno;

  @Column({ type: 'text', enum: TipoRecordatorio })
  tipo: TipoRecordatorio;

  @Column({ type: 'text', enum: EstadoRecordatorio, default: EstadoRecordatorio.PENDIENTE })
  estado: EstadoRecordatorio;

  @Column('datetime')
  fechaEnvio: Date;  // Cuándo programado

  @Column('datetime', { nullable: true })
  fechaEnviado: Date;  // Cuándo enviado

  @Column('datetime', { nullable: true })
  fechaRespuesta: Date;  // Cuándo respondió cliente

  @Column({ type: 'text', nullable: true })
  mensajeEnviado: string;

  @Column({ type: 'text', nullable: true })
  respuestaCliente: string;

  @Column({ type: 'text', nullable: true })
  errorMensaje: string;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
```

---

#### **2.2 Entity: ConfiguracionBot**

**Archivo:** `src/api/whatsapp/entities/configuracion-bot.entity.ts`

```typescript
@Entity()
export class ConfiguracionBot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  recordatoriosActivos: boolean;

  @Column('int', { default: 120 }) // minutos antes del turno
  tiempoAutoCancelacion: number;

  @Column({ default: true })
  enviarMensajeCancelacionAuto: boolean;

  @Column({ default: false })
  restriccionHoraria: boolean;

  @Column('int', { default: 8 }) // hora de inicio (8am)
  horaInicio: number;

  @Column('int', { default: 21 }) // hora de fin (9pm)
  horaFin: number;

  @Column('text', { default: 'Hola {cliente}! 👋\n\nTe recordamos tu turno para mañana {fecha} a las {hora}.\n\nTratamientos: {tratamientos}\n\nPor favor, responde *Confirmar* para confirmar tu asistencia o *Cancelar* si necesitas cancelar.' })
  plantillaDiaAnterior: string;

  @Column('text', { default: 'Hola {cliente}! ⏰\n\nTu turno es en 1 hora ({hora}).\n\n¡Te esperamos!' })
  plantillaUnaHoraAntes: string;

  @Column('text', { default: '✅ ¡Turno confirmado! Nos vemos pronto.' })
  plantillaConfirmacion: string;

  @Column('text', { default: '❌ Turno cancelado. Para reagendar, comunicate con nosotros.' })
  plantillaCancelacion: string;

  @Column('text', { default: '⚠️ Tu turno fue cancelado por falta de confirmación.' })
  plantillaCancelacionAuto: string;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
```

**Singleton pattern:** Solo debe existir 1 registro de configuración.

---

#### **2.3 RecordatoriosService**

**Archivo:** `src/api/recordatorios/recordatorios.service.ts`

**Métodos principales:**

```typescript
class RecordatoriosService {
  // Crear recordatorios al crear turno
  async crearRecordatoriosParaTurno(turno: Turno): Promise<Recordatorio[]>
  
  // Procesar pendientes (llamado por cron)
  async procesarPendientes(): Promise<void>
  
  // Auto-cancelar sin confirmación (llamado por cron)
  async autoCancelarSinConfirmacion(): Promise<void>
  
  // Confirmar recordatorio (respuesta del cliente)
  async confirmar(recordatorioId: string, respuesta: string): Promise<void>
  
  // Cancelar recordatorio (respuesta del cliente)
  async cancelar(recordatorioId: string, respuesta: string): Promise<void>
  
  // Enviar recordatorio específico
  async enviarRecordatorio(recordatorioId: string): Promise<void>
  
  // Generar mensaje a partir de plantilla
  private generarMensaje(tipo: TipoRecordatorio, turno: Turno): string
  
  // Verificar si está en horario permitido
  private estaEnHorarioPermitido(): boolean
  
  // Listar recordatorios con filtros
  async findAll(filtros?: FiltrosRecordatorio): Promise<Recordatorio[]>
  
  // Buscar recordatorio pendiente de un cliente
  async findPendienteByCliente(clienteId: string): Promise<Recordatorio | null>
}
```

**Lógica de `crearRecordatoriosParaTurno`:**
```typescript
1. Calcular fechaEnvio para DIA_ANTERIOR: turno.fechaInicio - 24 horas
2. Calcular fechaEnvio para UNA_HORA_ANTES: turno.fechaInicio - 1 hora
3. Crear ambos recordatorios con estado PENDIENTE
4. Retornar array de recordatorios creados
```

**Lógica de `procesarPendientes`:**
```typescript
1. Obtener configuración
2. Si recordatoriosActivos === false, retornar
3. Si restriccionHoraria === true, verificar hora actual
4. Buscar recordatorios donde:
   - estado = PENDIENTE
   - fechaEnvio <= ahora
   - turno.estado IN (PENDIENTE, CONFIRMADO)
   - Si tipo = UNA_HORA_ANTES, turno.estado DEBE ser CONFIRMADO
5. Para cada recordatorio:
   - Generar mensaje con plantilla
   - Enviar por WhatsApp
   - Actualizar estado a ENVIADO
   - Guardar fechaEnviado y mensajeEnviado
   - Si falla, marcar como FALLIDO y guardar error
```

**Lógica de `autoCancelarSinConfirmacion`:**
```typescript
1. Obtener configuración
2. Calcular tiempo límite: ahora + tiempoAutoCancelacion (minutos)
3. Buscar recordatorios donde:
   - tipo = DIA_ANTERIOR
   - estado = ENVIADO
   - turno.estado = PENDIENTE
   - turno.fechaInicio <= tiempo límite
4. Para cada recordatorio:
   - Actualizar turno.estado = CANCELADO
   - Actualizar recordatorio.estado = CANCELADO
   - Si enviarMensajeCancelacionAuto, enviar mensaje
   - Cancelar recordatorio UNA_HORA_ANTES asociado
```

---

#### **2.4 RecordatoriosCron**

**Archivo:** `src/api/recordatorios/recordatorios.cron.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecordatoriosService } from './recordatorios.service';

@Injectable()
export class RecordatoriosCron {
  private readonly logger = new Logger(RecordatoriosCron.name);

  constructor(private recordatoriosService: RecordatoriosService) {}

  // Cada 5 minutos
  @Cron(CronExpression.EVERY_5_MINUTES)
  async enviarRecordatoriosPendientes() {
    this.logger.log('Procesando recordatorios pendientes...');
    try {
      await this.recordatoriosService.procesarPendientes();
      this.logger.log('Recordatorios procesados exitosamente');
    } catch (error) {
      this.logger.error('Error procesando recordatorios', error);
    }
  }

  // Cada 10 minutos
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cancelarTurnosSinConfirmar() {
    this.logger.log('Verificando turnos sin confirmar...');
    try {
      await this.recordatoriosService.autoCancelarSinConfirmacion();
      this.logger.log('Auto-cancelación procesada exitosamente');
    } catch (error) {
      this.logger.error('Error en auto-cancelación', error);
    }
  }
}
```

---

#### **2.5 Actualizar WhatsappService**

**Archivo:** `src/api/whatsapp/whatsapp.service.ts`

**Agregar inyección de dependencias:**
```typescript
constructor(
  @InjectRepository(ConfiguracionBot)
  private configRepo: Repository<ConfiguracionBot>,
  private clientesService: ClientesService,
  private recordatoriosService: RecordatoriosService,
  private turnosService: TurnosService,
) {}
```

**Actualizar listener de mensajes:**
```typescript
this.client.on('message', async (message) => {
  try {
    const texto = message.body.toLowerCase().trim();
    const telefono = this.limpiarTelefono(message.from);
    
    // Buscar cliente por teléfono
    const cliente = await this.clientesService.findByTelefono(telefono);
    if (!cliente) {
      this.logger.debug(`Cliente no encontrado: ${telefono}`);
      return;
    }
    
    // Buscar recordatorio pendiente ENVIADO
    const recordatorio = await this.recordatoriosService
      .findPendienteByCliente(cliente.id);
    
    if (!recordatorio) {
      this.logger.debug(`Sin recordatorio pendiente para: ${cliente.nombre}`);
      return;
    }
    
    // Regex flexible para confirmar
    if (texto.match(/^(confirmar|confirmo|si|sí|ok|vale|acepto)$/)) {
      await this.recordatoriosService.confirmar(recordatorio.id, texto);
      
      const config = await this.getConfiguracion();
      await message.reply(config.plantillaConfirmacion);
      
      this.logger.log(`Turno confirmado por ${cliente.nombre}`);
    }
    
    // Regex flexible para cancelar
    else if (texto.match(/^(cancelar|cancelo|no|cancela)$/)) {
      await this.recordatoriosService.cancelar(recordatorio.id, texto);
      
      const config = await this.getConfiguracion();
      await message.reply(config.plantillaCancelacion);
      
      this.logger.log(`Turno cancelado por ${cliente.nombre}`);
    }
  } catch (error) {
    this.logger.error('Error procesando mensaje', error);
  }
});
```

**Métodos helper:**
```typescript
// Formatear teléfono a WhatsApp ID
async formatearTelefonoWhatsApp(codArea: string, numero: string): Promise<string> {
  return `549${codArea}${numero}@c.us`;
}

// Limpiar número de WhatsApp a formato local
limpiarTelefono(whatsappId: string): string {
  // Convertir 549XXXXXXXXX@c.us a codArea + numero
  // Ejemplo: 5493515551234@c.us → 351 + 5551234
}

// Obtener configuración (singleton)
async getConfiguracion(): Promise<ConfiguracionBot> {
  let config = await this.configRepo.findOne({ where: {} });
  if (!config) {
    config = this.configRepo.create({});
    await this.configRepo.save(config);
  }
  return config;
}

// Actualizar configuración
async updateConfiguracion(dto: UpdateConfiguracionDto): Promise<ConfiguracionBot> {
  const config = await this.getConfiguracion();
  Object.assign(config, dto);
  return this.configRepo.save(config);
}
```

---

#### **2.6 Actualizar ClientesService**

**Archivo:** `src/api/clientes/clientes.service.ts`

**Agregar método:**
```typescript
async findByTelefono(telefono: string): Promise<Cliente | null> {
  // telefono viene como: 3515551234 (sin 549)
  
  // Extraer código de área y número
  // Ejemplo: 3515551234
  // codArea puede ser 2-5 dígitos, numero 6-8 dígitos
  
  // Opción 1: Buscar por concatenación exacta
  const cliente = await this.clienteRepo
    .createQueryBuilder('cliente')
    .where("CONCAT(cliente.codArea, cliente.numero) = :telefono", { telefono })
    .getOne();
  
  return cliente;
}
```

---

#### **2.7 Actualizar TurnosService**

**Archivo:** `src/api/turnos/turnos.service.ts`

**Modificar método `create`:**
```typescript
async create(createTurnoDto: CreateTurnoDto) {
  // ... lógica existente ...
  
  const turno = await this.turnoRepo.save(nuevoTurno);
  
  // NUEVO: Crear recordatorios automáticamente
  await this.recordatoriosService.crearRecordatoriosParaTurno(turno);
  
  return turno;
}
```

**Agregar filtros a `findAll`:**
```typescript
async findAll(filtros?: {
  estado?: EstadoTurno;
  clienteId?: string;
  fecha?: string; // YYYY-MM-DD
  fechaDesde?: string;
  fechaHasta?: string;
  mes?: number; // 1-12
  anio?: number;
}) {
  const query = this.turnoRepo.createQueryBuilder('turno');
  
  if (filtros?.estado) {
    query.andWhere('turno.estado = :estado', { estado: filtros.estado });
  }
  
  if (filtros?.clienteId) {
    query.andWhere('turno.cliente.id = :clienteId', { clienteId: filtros.clienteId });
  }
  
  if (filtros?.fecha) {
    // Turnos del día específico
    query.andWhere('DATE(turno.fechaInicio) = :fecha', { fecha: filtros.fecha });
  }
  
  if (filtros?.fechaDesde && filtros?.fechaHasta) {
    query.andWhere('turno.fechaInicio BETWEEN :desde AND :hasta', {
      desde: filtros.fechaDesde,
      hasta: filtros.fechaHasta,
    });
  }
  
  if (filtros?.mes && filtros?.anio) {
    query.andWhere('strftime("%m", turno.fechaInicio) = :mes', { 
      mes: filtros.mes.toString().padStart(2, '0') 
    });
    query.andWhere('strftime("%Y", turno.fechaInicio) = :anio', { 
      anio: filtros.anio.toString() 
    });
  }
  
  return query.getMany();
}
```

---

#### **2.8 RecordatoriosController**

**Archivo:** `src/api/recordatorios/recordatorios.controller.ts`

**Endpoints:**
```typescript
@Controller('recordatorios')
export class RecordatoriosController {
  @Get()
  findAll(@Query() filtros: FiltrosRecordatorioDto) {
    return this.recordatoriosService.findAll(filtros);
  }

  @Get('pendientes')
  findPendientes() {
    return this.recordatoriosService.findAll({ estado: EstadoRecordatorio.PENDIENTE });
  }

  @Get('turno/:turnoId')
  findByTurno(@Param('turnoId') turnoId: string) {
    return this.recordatoriosService.findByTurno(turnoId);
  }

  @Post(':id/enviar')
  enviar(@Param('id') id: string) {
    return this.recordatoriosService.enviarRecordatorio(id);
  }

  @Post(':id/reenviar')
  reenviar(@Param('id') id: string) {
    return this.recordatoriosService.reenviarRecordatorio(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recordatoriosService.remove(id);
  }
}
```

---

#### **2.9 Actualizar AppModule**

**Archivo:** `src/main/app.module.ts`

```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { RecordatoriosModule } from '../api/recordatorios/recordatorios.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),  // ← AGREGAR
    TypeOrmModule.forRoot({...}),
    ClientesModule,
    TratamientosModule,
    TurnosModule,
    WhatsappModule,
    RecordatoriosModule,  // ← AGREGAR
  ],
})
export class AppModule {}
```

---

### **FASE 3: Dashboard de WhatsApp Bot** (4-5 horas)

#### **3.1 Expandir Página de WhatsApp**

**Archivo:** `src/render/app/features/whatsapp/whatsapp.tsx`

**Estructura con Tabs de shadcn/ui:**

```tsx
<Tabs defaultValue="estado">
  <TabsList>
    <TabsTrigger value="estado">Estado & Conexión</TabsTrigger>
    <TabsTrigger value="recordatorios">Recordatorios</TabsTrigger>
    <TabsTrigger value="configuracion">Configuración</TabsTrigger>
    <TabsTrigger value="manual">Envío Manual</TabsTrigger>
  </TabsList>

  <TabsContent value="estado">
    {/* Contenido actual de la página */}
  </TabsContent>

  <TabsContent value="recordatorios">
    {/* Tabla de recordatorios */}
  </TabsContent>

  <TabsContent value="configuracion">
    {/* Form de configuración */}
  </TabsContent>

  <TabsContent value="manual">
    {/* Form de envío manual */}
  </TabsContent>
</Tabs>
```

---

**Tab 1: Estado & Conexión** (ya implementado, mantener)
- Badge de estado
- QR code para vincular
- Botones de iniciar/cerrar sesión

---

**Tab 2: Recordatorios**

**Componentes:**

**A) Barra de filtros:**
```tsx
- Select: Estado (filter)
- DateRangePicker: Rango de fechas
- Input: Buscar por cliente
- Badge: Contador de pendientes
```

**B) Tabla de recordatorios:**
```tsx
Columnas:
- Cliente (nombre + apellido)
- Turno (fecha + hora)
- Tipo (badge: "24h antes" o "1h antes")
- Estado (badge con color)
- Programado (fechaEnvio)
- Enviado (fechaEnviado o "-")
- Respuesta (respuestaCliente o "-")
- Acciones (Ver detalle, Reenviar si fallido)

Estados y colores:
- PENDIENTE → yellow
- ENVIADO → blue
- CONFIRMADO → green
- CANCELADO → red
- FALLIDO → red destructive
```

**C) Botones de acción:**
```tsx
- "Enviar pendientes ahora" → Trigger manual del cron
- "Actualizar" → Refrescar tabla
```

**D) Dialog de detalle:**
```tsx
- Información completa del recordatorio
- Timeline del flujo
- Mensaje enviado
- Respuesta del cliente
- Error si existe
- Botón reenviar
```

**Endpoints a usar:**
- `GET /recordatorios?estado=X&fechaDesde=X&fechaHasta=X`
- `POST /recordatorios/:id/enviar`
- `POST /recordatorios/:id/reenviar`

---

**Tab 3: Configuración**

**Form con react-hook-form:**

```tsx
Secciones:

1. General
   - Switch: Recordatorios activos
   - Switch: Enviar mensaje de cancelación automática

2. Auto-cancelación
   - NumberInput: Tiempo antes del turno (minutos)
   - Helper text: "Si el cliente no confirma X minutos antes, el turno se cancelará automáticamente"

3. Restricción horaria
   - Switch: Activar restricción
   - TimeInput: Hora inicio (default 08:00)
   - TimeInput: Hora fin (default 21:00)
   - Helper text: "Los mensajes solo se enviarán dentro de este horario"

4. Plantillas de mensajes
   - Textarea: plantillaDiaAnterior
   - Textarea: plantillaUnaHoraAntes
   - Textarea: plantillaConfirmacion
   - Textarea: plantillaCancelacion
   - Textarea: plantillaCancelacionAuto
   
   Variables disponibles (mostrar como chips):
   - {cliente} → Nombre del cliente
   - {fecha} → Fecha del turno
   - {hora} → Hora del turno
   - {tratamientos} → Lista de tratamientos

Botón: "Guardar configuración"
```

**Endpoints a usar:**
- `GET /whatsapp/config`
- `PUT /whatsapp/config`

---

**Tab 4: Envío Manual**

**Form simple:**
```tsx
1. Select: Cliente (combobox con búsqueda)
   - Muestra: nombre + apellido + teléfono
   - Búsqueda por nombre

2. Textarea: Mensaje
   - MaxLength: 1000 caracteres
   - Contador de caracteres
   - Preview del teléfono de destino

3. Botón: "Enviar mensaje"

4. Historial de mensajes manuales (tabla simple):
   - Cliente
   - Mensaje (truncado)
   - Fecha envío
   - Estado (éxito/error)
```

**Endpoint a usar:**
- `POST /whatsapp/send`

**Almacenar historial:**
- Crear tabla opcional `mensaje_manual` o
- Reutilizar `Recordatorio` con tipo `MANUAL`

---

### **FASE 4: Mejoras y Funcionalidades Adicionales** (3-4 horas)

#### **4.1 Editar Clientes**

**Modificar:** `src/render/app/features/clientes/components/clientes-modal.tsx`

**Agregar prop `clienteId?: string`:**
- Si `clienteId` existe, es modo edición
- Cargar datos con `GET /clientes/:id`
- Pre-llenar formulario
- Cambiar título a "Editar Cliente"
- Submit hace `PATCH /clientes/:id` en vez de `POST`

**Actualizar tabla de clientes:**
- Botón "Editar" que abre modal con `clienteId`

---

#### **4.2 Editar Tratamientos**

**Modificar:** `src/render/app/features/tratamientos/components/tratamientos-modal.tsx`

**Similar a clientes:**
- Prop `tratamientoId?: string`
- Modo edición con datos pre-cargados
- `PATCH /tratamientos/:id`

**Nota:** Al editar precio, backend ya crea registro de historial automáticamente ✅

---

#### **4.3 Editar/Reagendar Turnos**

**Modificar:** `src/render/app/features/turnos/components/turnos-modal.tsx`

**Agregar prop `turnoId?: string`:**
- Modo edición con wizard pre-cargado
- Deshabilitar cambio de cliente (inmutable)
- Permitir cambiar:
  - Tratamientos
  - Fecha
  - Hora
  - Notas

**Lógica especial:**
- Al cambiar fecha/hora, validar disponibilidad nuevamente
- Si hay recordatorios ENVIADOS/CONFIRMADOS:
  - Opción 1: Eliminar viejos y crear nuevos
  - Opción 2: Actualizar fechas de recordatorios existentes
  - **Decisión:** Eliminar viejos (estado CANCELADO) y crear nuevos

**Backend:**
- Modificar `TurnosService.update()`:
  - Al actualizar fecha, regenerar recordatorios

---

#### **4.4 Estadísticas en Dashboard**

**Componentes a agregar en `principal.tsx`:**

**Gráfico 1: Turnos por día (última semana)**
```tsx
<BarChart> usando recharts
- Eje X: Días de la semana
- Eje Y: Cantidad de turnos
- Colores por estado
```

**Gráfico 2: Tratamientos más solicitados**
```tsx
<PieChart> usando recharts
- Top 5 tratamientos
- Porcentaje de total
```

**Métrica: Tasa de confirmación**
```tsx
Card con Progress bar
- Total turnos con recordatorio enviado / confirmados
- Porcentaje
```

**Endpoints necesarios:**
- `GET /turnos/stats/por-dia?dias=7`
- `GET /tratamientos/stats/mas-solicitados?limit=5`
- `GET /recordatorios/stats/tasa-confirmacion`

*Estos endpoints son opcionales y se pueden implementar después si no son prioritarios.*

---

## 🧪 Plan de Testing

### Testing Manual Sugerido:

**1. Crear turno → Verificar recordatorios generados**
```
1. Crear cliente
2. Crear tratamiento de 30min
3. Agendar turno para mañana a las 10:00
4. Verificar en DB:
   - 2 recordatorios creados
   - fechaEnvio correctas (hoy 10:00 y mañana 09:00)
```

**2. Simular envío de recordatorio**
```
1. Modificar fechaEnvio de un recordatorio a "ahora - 1 min"
2. Esperar 5 min (cron job)
3. Verificar:
   - Mensaje enviado por WhatsApp
   - Estado = ENVIADO
   - fechaEnviado != null
```

**3. Responder confirmación**
```
1. Desde WhatsApp del cliente, enviar "Confirmar"
2. Verificar:
   - Recordatorio.estado = CONFIRMADO
   - Turno.estado = CONFIRMADO
   - Mensaje de confirmación recibido
```

**4. Auto-cancelación**
```
1. Crear turno para dentro de 1 hora
2. Modificar fechaEnvio del recordatorio DIA_ANTERIOR a "hace 1 día"
3. Forzar envío
4. NO responder
5. Esperar 10 min (cron de auto-cancelación)
6. Verificar:
   - Turno.estado = CANCELADO
   - Recordatorio.estado = CANCELADO
   - Mensaje de cancelación enviado (si config activa)
```

---

## 📊 Resumen Final

### Archivos Totales:
- **Nuevos:** 16 archivos
- **Modificados:** 13 archivos
- **Dependencias:** 2 paquetes npm

### Tiempo Estimado:
- **FASE 1:** 3-4 horas
- **FASE 2:** 5-6 horas
- **FASE 3:** 4-5 horas
- **FASE 4:** 3-4 horas
- **TOTAL:** 15-19 horas

### Orden de Implementación:
1. Instalar `@nestjs/schedule`
2. FASE 2 (Backend de recordatorios) → Base fundamental
3. FASE 1.1 (Tratamientos) → Para probar patrón
4. FASE 1.2 (Turnos) → Core de la app
5. FASE 3 (Dashboard Bot) → Visualización
6. FASE 1.3 + 1.4 (Cliente detalle + Dashboard) → Info adicional
7. FASE 4 (Ediciones) → Refinamiento
8. Testing completo del flujo

---

## ✅ Checklist Pre-Implementación

- [x] Confirmación de decisiones arquitectónicas
- [x] Revisar plantillas de mensajes
- [x] Definir variables en plantillas
- [x] Confirmar horarios de restricción por defecto
- [x] Decidir sobre almacenamiento de mensajes manuales
- [ ] Backup de base de datos antes de empezar
- [ ] Git branch para desarrollo

---

## 🚀 Próximos Pasos

1. Crear backup de `db.sql`
2. Crear branch de desarrollo: `git checkout -b feature/sistema-recordatorios`
3. Instalar dependencias necesarias
4. Comenzar implementación siguiendo el orden propuesto
5. Testing incremental después de cada fase
6. Documentar cualquier desviación del plan
