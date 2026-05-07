# PLAN DE PRODUCTO E IMPLEMENTACION

## Sistema de Gestion de Salon - Estado Real del Proyecto

Este documento reemplaza el plan anterior.

El objetivo ya no es construir la app desde cero, sino ordenar, estabilizar y completar una base que ya tiene gran parte del producto funcionando.

---

## 1. Estado actual

### Ya implementado

- Clientes
  - CRUD
  - busqueda y paginacion
  - detalle del cliente
  - estadisticas basicas por cliente

- Tratamientos
  - CRUD
  - historial de precios
  - tabla y detalle

- Turnos
  - alta de turnos
  - listado con filtros basicos en frontend
  - detalle de turno
  - cambio de estados
  - calculo de disponibilidad
  - calendario

- Pagos
  - registro de pagos por turno
  - calculo de deuda

- Configuracion del salon
  - horarios semanales
  - temporadas
  - dias especiales
  - resolucion de horarios por fecha

- WhatsApp / recordatorios
  - conexion con QR
  - estado de sesion
  - envio manual simple
  - cron para procesar recordatorios
  - lista de recordatorios
  - plantillas y configuracion basica

- Dashboard principal
  - metricas generales
  - proximos turnos del dia

### Conclusiones del estado actual

- La app ya supero el nivel MVP basico.
- El mayor valor ya esta en el flujo operativo real: clientes, turnos, tratamientos, pagos y horarios.
- El principal problema actual no es la falta de features, sino la consistencia tecnica.
- El modulo mas delicado hoy es WhatsApp / recordatorios.

---

## 2. Objetivo de esta nueva etapa

### Objetivo principal

Convertir la base actual en una aplicacion confiable para uso diario, con reglas claras, menos inconsistencias y una hoja de ruta realista para crecer.

### Objetivos concretos

1. Corregir inconsistencias funcionales y tecnicas.
2. Cerrar flujos incompletos del core del negocio.
3. Ordenar arquitectura y configuracion del proyecto.
4. Mejorar observabilidad, mantenibilidad y portabilidad.
5. Recién despues de eso, sumar features nuevas de alto valor.

---

## 3. Problemas detectados y prioridades

## Prioridad critica

### 3.1 Validaciones backend no aplicadas globalmente

Problema:
- Se usan DTOs con `class-validator`, pero hoy no esta activado un `ValidationPipe` global en Nest.

Impacto:
- Requests invalidos pueden llegar a servicios y romper flujos o guardar datos inconsistentes.

Archivos involucrados:
- `src/main/index.ts`

Accion:
- Agregar validacion global con transform y whitelist.

---

### 3.2 Inconsistencias en el flujo de recordatorios

Problema:
- La semantica de tipos y configuraciones de recordatorio esta cruzada.
- Hay reglas de envio que parecen invertidas.
- Parte del flujo de confirmacion/cancelacion vive fuera de un flujo centralizado.

Impacto:
- Riesgo de enviar mensajes incorrectos o cancelar/enviare mal.
- Es la zona con mas probabilidad de bugs funcionales reales.

Archivos involucrados:
- `src/api/whatsapp/recordatorio.service.ts`
- `src/api/whatsapp/respuesta-handler.service.ts`
- `src/api/whatsapp/entities/recordatorio.entity.ts`
- `src/api/whatsapp/entities/configuracion-recordatorio.entity.ts`

Acciones:
- Redefinir tipos de recordatorio y reglas de negocio.
- Unificar quien cambia estados del turno.
- Revisar plantillas y triggers.
- Definir claramente que pasa al confirmar, cancelar, fallar o reenviar.

---

### 3.3 Estados de turno inconsistentes

Problema:
- Hay mezcla entre `completado` y `realizado` segun el archivo.

Impacto:
- Badges rotos, metricas incorrectas, filtros inconsistentes y deuda tecnica futura.

Archivos involucrados:
- `src/api/turnos/entities/turno.entity.ts`
- `src/render/hooks/use-turnos.ts`
- `src/render/hooks/use-dashboard.ts`
- `src/render/app/features/clientes/clienteDetalle.tsx`

Accion:
- Elegir un unico naming y aplicarlo en backend, hooks, UI y textos.

---

### 3.4 Alta de turnos con selector de clientes incompleto

Problema:
- La pantalla de nuevo turno consume la lista paginada y hoy solo ve los primeros clientes.

Impacto:
- En salones con mas clientes, el flujo de alta se rompe o queda limitado.

Archivos involucrados:
- `src/render/app/features/turno/nuevo.tsx`
- `src/api/clientes/clientes.controller.ts`

Accion:
- Crear una estrategia real para selector de clientes:
  - endpoint dedicado de busqueda,
  - carga incremental,
  - o lista sin paginar solo para combobox.

