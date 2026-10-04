# Línea base de seguridad

## Principios

- mínimo privilegio;
- separación de secretos;
- validación de entradas;
- no exponer credenciales al navegador;
- aislamiento de integraciones externas;
- trazabilidad;
- fallo seguro.

## Secretos

Las credenciales de QvaPay y Cloudflare no deben almacenarse en código, documentación ni archivos versionados.

## API

La API deberá validar entradas y autenticar las operaciones que modifiquen configuración.

## Integración externa

Las respuestas de QvaPay se consideran datos no confiables hasta ser validadas.

## Registro de eventos

No registrar tokens, credenciales, cookies ni información sensible.

## Disponibilidad

Los errores externos no deben producir ciclos de reintento descontrolados.

## Evolución

La línea base deberá ampliarse cuando se incorporen autenticación de usuarios, alertas, operaciones financieras o ejecución de órdenes.