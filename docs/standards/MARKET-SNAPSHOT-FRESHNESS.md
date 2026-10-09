# Frescura del snapshot de mercado

## Objetivo

Estimar la antigüedad de los datos sin depender de que el reloj del dispositivo esté sincronizado con el servidor.

## Criterio técnico

- serverNowAt representa la hora del servidor al generar la respuesta.
- receivedAt registra el instante local de recepción.
- La hora estimada del servidor es serverNowAt + (clientNow - receivedAt).
- Las marcas temporales ausentes, inválidas o incoherentes se clasifican como no verificables, no como datos actuales.
- Se conserva el umbral de frescura existente; no se inventa un SLA del proveedor.
- El sondeo del estado pasa a cinco segundos, separado del intervalo del Durable Object. Las solicitudes no se solapan.

## Justificación normativa

- ISO/IEC 25010:2023: fiabilidad y eficiencia de desempeño son criterios pertinentes para la clasificación temporal y el coste de sondeo.
- ISO/IEC 27001:2022, Anexo A 8.16: la monitorización debe proporcionar señales útiles y fiables; una frecuencia alta por sí sola no acredita mejor observabilidad.

## Verificación

Las pruebas deterministas cubren relojes locales adelantados y atrasados, antigüedad basada en la hora estimada del servidor, marcas ausentes o inválidas y marcas futuras. La cadencia de cinco segundos es una decisión inicial de carga/interacción, no un SLA ni una garantía de frescura del proveedor.
