# Regla de reparación automática de formato

## Objetivo

Evitar correcciones manuales repetitivas cuando Prettier detecta diferencias de estilo. La reparación debe ejecutarse antes de invertir tiempo en revisar cada diferencia a mano.

## Regla operativa obligatoria

1. Si `npm run format:check` falla por formato, ejecutar `npm run format:fix` en la rama de trabajo.
2. Revisar el diff producido para confirmar que solo contiene cambios de formato y que no modifica comportamiento.
3. Volver a ejecutar `npm run format:check`.
4. Ejecutar los controles de calidad pertinentes, al menos `npm run build` y las pruebas afectadas.
5. Confirmar los cambios de formato en la misma rama y dejar que CI vuelva a ejecutarse.
6. Si el control sigue fallando, consultar la salida real de Prettier y corregir la causa concreta; no repetir cambios manuales especulativos.

## Alcance y límites

- `format:fix` aplica Prettier a los archivos cubiertos por la configuración del repositorio.
- `format:check` sigue siendo el control de integración obligatorio; no se sustituye por una ejecución de escritura que oculte diferencias.
- Prettier solo corrige formato. No repara errores de TypeScript, pruebas, lógica, seguridad ni documentación semántica.
- No fusionar ni desplegar automáticamente por el hecho de que el formato quede corregido.

## Justificación normativa previa

- **ISO/IEC 25010:2023**: la mantenibilidad incluye consistencia y capacidad de analizar/modificar el software; automatizar el formato reduce ruido en revisiones y facilita cambios controlados.
- **ISO/IEC/IEEE 12207:2017**: la verificación del software debe ser repetible y formar parte del proceso de ciclo de vida; los controles de formato y calidad se vuelven a ejecutar después de la reparación.

## Evidencia de cumplimiento

La CI debe mostrar que `npm run format:check` pasa después de la reparación y que los controles de compilación/pruebas afectados también pasan. La existencia del comando, por sí sola, no certifica una ejecución correcta.

## Diagnóstico permanente en CI

Los flujos `.github/workflows/security-gate.yml` y `.github/workflows/quality-gate.yml` deben conservar el mismo paso permanente de diagnóstico de Prettier para que ambos controles principales produzcan evidencia equivalente. Si `npm run format:check` falla, el mismo paso debe:

1. Ejecutar `npm run format:fix` en el entorno temporal de CI.
2. Mostrar los archivos afectados y el diff exacto generado por Prettier.
3. Terminar en estado fallido aunque la reparación temporal haya dejado el directorio formateado. Así, el diagnóstico no convierte una rama incorrecta en una verificación aprobada ni oculta el cambio requerido.
4. Permitir que la corrección se aplique y confirme en la rama del PR; después se vuelve a ejecutar toda la CI.

El diff se usa como evidencia diagnóstica, no se confirma ni se publica automáticamente desde el job. La reparación permanente del código se realiza en la rama de trabajo y continúa sujeta a revisión, compilación, pruebas y controles de seguridad.