---

### 3.5 Edicion de turnos incompleta

Problema:
- `UpdateTurnoDto` permite cambios que el servicio no termina de procesar bien, especialmente tratamientos.

Impacto:
- Cuando se agregue o mejore UI de edicion, va a fallar o quedar inconsistente.

Archivos involucrados:
- `src/api/turnos/dto/update-turno.dto.ts`
- `src/api/turnos/turnos.service.ts`

Acciones:
- Soportar de verdad cambio de tratamientos.
- Revalidar solapamientos al editar fecha/hora.
- Definir politica clara sobre recordatorios existentes al reagendar.

---

## Prioridad alta

### 3.6 URL de API hardcodeada en frontend

Problema:
- Hay multiples `http://localhost:3000` repetidos.

Impacto:
- Peor mantenibilidad, peor portabilidad y mas riesgo en build o empaquetado.

Accion:
- Centralizar base URL en cliente API unico.

---

### 3.7 Telefono de cliente mal modelado para unicidad

Problema:
- `numero` es unico por si solo, sin contemplar `codArea`.

Impacto:
- Dos clientes con mismo numero local en distintas ciudades no podrian coexistir.

Archivos involucrados:
- `src/api/clientes/entities/cliente.entity.ts`
- `src/api/clientes/clientes.service.ts`

Accion:
- Pasar a unicidad por telefono completo o por `codArea + numero`.

---

### 3.8 Dependencias de entorno local en WhatsApp

Problema:
- Se usa `executablePath: '/usr/bin/chromium'` y almacenamiento de sesion sensible al entorno.

Impacto:
- Riesgo alto al correr fuera de la maquina actual o al empaquetar.

Archivos involucrados:
- `src/api/whatsapp/whatsapp.service.ts`

Acciones:
- Hacerlo configurable.
- Revisar estrategia de sesion y ubicacion de archivos.

---

### 3.9 Router de Electron y configuracion del proyecto

Problema:
- El render usa `BrowserRouter`.
- Hay aliases inconsistentes y docs desactualizadas.

Impacto:
- Posibles problemas en produccion con rutas.
- Friccion para mantenimiento.

Archivos involucrados:
- `src/render/main.tsx`
- `tsconfig.json`
- `README.md`

Acciones:
- Revisar si conviene pasar a `HashRouter`.
- Corregir alias.
- Actualizar README y documentacion real del proyecto.

---

## Prioridad media

### 3.10 Tooling y calidad

Problema:
- No hay tests.
- `lint-staged` no esta haciendo control real.
- Falta cerrar el circuito de calidad minima.

Acciones:
- Dejar ESLint realmente operativo.
- Definir un set minimo de pruebas.
- Agregar checklist de smoke testing manual.

---

## 4. Roadmap propuesto

### Fase 0 - Estabilizacion base

Objetivo:
- Corregir lo que hoy puede generar bugs funcionales o decisiones tecnicas caras de arrastrar.

Items:
- Activar `ValidationPipe` global.
- Unificar naming de estados de turno.
- Centralizar base URL de API.
- Corregir selector de clientes en alta de turnos.
- Revisar excepciones backend para usar clases de Nest en vez de `Error` generico.
- Corregir alias de TypeScript y actualizar README.

Resultado esperado:
- Base mas estable, predecible y facil de mantener.

---

### Fase 1 - Cerrar core operativo de turnos

Objetivo:
- Asegurar que el modulo central del negocio quede completo.

Items:
- Implementar edicion/reagendado de turnos.
- Permitir cambio real de tratamientos en update.
- Revalidar disponibilidad al editar.
- Mejorar filtros de turnos desde backend.
- Mejorar dashboard para consumir filtros/metricas server-side donde convenga.

Resultado esperado:
- Flujo de turnos listo para operacion real sin atajos raros.

---

### Fase 2 - Rehacer y endurecer recordatorios

Objetivo:
- Volver confiable el modulo de WhatsApp, que hoy es potente pero fragil.

Items:
- Redefinir tipos de recordatorio.
- Unificar reglas de envio, confirmacion, cancelacion y reenviado.
- Centralizar actualizacion de turnos a traves de servicios y no por acceso directo a repositorios.
- Agregar auto-cancelacion solo si la regla de negocio sigue teniendo sentido.
- Mejorar estados, logs y mensajes de error.
- Clarificar configuracion de plantillas y ventanas horarias.

Resultado esperado:
- Recordatorios confiables, auditables y mas faciles de evolucionar.

---

### Fase 3 - Mejoras de operacion y administracion

Objetivo:
- Dar mas control diario al salon.

