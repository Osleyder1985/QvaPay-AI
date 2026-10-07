import type { QvaPayP2POfferStatus } from "./p2p-types.js";

export interface QvaPayP2POfferParticipant {
  readonly uuid: string | null;
  readonly username: string | null;
  readonly name: string | null;
  readonly kyc: boolean | null;
  readonly vip: boolean | null;
  readonly goldenCheck: boolean | null;
}

export interface QvaPayP2POfferDetail {
  readonly uuid: string;
  readonly type: "buy" | "sell";
  readonly coin: string;
  readonly amount: string;
  readonly receive: string;
  readonly status: QvaPayP2POfferStatus;
  readonly onlyKyc: boolean | null;
  readonly onlyVip: boolean | null;
  readonly private: boolean | null;
  readonly message: string | null;
  readonly details: Record<string, unknown> | null;
  readonly txId: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly user: QvaPayP2POfferParticipant | null;
  readonly peer: QvaPayP2POfferParticipant | null;
  readonly coinInfo: {
    readonly tick: string | null;
    readonly name: string | null;
    readonly logo: string | null;
  } | null;
  readonly ratings: readonly unknown[];
  readonly currentUserId: string | null;
}

export class QvaPayP2PDetailContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QvaPayP2PDetailContractError";
  }
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail field: ${field}`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail field: ${field}`);
  }
  return value;
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return requiredString(value, field);
}

function optionalBoolean(value: unknown, field: string): boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail field: ${field}`);
  }
  return value;
}

function optionalTimestamp(value: unknown, field: string): string | null {
  const result = optionalString(value, field);
  if (result === null) return null;
  if (Number.isNaN(Date.parse(result))) {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail timestamp: ${field}`);
  }
  return result;
}

function decimal(value: unknown, field: string): string {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail decimal: ${field}`);
  }
  const text = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(text)) {
    throw new QvaPayP2PDetailContractError(`Invalid QvaPay detail decimal: ${field}`);
  }
  return text;
}

function participant(value: unknown, field: string): QvaPayP2POfferParticipant | null {
  if (value === undefined || value === null) return null;
  const item = record(value, field);
  return {
    uuid: optionalString(item.uuid, `${field}.uuid`),
    username: optionalString(item.username, `${field}.username`),
    name: optionalString(item.name, `${field}.name`),
    kyc: optionalBoolean(item.kyc, `${field}.kyc`),
    vip: optionalBoolean(item.vip, `${field}.vip`),
    goldenCheck: optionalBoolean(item.golden_check, `${field}.golden_check`),
  };
}

function status(value: unknown): QvaPayP2POfferStatus {
  const result = value === undefined || value === null ? "open" : value;
  if (
    result !== "open" &&
    result !== "revision" &&
    result !== "processing" &&
    result !== "paid" &&
    result !== "completed" &&
    result !== "cancelled"
  ) {
    throw new QvaPayP2PDetailContractError("Invalid QvaPay detail status");
  }
  return result;
}

export function parseP2POfferDetail(payload: unknown): QvaPayP2POfferDetail {
  const root = record(payload, "response");
  const p2p = record(root.p2p, "p2p");
  const type = requiredString(p2p.type, "p2p.type");
  if (type !== "buy" && type !== "sell") {
    throw new QvaPayP2PDetailContractError("Invalid QvaPay detail type");
  }

  const details =
    p2p.details === undefined || p2p.details === null
      ? null
      : record(p2p.details, "p2p.details");
  const coin =
    p2p.Coin === undefined || p2p.Coin === null
      ? null
      : record(p2p.Coin, "p2p.Coin");

  return {
    uuid: requiredString(p2p.uuid, "p2p.uuid"),
    type,
    coin: requiredString(p2p.coin, "p2p.coin"),
    amount: decimal(p2p.amount, "p2p.amount"),
    receive: decimal(p2p.receive, "p2p.receive"),
    status: status(p2p.status),
    onlyKyc: optionalBoolean(p2p.only_kyc, "p2p.only_kyc"),
    onlyVip: optionalBoolean(p2p.only_vip, "p2p.only_vip"),
    private: optionalBoolean(p2p.private, "p2p.private"),
    message: optionalString(p2p.message, "p2p.message"),
    details,
    txId: optionalString(p2p.tx_id, "p2p.tx_id"),
    createdAt: optionalTimestamp(p2p.created_at, "p2p.created_at"),
    updatedAt: optionalTimestamp(p2p.updated_at, "p2p.updated_at"),
    user: participant(p2p.User, "p2p.User"),
    peer: participant(p2p.Peer, "p2p.Peer"),
    coinInfo: coin
      ? {
          tick: optionalString(coin.tick, "p2p.Coin.tick"),
          name: optionalString(coin.name, "p2p.Coin.name"),
          logo: optionalString(coin.logo, "p2p.Coin.logo"),
        }
      : null,
    ratings: Array.isArray(p2p.Ratings) ? p2p.Ratings : [],
    currentUserId: optionalString(p2p.currentUserId, "p2p.currentUserId"),
  };
}
