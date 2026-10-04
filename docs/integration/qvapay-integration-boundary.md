# QvaPay Integration Boundary

## Objetivo

Aislar el contrato externo de QvaPay del dominio y establecer qué información está verificada antes de implementar el adaptador.

## Contrato verificado

La documentación oficial de QvaPay define:

- Base URL: `https://api.qvapay.com`.
- Mercado P2P: `GET /p2p`.
- Filtros por `type=buy|sell` y `coin`.
- Paginación mediante `page` y `take`.
- Ordenamiento mediante `ratio` y `best_rate`.
- Respuesta paginada con ofertas y campos decimales serializados como strings.
- Códigos de error relevantes: `400`, `401` y `429`.
- Caching del listado público durante algunos segundos.
- Credenciales de aplicación `app-id` + `app-secret` para integraciones server-to-server.

El contrato detallado está documentado en [QvaPay P2P Market API Contract](../api/qvapay-p2p-market-contract.md).

## Datos que el adaptador debe conservar

Como mínimo:

- identificador de oferta;
- tipo BUY/SELL;
- moneda/mercado;
- amount;
- receive;
- status;
- timestamps;
- offer_kind;
- available_amount;
- reserved_amount;
- order_min;
- order_max.

Los datos externos deben considerarse no confiables hasta superar validación de esquema.

## Regla arquitectónica

Ninguna respuesta externa se utilizará directamente como modelo de dominio.

```text
QvaPay Response
      ↓
Schema Validation
      ↓
QvaPay Mapper
      ↓
Internal Offer
      ↓
Domain
```

## Autenticación

Para el scanner server-side se prioriza evaluar credenciales de aplicación porque QvaPay las documenta específicamente para integraciones autónomas y sistemas automáticos.

Los secretos nunca deben llegar al cliente web.

## Rate limiting y resiliencia

El adaptador deberá:

1. respetar el límite documentado por QvaPay;
2. considerar la caché del mercado al determinar la frecuencia real de consultas;
3. tratar `429` como una condición recuperable;
4. utilizar backoff exponencial;
5. evitar loops de reintento sin límite;
6. preservar el último snapshot válido cuando una consulta falle.

## Solo lectura

La integración del alcance inicial no autoriza operaciones P2P de escritura.

## Feed de mercado

QvaPay documenta además stream SSE y webhooks. Son opciones para detectar cambios en tiempo real, pero su adopción requiere una decisión arquitectónica separada porque el requisito inicial exige un intervalo configurable.

## Estado

**Documentado — pendiente de verificación por contrato/integración real.**

La documentación oficial establece el contrato publicado; todavía deben ejecutarse pruebas autorizadas contra QvaPay para comprobar tipos, paginación, límites efectivos, respuestas de error y compatibilidad de credenciales en el entorno real.
