# Frescura del snapshot de mercado

## Objetivo

Estimar la antigüedad de los datos sin depender de que el reloj del dispositivo esté sincronizado con el servidor.

## Criterio técnico

- serverNowAt representa la hora del servidor al generar la respuesta.
- receivedAt registra el instante local de recepción.
- La hora estimada del servidor es serverNowAt + (clientNow - receivedAt).
- Las marcas temporales ausentes, inválidas o incoherentes se clasifican como no verificables, no como datos actuales.
- Se conserva el umbral de frescura existente; no se inventa un SLA del proveedor.
- El sondeo HTTP de estado usa cinco segundos como cadencia inicial, separado del intervalo del Durable Object y del contador visual local.
- La interfaz no programa nuevas consultas mientras el documento está oculto; al volver a estar visible o recuperar conectividad, solicita una reconciliación inmediata.
- Ante fallos de transporte o contrato, el sondeo aplica backoff exponencial desde cinco segundos hasta un máximo de sesenta segundos; una respuesta válida restablece la cadencia inicial.
- Las solicitudes no se solapan. Esta política controla únicamente la lectura del estado por el navegador: no pausa ni modifica el escáner server-side.

## Justificación normativa

- ISO/IEC 25010:2023: eficiencia de desempeño y fiabilidad orientan la reducción de solicitudes redundantes y la recuperación controlada del cliente.
- ISO 9241-110:2020: autodescriptividad y controlabilidad orientan la separación entre el contador local y el estado autoritativo del servidor.
- ISO/IEC/IEEE 29119-1: las regresiones deben comprobar la cadencia, la visibilidad del documento, la recuperación de conectividad y los límites del backoff.
- ISO/IEC 27001:2022, Anexo A 8.16: la monitorización debe proporcionar señales útiles y fiables; una frecuencia alta por sí sola no acredita mejor observabilidad.

## Verificación

La integración requiere que los controles de calidad, seguridad y navegador se ejecuten sobre el HEAD exacto del PR; los resultados de un commit anterior no sustituyen esa evidencia.

Las pruebas deterministas cubren relojes locales adelantados y atrasados, antigüedad basada en la hora estimada del servidor, marcas ausentes o inválidas y marcas futuras. La cadencia de cinco segundos es una decisión inicial de carga/interacción, no un SLA ni una garantía de frescura del proveedor.

## Regresión de la ruta de mercado

La suite `tests/browser/market-route.spec.ts` valida la ruta autenticada `/app/mercado` con un contrato de scanner sintético: ambos libros, formato numérico `0,000.00`, encabezados y captions de tabla, solo lectura, estado explícito cuando no existe snapshot y ausencia de desbordamiento horizontal a 320, 360, 768 y 1440 px, recuperación tras un error sintético de transporte y navegación por teclado hasta el control de cierre de sesión. Las respuestas sintéticas evitan depender de cuentas, credenciales o datos financieros reales. Cada usuario temporal creado por la prueba se registra por identificador de caso de Playwright y se elimina en el hook `afterEach`, incluso cuando una aserción falla. El aislamiento por caso evita colisiones porque la configuración ejecuta los archivos de prueba en paralelo.

Esta cobertura comprueba la interfaz y el contrato observado; no demuestra disponibilidad del proveedor, ejecución de operaciones, certificación WCAG ni frescura real de producción. La accesibilidad manual y la verificación del Worker desplegado siguen siendo controles independientes.
