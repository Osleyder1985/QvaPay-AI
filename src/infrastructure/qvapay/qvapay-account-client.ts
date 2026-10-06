import {
  evaluateAccountIntegration,
  type QvaPayAccountSnapshot,
  type QvaPayAccountUser,
  type QvaPayApplicationIdentity,
} from "./account-contract.js";

export interface QvaPayAccountClientOptions {
  readonly baseUrl: string;
  readonly appId: string;
  readonly appSecret: string;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  return typeof record[key] === "string" ? record[key].trim() || null : null;
}

function optionalBoolean(
  record: Record<string, unknown>,
  key: string,
): boolean | null {
  return typeof record[key] === "boolean" ? record[key] : null;
}

function optionalNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;
  if (
    "data" in value &&
    Object.keys(value).length <= 2 &&
    !Array.isArray(value.data)
  ) {
    return value.data;
  }
  return value;
}

function parseBalance(payload: unknown): number | null {
  const value = readPayload(payload);
  if (!isRecord(value)) return null;
  const balance = value.balance;
  return typeof balance === "number" && Number.isFinite(balance) && balance >= 0
    ? balance
    : null;
}

function parseApplication(payload: unknown): QvaPayApplicationIdentity | null {
  const value = readPayload(payload);
  if (!isRecord(value)) return null;
  const uuid = optionalString(value, "uuid");
  const name = optionalString(value, "name");
  if (!uuid || !name) return null;
  return {
    uuid,
    name,
    url: optionalString(value, "url"),
    description: optionalString(value, "desc"),
    callback: optionalString(value, "callback"),
    successUrl: optionalString(value, "success_url"),
    cancelUrl: optionalString(value, "cancel_url"),
    logo: optionalString(value, "logo"),
    appPhotoUrl: optionalString(value, "app_photo_url"),
    active: optionalBoolean(value, "active"),
    enabled: optionalBoolean(value, "enabled"),
    card: optionalBoolean(value, "card"),
    createdAt: optionalString(value, "created_at"),
    updatedAt: optionalString(value, "updated_at"),
  };
}

function parseUser(value: unknown): QvaPayAccountUser | null {
  if (!isRecord(value)) return null;
  const uuid = optionalString(value, "uuid");
  const username = optionalString(value, "username");
  if (!uuid || !username) return null;
  const counts = isRecord(value._count) ? value._count : null;
  return {
    uuid,
    username,
    name: optionalString(value, "name"),
    image: optionalString(value, "image"),
    ratingAvg: optionalNumber(value, "rating_avg"),
    ratingCount: optionalNumber(value, "rating_count"),
    kyc: optionalBoolean(value, "kyc"),
    vip: optionalBoolean(value, "vip"),
    goldenCheck: optionalBoolean(value, "golden_check"),
    phoneVerified: optionalBoolean(value, "phone_verified"),
    telegramVerified: optionalBoolean(value, "telegram_verified"),
    completedAsOwner: counts ? optionalNumber(counts, "P2P") : null,
    completedAsPeer: counts ? optionalNumber(counts, "P2P_Peer") : null,
  };
}

function parseOwnOffers(payload: unknown): {
  readonly identity: QvaPayAccountUser | null;
  readonly total: number | null;
} {
  const value = readPayload(payload);
  if (!isRecord(value)) return { identity: null, total: null };
  const data = Array.isArray(value.data) ? value.data : [];
  const first = data.find(isRecord);
  const identity = first ? parseUser(first.User) : null;
  const total = optionalNumber(value, "total");
  return { identity, total };
}

async function request(
  options: QvaPayAccountClientOptions,
  path: string,
  init: RequestInit,
): Promise<{
  readonly status: number;
  readonly ok: boolean;
  readonly payload: unknown;
}> {
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 10_000,
  );
  try {
    const response = await fetcher(new URL(path, options.baseUrl), {
      ...init,
      headers: {
        accept: "application/json",
        "app-id": options.appId,
        "app-secret": options.appSecret,
        ...init.headers,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    return { status: response.status, ok: response.ok, payload };
  } finally {
    clearTimeout(timeout);
  }
}

export class QvaPayAccountClient {
  constructor(private readonly options: QvaPayAccountClientOptions) {
    if (!options.appId || !options.appSecret) {
      throw new Error("QvaPay application credentials are required");
    }
  }

  async fetchAccount(): Promise<QvaPayAccountSnapshot> {
    const [balance, info, ownOffers] = await Promise.all([
      request(this.options, "/v2/balance", { method: "POST" }),
      request(this.options, "/v2/info", { method: "POST" }),
      request(this.options, "/p2p?my=1&take=1&page=1", { method: "GET" }),
    ]);

    const balanceUsd = balance.ok ? parseBalance(balance.payload) : null;
    const application = info.ok ? parseApplication(info.payload) : null;
    const own = ownOffers.ok
      ? parseOwnOffers(ownOffers.payload)
      : { identity: null, total: null };
    const integrationStatus = evaluateAccountIntegration({
      balanceOk: balanceUsd !== null,
      identityOk: own.identity !== null,
      applicationOk: application !== null,
      p2pAccessible: ownOffers.ok,
    });

    return {
      balanceUsd,
      balanceHttpStatus: balance.status,
      balanceOk: balanceUsd !== null,
      balanceError:
        balance.ok && balanceUsd === null
          ? "QvaPay returned an incompatible balance payload."
          : balance.ok
            ? null
            : `QvaPay balance request failed with HTTP ${balance.status}.`,
      identity: own.identity,
      identityHttpStatus: ownOffers.status,
      identityOk: own.identity !== null,
      identityError:
        ownOffers.ok && own.identity === null
          ? "No valid account identity was present in the own-offers response."
          : ownOffers.ok
            ? null
            : `QvaPay own-offers request failed with HTTP ${ownOffers.status}.`,
      application,
      applicationHttpStatus: info.status,
      applicationOk: application !== null,
      p2pAccessible: ownOffers.ok,
      ownOffersTotal: own.total,
      integrationStatus,
      fetchedAt: new Date().toISOString(),
    };
  }
}
