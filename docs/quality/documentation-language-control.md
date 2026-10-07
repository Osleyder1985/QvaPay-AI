# Control lingüístico documental

## Propósito

Este documento define el uso normativo del control lingüístico documental del repositorio. El control debe verificar que la prosa authored por el proyecto esté en español sin alterar identificadores, contratos, comandos, nombres técnicos ni texto externo legítimo.

## Artefactos normativos

- `config/documentation-language-exceptions.schema.json`: contrato estructural del catálogo.
- `config/documentation-language-exceptions.json`: catálogo candidato. Todas las entradas actuales están en estado `PROPOSED` y no autorizan PASS.
- Issue #302: diseño, trazabilidad, criterios de prueba y certificación.

## Regla lingüística

La prosa authored, los textos de interfaz, comentarios, JSDoc/TSDoc, descripciones de pruebas, mensajes de error, logs y mensajes de CI deben estar en español.

## Elementos preservados

Los identificadores, rutas, claves de API, valores contractuales, literales persistidos, comandos, tecnologías, protocolos y estándares se preservan cuando su traducción rompería compatibilidad o alteraría su identidad técnica.

## Excepciones

Una excepción debe ser específica, contextual, justificada en español, atribuida a un responsable y respaldada por evidencia. `PROPOSED`, `REVIEW_REQUIRED`, `EXPIRED` y `REVOKED` no autorizan PASS. Solo `ACTIVE` puede autorizar una coincidencia y siempre dentro de su alcance.

## Procedencia externa

El texto recibido desde QvaPay u otro proveedor se clasifica por procedencia. No debe traducirse automáticamente ni utilizarse como justificación para mantener mensajes authored en inglés.

## Certificación

La ejecución correcta del control no constituye por sí sola certificación lingüística. La certificación requiere evidencia reproducible, ausencia de hallazgos bloqueantes, catálogo válido, pruebas completas y trazabilidad hasta los requisitos normativos.

## Estado

**Diseño cerrado. Implementación controlada en preparación. Ninguna excepción del catálogo está activa.**
