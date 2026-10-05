# Escáner de mercado P2P — Requisitos funcionales del sistema

## Propósito

Definir el comportamiento funcional inicial del escáner de mercado P2P de QvaPay-AI.

## SYS-FR-001 — Configurable automatic market scanning

**Statement**

El sistema deberá escanear automáticamente el mercado P2P de QvaPay utilizando un intervalo de escaneo definido por el usuario.

**Acceptance criteria**

- El intervalo de escaneo podrá ser configurado por el usuario.
- El sistema ejecutará nuevos escaneos de acuerdo con el intervalo configurado.
- El intervalo utilizado deberá ser persistible y observable por los componentes responsables de la ejecución.

**Verification**

TBD. La implementación y el mecanismo exacto de persistencia se definirán posteriormente.

---

## SYS-FR-002 — Continuous 24/7 scanner execution

**Statement**

El escáner deberá funcionar continuamente 24/7 aunque no exista ningún usuario conectado a la aplicación.

**Acceptance criteria**

- La ejecución del escáner no dependerá de una sesión de usuario activa.
- El escaneo deberá continuar cuando no existan clientes web conectados.
- El mecanismo de ejecución deberá operar como servicio del lado servidor.

**Verification**

TBD. Se requerirá una prueba de ejecución sin clientes conectados.

---

## SYS-FR-003 — SELL offers listing

**Statement**

El sistema deberá mostrar las ofertas de venta (SELL) disponibles del mercado P2P, agrupadas por moneda y ordenadas por tasa ascendente dentro de cada moneda.

**Acceptance criteria**

- Las ofertas SELL se mostrarán separadas de las ofertas BUY.
- Las ofertas se agruparán por moneda/mercado.
- Dentro de cada grupo de moneda, las ofertas se ordenarán por tasa ascendente.
- No se mezclarán ofertas pertenecientes a monedas o mercados diferentes.

**Verification**

TBD.

---

## SYS-FR-004 — BUY offers listing

**Statement**

El sistema deberá mostrar las ofertas de compra (BUY) disponibles del mercado P2P, agrupadas por moneda y ordenadas por tasa ascendente dentro de cada moneda.

**Acceptance criteria**

- Las ofertas BUY se mostrarán separadas de las ofertas SELL.
- Las ofertas se agruparán por moneda/mercado.
- Dentro de cada grupo de moneda, las ofertas se ordenarán por tasa ascendente.
- No se mezclarán ofertas pertenecientes a monedas o mercados diferentes.

**Verification**

TBD.

---

## Límite de alcance

Estos requisitos describen observación y presentación del mercado. No autorizan por sí mismos la creación, modificación, cancelación o ejecución automática de órdenes.

## Preguntas abiertas

- **TBD:** API/endpoint oficial que proporcionará las ofertas P2P.
- **TBD:** definición exacta de moneda, mercado y par según el contrato de QvaPay.
- **TBD:** límites mínimo y máximo permitidos para el intervalo configurable.
- **TBD:** política de recuperación ante errores del proveedor.


## Requisitos de interacción con ofertas P2P

El panel de mercado debe:

- mostrar las cantidades de QUSD y los importes fiat con separador de miles mediante coma y exactamente dos decimales, sin modificar la precisión numérica almacenada;
- mostrar la fecha y hora de creación de la oferta, no solamente la hora del día;
- identificar mediante un indicador explícito las ofertas restringidas a usuarios VIP;
- mostrar **Vender** para una oferta BUY porque el usuario pasa a ser el vendedor de QUSD;
- mostrar **Comprar** para una oferta SELL porque el usuario pasa a ser el comprador de QUSD;
- exigir una confirmación explícita antes de aplicar a una oferta;
- exigir una credencial de operación del lado del servidor antes de permitir que la aplicación alcance el endpoint de aplicación P2P de QvaPay;
- mostrar claramente el estado de tomada/procesando después de una aplicación exitosa;
- proporcionar transiciones visuales para las actualizaciones del mercado, el estado al pasar sobre una fila, la respuesta de las acciones y los cambios de estado, sin exigir una recarga completa de la página.

La acción de aplicación del lado del servidor nunca debe exponer al navegador las credenciales de la aplicación de QvaPay.
