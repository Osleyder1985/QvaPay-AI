# Operaciones P2P y Auto Apply

## Propósito

Documentar la frontera operativa para aplicar ofertas P2P de QvaPay y la estrategia de Auto Apply implementada en QvaPay-AI.

## Aplicación manual

Solo un usuario con rol **Administration** puede ejecutar una aplicación.

El Worker utiliza las credenciales de aplicación de QvaPay exclusivamente server-side para:

1. Ejecutar `POST /p2p/:uuid/apply`.
2. Consultar inmediatamente `GET /p2p/:uuid` mediante el token API server-side.
3. Devolver el resultado de aplicación y el detalle actual de la oferta.
4. Registrar el resultado en el audit log.

El navegador nunca recibe `app-id`, `app-secret`, tokens QvaPay ni secretos internos.

## Requisitos de QvaPay

La API oficial establece que el usuario debe cumplir los requisitos de P2P y KYC. Para una aplicación:

- una oferta **buy** es tomada por el vendedor y el QUSD del aplicante se deposita como garantía;
- una oferta **sell** es tomada por el comprador y no requiere saldo QUSD para aplicar;
- la oferta debe seguir disponible;
- QvaPay puede responder `400`, `401`, `403`, `409`, `429` o `500`;
- el endpoint de aplicación está limitado a 2 solicitudes cada 60 segundos.

Fuentes oficiales:

- QvaPay API — Aplicar a Oferta P2P: https://www.qvapay.com/docs/p2p/apply
- QvaPay API — Detalle de Oferta P2P: https://www.qvapay.com/docs/p2p/detail
- QvaPay API — Credenciales de App: https://www.qvapay.com/docs/p2p/app-credentials

## Auto Apply

Auto Apply está desactivado por defecto y solo **Administration** puede modificarlo.

La estrategia se ejecuta dentro del Durable Object durante el ciclo server-side del scanner. El navegador no inicia ni repite la ejecución financiera.

### Comprar QUSD

La acción **BUY** se evalúa sobre ofertas QvaPay **SELL**:

- tasa estrictamente menor que `buy.maxRate`;
- importe CUP de la oferta menor o igual que `buy.maxCupAmount`;
- estado de la oferta: `open`;
- moneda igual al mercado configurado.

### Vender QUSD

La acción **SELL** se evalúa sobre ofertas QvaPay **BUY**:

- tasa estrictamente mayor que `sell.minRate`;
- QUSD de la oferta menor o igual al balance QUSD actual del propietario de la aplicación;
- estado de la oferta: `open`;
- moneda igual al mercado configurado.

El límite de QUSD se obtiene mediante `POST /v2/balance` con credenciales de aplicación, que QvaPay documenta como el balance actual del propietario de la aplicación.

## Protección operacional

El Durable Object conserva:

- configuración persistente;
- ofertas ya aplicadas;
- ventanas recientes de aplicación para respetar el límite de QvaPay;
- resultado de la última operación automática;
- detalle obtenido después de una aplicación exitosa.

Una aplicación automática no se considera exitosa únicamente porque el POST haya respondido correctamente: el sistema intenta recuperar el detalle autoritativo de la oferta y conserva cualquier error de detalle para diagnóstico.

## Autoridad

La autorización de aplicación es server-side:

- **Administration:** puede aplicar ofertas y configurar Auto Apply.
- **Auditor:** puede consultar resultados y detalles, pero no ejecutar operaciones ni cambiar Auto Apply.

El contrato QvaPay es la autoridad para elegibilidad final. La estrategia local solo decide qué ofertas son candidatas según los parámetros configurados.

## Trazabilidad

- Issue: #222
- Baseline de auditoría: #166
- Seguridad de operaciones: #101
- RBAC: #128
- Contratos API: #179
- Documentación de código: #182

Estado inicial de la capacidad: **Implemented / Tested pending CI and production evidence**.

La implementación no debe marcarse como Verified o Certified hasta disponer de Quality Gate, Security Gate, despliegue y smoke autenticado específico de operaciones P2P.
