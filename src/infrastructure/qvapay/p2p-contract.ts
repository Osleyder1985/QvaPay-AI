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
    last_page: positiveInteger(payload.last_page, "last_page"),
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
  const availableAmount = decimalString(value.available_amount, "available_amount");

  if (type !== "buy" && type !== "sell") {
    throw new QvaPayContractError("Invalid QvaPay P2P offer type");
  }

  const offer: QvaPayP2POfferDto = {
    uuid,
    type,
    coin,
    amount,
    receive,
    available_amount: availableAmount,
  };

  addOptionalDecimal(offer, value.reserved_amount, "reserved_amount");
  addOptionalDecimal(offer, value.order_min, "order_min");
  addOptionalDecimal(offer, value.order_max, "order_max");
  addOptionalTimestamp(offer, value.created_at, "created_at");
  addOptionalTimestamp(offer, value.updated_at, "updated_at");

  return offer;
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

function addOptionalDecimal(
  offer: QvaPayP2POfferDto,
  value: unknown,
  field: string,
): void {
  const parsed = optionalDecimal(value, field);
  if (parsed !== undefined) {
    if (field === "reserved_amount") offer.reserved_amount = parsed;
    if (field === "order_min") offer.order_min = parsed;
    if (field === "order_max") offer.order_max = parsed;
  }
}

function optionalTimestamp(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new QvaPayContractError(`Invalid QvaPay timestamp: ${field}`);
  }
  return value;
}

function addOptionalTimestamp(
  offer: QvaPayP2POfferDto,
  value: unknown,
  field: string,
): void {
  const parsed = optionalTimestamp(value, field);
  if (parsed !== undefined) {
    if (field === "created_at") offer.created_at = parsed;
    if (field === "updated_at") offer.updated_at = parsed;
  }
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new QvaPayContractError(`Invalid QvaPay integer: ${field}`);
  }
  return value;
}
