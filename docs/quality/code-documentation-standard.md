# Norma de documentación del código fuente

## Propósito

Establecer una documentación estructural mínima, verificable y mantenible para el código fuente de QvaPay-AI.

## Encabezado obligatorio de archivo

Todo archivo mantenido bajo `src/`, excepto declaraciones generadas `*.d.ts`, debe comenzar con un bloque JSDoc que incluya:

- `@archivo`: ruta lógica del archivo;
- `@proposito`: propósito funcional;
- `@responsabilidades`: responsabilidades principales;
- `@ubicacion`: ubicación dentro de la arquitectura.

La documentación debe estar en español. Los identificadores técnicos, rutas, nombres de librerías y contratos externos permanecen en su forma técnica.

## APIs públicas

Las funciones, clases y métodos públicos que expresen comportamiento deben documentar su contrato cuando el significado no sea evidente por el tipo. La documentación debe explicar parámetros, retorno, efectos relevantes y restricciones de negocio.

## Verificación

El control automatizado se ejecuta mediante `npm run check:code-docs` y forma parte del control de calidad del repositorio.

La ausencia de documentación no se corrige con excepciones silenciosas.
