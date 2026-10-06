# Gobierno del dashboard

## Propósito

El dashboard es el punto central de observabilidad y organización operativa de QvaPay-AI. Presenta el estado real del runtime y del mercado P2P sin inventar evidencia.

La estructura toma como referencia prácticas de **ISO 9001**, **ISO/IEC 27001** e **ISO 22301**. Esta alineación no constituye certificación ISO.

## Organización funcional

| Área | Propósito | Evidencia actual |
|---|---|---|
| Inicio | Estado general del runtime | Estado público del scanner |
| Mercado P2P | Observación separada de BUY y SELL | Snapshot persistido |
| Operaciones | Acciones P2P | Frontera de operación aún bloqueada en el dashboard público |
| Controles | Seguridad, calidad y continuidad | CI/CD + controles documentados |
| Auditoría | Trazabilidad operacional | Inicio, finalización, error y siguiente Alarm |

## Principios

1. **Fuente única de estado:** el navegador consume `GET /api/scanner/status`.
2. **Server-side first:** el scanner no depende de la interfaz abierta.
3. **Separación de responsabilidades:** mercado, cuenta, operación, controles y auditoría tienen límites explícitos.
4. **Trazabilidad:** los datos visibles proceden del estado persistido del Durable Object o de una fuente QvaPay identificada.
5. **Seguridad por diseño:** ningún secreto de QvaPay ni token interno se entrega al cliente.
6. **No sobreafirmación:** el dashboard no declara certificación ISO ni capacidades que estén bloqueadas.
7. **Acciones explícitas:** los controles BUY/SELL son representación visual del mercado; no ejecutan operaciones desde el dashboard público.
8. **Arbitraje separado:** el dashboard no ejecuta estrategias automáticas de arbitraje.

## Modo operativo público

El dashboard público es **solo lectura** respecto de operaciones P2P que cambian estado. Las acciones Comprar/Vender se presentan como información contextual del mercado y permanecen deshabilitadas hasta que exista una frontera de operación autenticada de forma independiente.

El navegador no solicita, almacena ni transmite secretos operacionales.

## Límites

El dashboard no sustituye auditorías formales, gestión documental ISO, gestión de riesgos, gestión de incidentes, revisión de accesos ni certificación externa. Estas capacidades requieren módulos y evidencias específicas.
