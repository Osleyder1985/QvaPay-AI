# Quality Gate del repositorio

## Propósito

El workflow `Repository Quality Gate` es el gate obligatorio de calidad para Pull Requests y cambios integrados en `main`.

## Comprobaciones actuales

1. 📚 existencia de documentación requerida;
2. 📝 estructura Markdown;
3. 🔗 destinos internos de enlaces;
4. 🇪🇸 convención de idioma documental;
5. 🧩 TypeScript;
6. 🔎 ESLint;
7. ☁️ `wrangler deploy --dry-run`;
8. ✨ Prettier;
9. 🧪 Vitest.

## Despliegue

`Cloudflare Deploy` se activa mediante `workflow_run` solamente cuando `Repository Quality Gate` termina en `success` sobre `main`.

El deployment utiliza el `head_sha` que fue verificado por el Quality Gate.

## Smoke de producción

Después de desplegar, el workflow verifica:

- HTTP 200 en la raíz;
- JSON válido en `GET /api/scanner/status`;
- dashboard con BUY/SELL;
- mapeo de acciones;
- fila de mejor oferta;
- heartbeat dorado;
- tipografía de tablas;
- bootstrap del scanner;
- ejecución completa;
- ausencia de error;
- `nextAlarmAt`.

## Regla

Un fallo de Quality Gate bloquea el flujo de integración/deployment automático.

Un deployment exitoso es evidencia de despliegue, no certificación automática del sistema.
