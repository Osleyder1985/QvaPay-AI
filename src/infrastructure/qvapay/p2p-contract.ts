import type { QvaPayP2PPageDto, QvaPayP2POfferDto } from "./p2p-types.js";

export class QvaPayContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QvaPayContractError";
  }
}

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

  return {
    uuid,
    type,
    coin,
    amount,
    receive,
    available_amount: availableAmount,
    ...(reservedAmount === undefined
      ? {}
      : { reserved_amount: reservedAmount }),
    ...(orderMin === undefined ? {} : { order_min: orderMin }),
    ...(orderMax === undefined ? {} : { order_max: orderMax }),
    ...(createdAt === undefined ? {} : { created_at: createdAt }),
    ...(updatedAt === undefined ? {} : { updated_at: updatedAt }),
  };
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
    if (Number.isSafeInteger(value)) {
      return value;
    }
  } else if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }

  throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
}