Items:
- Pantalla propia de pagos / caja.
- Historial de pagos y deuda por cliente.
- Filtros avanzados para clientes y turnos.
- Alertas de proximos turnos sin confirmar.
- Indicadores de no-show / ausencias.

Resultado esperado:
- Mejor soporte para la gestion diaria, no solo para agendar.

---

### Fase 4 - Dashboard y metricas de negocio

Objetivo:
- Transformar la app en una herramienta tambien de seguimiento comercial.

Items:
- Ingresos por periodo.
- Tratamientos mas solicitados.
- Tasa de confirmacion de turnos.
- Cancelaciones y ausencias por periodo.
- Valor promedio por turno.
- Ranking simple de clientes frecuentes.

Resultado esperado:
- Decisiones de negocio basadas en datos, no solo operacion.

---

### Fase 5 - Nuevas features de producto

Estas ideas no son urgentes, pero tienen mucho valor potencial.

#### 5.1 Señas / anticipos
- Permitir registrar seña al reservar.
- Descontarla del pago final.
- Muy util para bajar cancelaciones.

#### 5.2 Lista de espera
- Cuando un turno se cancela, poder reasignarlo rapido.
- Muy buena mejora para ocupacion.

#### 5.3 Recordatorios manuales por cliente
- No atados a un turno puntual.
- Util para seguimiento comercial o reactivacion.

#### 5.4 Campañas simples
- Cumpleaños.
- Clientes inactivos hace X dias.
- Promociones puntuales.

#### 5.5 Multi-profesional
- Si el producto crece, separar agendas por profesional o box.

#### 5.6 Exportes
- Exportar clientes, turnos, pagos o reportes a CSV/PDF.

#### 5.7 Backup y restauracion
- Flujo simple para respaldar base de datos.
- Recomendado antes de pensar en mas features complejas.

---

## 5. Decisiones tecnicas recomendadas

### Mantener
- Electron + NestJS + React.
- SQLite mientras siga siendo app desktop local.
- Enfoque modular por dominio.

### Ordenar
- Un cliente HTTP compartido en frontend.
- Nombres y enums unificados.
- Mas logica de negocio en servicios y menos duplicacion en hooks/componentes.
- Documentacion y plan vivos, no historicos.

### Evitar
- Seguir agregando features arriba de flujos inconsistentes.
- Duplicar reglas de estado en frontend y backend.
- Hardcodes de entorno local.

---

## 6. Configuraciones y mejoras de proyecto recomendadas

### Documentacion
- Reescribir `README.md` para que describa el producto real.
- Documentar setup de WhatsApp, base de datos y comandos utiles.

### Calidad
- Verificar configuracion real de ESLint.
- Hacer que `lint-staged` ejecute checks concretos.
- Definir aunque sea tests minimos para reglas de negocio sensibles.

### Infra local
- Definir politica de backups de `db.sql`.
- Revisar ubicacion de almacenamiento de sesion de WhatsApp.
- Hacer configurable Chromium / navegador si sigue siendo necesario.

---

## 7. Orden sugerido de trabajo

1. Fase 0 - Estabilizacion base.
2. Fase 1 - Cerrar core de turnos.
3. Fase 2 - Endurecer recordatorios.
4. Fase 3 - Operacion y caja.
5. Fase 4 - Dashboard y metricas.
6. Fase 5 - Features nuevas de producto.

---

## 8. Checklist de proxima ejecucion

- [ ] Activar validacion global en Nest.
- [ ] Unificar `completado` vs `realizado`.
- [ ] Centralizar base URL de API.
- [ ] Corregir selector de clientes en nuevo turno.
- [ ] Arreglar `TurnoService.update()` para tratamientos y reagendado.
- [ ] Revisar flujo completo de recordatorios.
- [ ] Corregir unicidad de telefono.
- [ ] Revisar `BrowserRouter` en Electron.
- [ ] Actualizar `README.md`.
- [ ] Definir minima estrategia de testeo.

---

## 9. Criterio de exito

Vamos a considerar esta etapa bien cerrada cuando:

- crear, editar, cancelar y completar turnos sea confiable;
- clientes, tratamientos y pagos no tengan inconsistencias de datos;
- recordatorios funcionen con reglas claras;
- el proyecto pueda correr en otra maquina sin depender de hardcodes locales;
- la base quede lo bastante prolija como para sumar features nuevas sin miedo.

---

## 10. Nota final

La app ya tiene mucho trabajo real adentro y vale la pena cuidarla.

La prioridad correcta ahora no es "hacer todo lo que faltaba del plan viejo", sino:

1. ordenar lo que ya existe,
2. corregir lo que hoy es fragil,
3. completar lo mas importante del negocio,
4. y despues crecer con criterio.
