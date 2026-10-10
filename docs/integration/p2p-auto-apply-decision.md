# Evaluación segura de decisiones Auto Apply

## Propósito y límites

El módulo `src/application/p2p-auto-apply-decision.ts` evalúa si una oferta satisface los parámetros configurados. Es una función pura: **no reserva ofertas, no invoca QvaPay y no ejecuta operaciones financieras**. Una decisión elegible no equivale a autorización de ejecución.

## Reglas

- Auto Apply debe estar habilitado explícitamente.
- La identidad y elegibilidad de la cuenta deben estar verificadas.
- La moneda debe coincidir, la oferta debe estar abierta y el snapshot debe estar dentro de la antigüedad máxima.
- BUY: tasa estrictamente menor que el umbral y CUP de la oferta menor o igual al límite.
- SELL: tasa estrictamente mayor que el umbral; cantidad QUSD dentro del límite configurado y del balance disponible y fresco.
- Una oferta restringida a VIP solo es elegible si la condición VIP está verificada.
- Configuración inválida o datos no verificables producen una decisión no elegible.

## Integración pendiente

Esta función todavía debe integrarse en el ciclo server-side del scanner y conectarse a la reserva D1 compartida `reserveP2POperation` / `claimP2POperation`. Esa integración debe registrar la decisión antes del POST, mantener el modo desactivado por defecto y tratar timeouts como ambiguos sin repetir el POST. La UI o el polling del navegador no pueden iniciar la ejecución.

## Justificación normativa previa al cambio

- ISO/IEC 25010:2023: fiabilidad, seguridad y comportamiento ante entradas inválidas.
- ISO/IEC/IEEE 29119-2:2021: pruebas de límites y regresión.
- ISO/IEC/IEEE 12207:2017: trazabilidad entre requisito, código, prueba y documentación.

Estas referencias son criterios de diseño y verificación, no una declaración de certificación.
