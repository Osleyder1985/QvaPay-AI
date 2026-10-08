/**
 * @archivo src/infrastructure/qvapay/p2p-contract.ts
 * @proposito Define el contrato interno de integración P2P de QvaPay.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/qvapay dentro de la arquitectura de QvaPay-AI.
 */

import type {
  QvaPayP2PPageDto,
  QvaPayP2POfferDto,
  QvaPayP2POfferStatus,
} from "./p2p-types.js";

/**
 * Error de dominio de infraestructura para respuestas P2P inválidas de QvaPay.
 */
export class QvaPayContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QvaPayContractError";
  }
}

/**
 * Valida y transforma una respuesta paginada P2P de QvaPay al contrato interno.
 *
 * @param payload Respuesta externa recibida desde QvaPay.
 * @returns Página P2P validada y normalizada.
 * @throws QvaPayContractError Si el payload no cumple el contrato esperado.
 */
export function parseP2PPage(payload: unknown): QvaPayP2PPageDto {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new QvaPayContractError("Invalid QvaPay P2P pagination envelope");
  }

  const page = {
    data: payload.data.map(parseOffer),
    current_page: positiveInteger(payload.current_page, "current_page"),
    last_page: resolveLastPage(payload),
    per_page: positiveInteger(payload.per_page, "per_page"),
    total: nonNegativeInteger(payload.total, "total"),
  };

  if (page.current_page > page.last_page) {
    throw new QvaPayContractError("Invalid QvaPay P2P page range");
  }

  return page;
}

function parseOffer(value: unknown): QvaPayP2POfferDto {
  if (!isRecord(value)) {
    throw new QvaPayContractError("Invalid QvaPay P2P offer");
  }

  const uuid = stringField(value.uuid, "uuid");
  const type = stringField(value.type, "type");
  const coin = stringField(value.coin, "coin");
  const amount = decimalString(value.amount, "amount");
  const receive = decimalString(value.receive, "receive");
  const availableAmount = decimalString(
    value.available_amount,
    "available_amount",
  );
  assertPositiveDecimal(amount, "amount");
  assertPositiveDecimal(receive, "receive");
  assertPositiveDecimal(availableAmount, "available_amount");

  if (type !== "buy" && type !== "sell") {
    throw new QvaPayContractError("Invalid QvaPay P2P offer type");
  }

  const reservedAmount = optionalDecimal(
    value.reserved_amount,
    "reserved_amount",
  );
  const orderMin = optionalDecimal(value.order_min, "order_min");
  const orderMax = optionalDecimal(value.order_max, "order_max");
  const createdAt = optionalTimestamp(value.created_at, "created_at");
  const updatedAt = optionalTimestamp(value.updated_at, "updated_at");
  const onlyVip = optionalBoolean(value.only_vip, "only_vip");
  const status = optionalStatus(value.status);
  const user = optionalUser(value.User);

  return {
    uuid,
    type,
    coin,
    amount,
    receive,
    available_amount: availableAmount,
    status,
    ...(reservedAmount === undefined
      ? {}
      : { reserved_amount: reservedAmount }),
    ...(orderMin === undefined ? {} : { order_min: orderMin }),
    ...(orderMax === undefined ? {} : { order_max: orderMax }),
    ...(createdAt === undefined ? {} : { created_at: createdAt }),
    ...(updatedAt === undefined ? {} : { updated_at: updatedAt }),
    ...(onlyVip === undefined ? {} : { only_vip: onlyVip }),
    ...(user === undefined ? {} : { User: user }),
  };
}

function optionalStatus(value: unknown): QvaPayP2POfferStatus {
  if (value === undefined || value === null) return "open";
  if (typeof value !== "string") {
    throw new QvaPayContractError("Invalid QvaPay P2P status");
  }

  const allowed: readonly QvaPayP2POfferStatus[] = [
    "open",
    "revision",
    "processing",
    "paid",
    "completed",
    "cancelled",
  ];
  if (!allowed.includes(value as QvaPayP2POfferStatus)) {
    throw new QvaPayContractError("Invalid QvaPay P2P status");
  }
  return value as QvaPayP2POfferStatus;
}

function optionalUser(
  value: unknown,
): { username?: string; name?: string } | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new QvaPayContractError("Invalid QvaPay P2P user");
  }

  const username =
    value.username === undefined
      ? undefined
      : stringField(value.username, "User.username");
  const name =
    value.name === undefined ? undefined : stringField(value.name, "User.name");
  const vip =
    value.vip === undefined ? undefined : booleanField(value.vip, "User.vip");

  if (username === undefined && name === undefined) return undefined;

  return {
    ...(username === undefined ? {} : { username }),
    ...(name === undefined ? {} : { name }),
    ...(vip === undefined ? {} : { vip }),
  };
}

function booleanField(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new QvaPayContractError(`Invalid QvaPay field: ${field}`);
  }
  return value;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  return booleanField(value, field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QvaPayContractError(`Invalid QvaPay field: ${field}`);
  }
  return value;
}

function decimalString(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new QvaPayContractError(`Invalid QvaPay decimal: ${field}`);
  }
  return value;
}

function assertPositiveDecimal(value: string, field: string): void {
  if (compareDecimal(value, "0") <= 0) {
    throw new QvaPayContractError(
      `QvaPay financial quantity must be positive: ${field}`,
    );
  }
}

function compareDecimal(left: string, right: string): number {
  const a = normalizeDecimal(left);
  const b = normalizeDecimal(right);

  if (a.sign !== b.sign) return a.sign > b.sign ? 1 : -1;

  const integerComparison = compareUnsignedIntegers(a.integer, b.integer);
  if (integerComparison !== 0) {
    return a.sign === 1 ? integerComparison : -integerComparison;
  }

  const length = Math.max(a.fraction.length, b.fraction.length);
  const leftFraction = a.fraction.padEnd(length, "0");
  const rightFraction = b.fraction.padEnd(length, "0");
  if (leftFraction === rightFraction) return 0;

  const fractionComparison = leftFraction > rightFraction ? 1 : -1;
  return a.sign === 1 ? fractionComparison : -fractionComparison;
}

function normalizeDecimal(
  value: string,
): { sign: -1 | 1; integer: string; fraction: string } {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integerPart = "0", fraction = ""] = unsigned.split(".");
  return {
    sign: negative ? -1 : 1,
    integer: integerPart.replace(/^0+(?=\d)/, ""),
    fraction,
  };
}

function compareUnsignedIntegers(left: string, right: string): number {
  if (left.length !== right.length) return left.length > right.length ? 1 : -1;
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

function optionalDecimal(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return decimalString(value, field);
}

function optionalTimestamp(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new QvaPayContractError(`Invalid QvaPay timestamp: ${field}`);
  }
  return value;
}

function resolveLastPage(payload: Record<string, unknown>): number {
  if (payload.last_page !== undefined && payload.last_page !== null) {
    return positiveInteger(payload.last_page, "last_page");
  }

  const total = nonNegativeInteger(payload.total, "total");
  const perPage = positiveInteger(payload.per_page, "per_page");
  return Math.max(1, Math.ceil(total / perPage));
}

function positiveInteger(value: unknown, field: string): number {
  const parsed = providerInteger(value, field);
  if (parsed < 1) {
    throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
  }
  return parsed;
}

function nonNegativeInteger(value: unknown, field: string): number {
  const parsed = providerInteger(value, field);
  if (parsed < 0) {
    throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
  }
  return parsed;
}

function providerInteger(value: unknown, field: string): number {
  if (typeof value === "number") {
    if (Number.isSafeInteger(value)) return value;
  } else if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }

  throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
}
