/**
 * @archivo src/presentation/dashboard/market-clock.ts
 * @proposito Calcula el tiempo de mercado usando el reloj del servidor y una referencia local de recepción.
 * @responsabilidades Evitar que el desfase del reloj del dispositivo altere la clasificación de frescura del snapshot.
 * @ubicacion src/presentation/dashboard dentro de la arquitectura de QvaPay-AI.
 */

/**
 * Estima la hora actual del servidor a partir de la marca temporal recibida y el tiempo transcurrido en el cliente.
 * @param serverNowAt Marca temporal del servidor en milisegundos.
 * @param receivedAt Instante local en que se recibió la respuesta.
 * @param clientNow Instante local actual.
 * @returns Hora estimada del servidor o NaN si las referencias no son válidas.
 */
export function estimateServerNow(
  serverNowAt: number,
  receivedAt: number,
  clientNow: number,
): number {
  if (
    !Number.isFinite(serverNowAt) ||
    !Number.isFinite(receivedAt) ||
    !Number.isFinite(clientNow) ||
    clientNow < receivedAt
  ) {
    return Number.NaN;
  }
  return serverNowAt + (clientNow - receivedAt);
}

/**
 * Calcula la antigüedad de un snapshot contra una estimación del reloj del servidor.
 * @param snapshotAt Marca temporal ISO del snapshot.
 * @param serverNowAt Marca temporal del servidor en milisegundos.
 * @param receivedAt Instante local en que se recibió la respuesta.
 * @param clientNow Instante local actual.
 * @returns Antigüedad no negativa en milisegundos; Infinity cuando no puede verificarse.
 */
export function snapshotAgeMs(
  snapshotAt: string | null | undefined,
  serverNowAt: number,
  receivedAt: number,
  clientNow: number,
): number {
  if (!snapshotAt) return Number.POSITIVE_INFINITY;
  const snapshotTime = Date.parse(snapshotAt);
  const serverNow = estimateServerNow(serverNowAt, receivedAt, clientNow);
  if (!Number.isFinite(snapshotTime) || !Number.isFinite(serverNow)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, serverNow - snapshotTime);
}

/**
 * Código JavaScript de las funciones puras que se ejecutan en el navegador.
 * Se deriva de las funciones exportadas para que las pruebas y el runtime compartan la misma implementación.
 */
export const MARKET_CLOCK_CLIENT_SOURCE = [
  estimateServerNow.toString(),
  snapshotAgeMs.toString(),
].join("\n");
