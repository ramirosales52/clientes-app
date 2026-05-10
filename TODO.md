# TODO

## Prioridad critica

- [x] Activar `ValidationPipe` global en Nest con `transform` y `whitelist`.
- [x] Unificar estados de turno inconsistentes entre backend, hooks y UI.
- [x] Corregir el selector de clientes al crear turnos para no depender solo de la primera pagina.
- [x] Completar la edicion y reagendado de turnos en el backend.
- [x] Permitir cambio real de tratamientos en `TurnoService.update()`.
- [ ] Revalidar disponibilidad al editar fecha y hora de un turno.
- [x] Definir politica clara para recordatorios existentes cuando se reagenda un turno.
- [ ] Revisar el flujo completo de recordatorios y confirmaciones.
- [ ] Unificar quien cambia el estado del turno en el modulo de WhatsApp.
- [ ] Revisar plantillas, triggers y reglas de envio de recordatorios.

## Prioridad alta

- [ ] Centralizar la base URL de la API en un cliente compartido del frontend.
- [ ] Corregir la unicidad del telefono del cliente para contemplar codigo de area.
- [ ] Hacer configurable la ruta de Chromium en WhatsApp.
- [ ] Revisar la estrategia de sesion y ubicacion de archivos de WhatsApp.
- [ ] Revisar si conviene pasar el router de Electron a `HashRouter`.
- [ ] Corregir aliases de TypeScript y rutas importadas.
- [ ] Actualizar `README.md` para que describa el producto real.
- [ ] Reescribir documentacion de setup, base de datos y comandos utiles.

## Core operativo

- [ ] Mejorar filtros de turnos desde backend.
- [ ] Mejorar dashboard para consumir filtros y metricas server-side cuando convenga.
- [x] Agregar pantalla propia de pagos o caja.
- [x] Mostrar historial de pagos y deuda por cliente.
- [ ] Agregar filtros avanzados para clientes y turnos.
- [x] Agregar alertas de proximos turnos sin confirmar.
- [x] Agregar indicadores de no-show y ausencias.

## WhatsApp / recordatorios

- [ ] Redefinir tipos de recordatorio.
- [ ] Clarificar semantica de configuracion de recordatorios.
- [ ] Definir que pasa al confirmar, cancelar, fallar o reenviar.
- [ ] Agregar logs mas claros para el flujo de recordatorios.
- [ ] Hacer el modulo mas auditables y menos fragil.
- [ ] Revisar configuracion de plantillas y ventanas horarias.
- [ ] Evaluar auto-cancelacion solo si sigue teniendo sentido de negocio.

## Calidad y mantenimiento

- [ ] Verificar configuracion real de ESLint.
- [ ] Hacer que `lint-staged` ejecute checks concretos.
- [ ] Definir al menos pruebas minimas para reglas de negocio sensibles.
- [ ] Agregar checklist de smoke testing manual.
- [ ] Reducir logica de negocio duplicada en hooks y componentes.
- [ ] Centralizar mas logica en servicios.

## Datos y consistencia

- [ ] Revisar naming de `realizado` vs `completado` y elegir uno solo.
- [ ] Revisar badges, metricas y filtros afectados por el naming inconsistente.
- [ ] Confirmar que cliente, tratamientos y pagos no tengan inconsistencias de datos.
- [ ] Asegurar que la app pueda correr en otra maquina sin hardcodes locales.

## Features futuras

- [ ] Permitir registrar seña o anticipo al reservar.
- [ ] Descontar la seña del pago final.
- [ ] Crear lista de espera para reasignar turnos cancelados.
- [ ] Crear recordatorios manuales por cliente.
- [ ] Agregar campañas simples para clientes inactivos o cumpleaños.
- [ ] Soportar multi-profesional o multi-box si el producto crece.
- [ ] Exportar clientes, turnos, pagos y reportes a CSV o PDF.
- [ ] Agregar backup y restauracion simple de la base de datos.

## Orden sugerido

1. Estabilizacion base.
2. Cerrar core de turnos.
3. Endurecer recordatorios.
4. Mejoras de operacion y caja.
5. Dashboard y metricas.
6. Features nuevas de producto.
