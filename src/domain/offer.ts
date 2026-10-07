/**
 * @archivo src/domain/offer.ts
 * @proposito Define el modelo de oferta P2P y las utilidades de comparación decimal.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
* @dependencias Ninguna dependencia externa; utiliza tipos primitivos del dominio.
* @seguridad No maneja secretos ni IO; valida representaciones decimales antes de compararlas.
* @superficie-publica Offer, OfferSide, OfferStatus y compareDecimalStrings.
* @mantenimiento Mantener alineado con los contratos de mercado y las pruebas del dominio.
 * @ubicacion src/domain dentro de la arquitectura de QvaPay-AI.
 */

export type OfferSide = "BUY" | "SELL";

export type OfferStatus =
  "open" | "revision" | "processing" | "paid" | "completed" | "cancelled";

export interface Offer {
  readonly id: string;
  readonly market: string;
  readonly side: OfferSide;
  readonly rate: string;
  readonly amount: string;
  readonly availableAmount: string;
  readonly status: OfferStatus;
  readonly sourceTimestamp: string;
  readonly observedAt: string;
  readonly createdAt?: string;
  readonly creatorUsername?: string | null;
  readonly creatorVip?: boolean;
  readonly onlyVip?: boolean;
  readonly fiatAmount?: string;
}

/**
 * @proposito API pública compareDecimalStrings: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function compareDecimalStrings(left: string, right: string): number {
  const a = normalizeDecimal(left);
  const b = normalizeDecimal(right);

  if (a.sign !== b.sign) {
    return a.sign > b.sign ? 1 : -1;
  }

  const integerComparison = compareUnsignedIntegers(a.integer, b.integer);
  if (integerComparison !== 0) {
    return a.sign === 1 ? integerComparison : -integerComparison;
  }

  const fractionLength = Math.max(a.fraction.length, b.fraction.length);
  const leftFraction = a.fraction.padEnd(fractionLength, "0");
  const rightFraction = b.fraction.padEnd(fractionLength, "0");

  if (leftFraction === rightFraction) {
    return 0;
  }

  const fractionComparison = leftFraction > rightFraction ? 1 : -1;
  return a.sign === 1 ? fractionComparison : -fractionComparison;
}

function normalizeDecimal(value: string): {
  sign: -1 | 1;
  integer: string;
  fraction: string;
} {
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new Error("Invalid decimal value");
  }

  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const parts = unsigned.split(".");
  const integer = (parts[0] ?? "0").replace(/^0+(?=\d)/, "");
  const fraction = parts[1] ?? "";

  return {
    sign: negative ? -1 : 1,
    integer,
    fraction,
  };
}

function compareUnsignedIntegers(left: string, right: string): number {
  if (left.length !== right.length) {
    return left.length > right.length ? 1 : -1;
  }

  if (left === right) {
    return 0;
  }

  return left > right ? 1 : -1;
}
