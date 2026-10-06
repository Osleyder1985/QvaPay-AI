# ADR-002: Escáner continuo del lado servidor

## Estado

Aceptado e implementado.

## Contexto

El scanner debe continuar aunque ningún usuario tenga abierta la aplicación.

## Decisión

El ciclo se ejecuta mediante Cloudflare Durable Object + Alarm. El navegador no mantiene vivo el scanner.

## Configuración

- moneda: `SCANNER_COIN`;
- intervalo: `SCANNER_INTERVAL_SECONDS`;
- rango permitido: 5–300 segundos.

## Consecuencias

- F5 no reinicia el scheduler;
- cerrar el navegador no detiene el ciclo;
- el estado puede consultarse mediante endpoints públicos/protegidos;
- los errores se registran y el siguiente ciclo se programa.

## Evidencia

La automatización de Cloudflare realiza bootstrap y verifica una ejecución real después del deployment.
