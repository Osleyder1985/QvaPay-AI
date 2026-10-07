import {
  evaluateAccountIntegration,
  type QvaPayAccountSnapshot,
  type QvaPayAccountSourceMetadata,
  type QvaPayAccountUser,
  type QvaPayApplicationIdentity,
} from "./account-contract.js";

export interface QvaPayAccountClientOptions {
  readonly baseUrl: string;
  readonly appId: string;
  readonly appSecret: string;
  readonly userApiToken: string;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
  readonly retryAttempts?: number;
  readonly minimumRequestSpacingMs?: number;
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

function parseAuthenticatedUser(payload: unknown): QvaPayAccountUser | null {
  const value = readPayload(payload);
  if (!isRecord(value)) return null;

  const uuid = optionalString(value, "uuid");
  const username = optionalString(value, "username");
  if (!uuid || !username) return null;

  return {
    uuid,
    username,
    name: optionalString(value, "name"),
    lastname: optionalString(value, "lastname"),
    image: optionalString(value, "image"),
    ratingAvg: optionalNumber(value, "average_rating"),
    ratingCount: optionalNumber(value, "rating_count"),
    kyc: optionalBoolean(value, "kyc"),
    vip: optionalBoolean(value, "vip"),
    goldenCheck: optionalBoolean(value, "golden_check"),
    phoneVerified: optionalBoolean(value, "phone_verified"),
    telegramVerified: optionalString(value, "telegram") !== null,
    p2pEnabled: optionalBoolean(value, "p2p_enabled"),
    completedAsOwner: null,
    completedAsPeer: null,
  };
}

function parseOwnOffers(payload: unknown): { readonly total: number | null } {
  const value = readPayload(payload);
  if (!isRecord(value)) return { total: null };
  return {
    total: optionalNumber(value, "total"),
  };
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(10_000, seconds * 1_000);
    }
    const retryAt = Date.parse(retryAfter);
    if (!Number.isNaN(retryAt)) {
      return Math.min(10_000, Math.max(0, retryAt - Date.now()));
    }
  }
  return Math.min(10_000, 1_000 * 2 ** attempt);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(
  options: QvaPayAccountClientOptions,
  path: string,
  init: RequestInit,
  authentication: "app" | "user" = "app",
): Promise<{
  readonly status: number;
  readonly ok: boolean;
  readonly payload: unknown;
  readonly retrievedAt: string;
}> {
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  const authHeaders =
    authentication === "user"
      ? { Authorization: `Bearer ${options.userApiToken}` }
      : {
          "app-id": options.appId,
          "app-secret": options.appSecret,
        };

  const attempts = Math.max(1, options.retryAttempts ?? 3);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
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
          ...authHeaders,
          ...init.headers,
        },
        signal: controller.signal,
      });
      if (response.status !== 429 || attempt === attempts - 1) {
        const text = await response.text();
        let payload: unknown = null;
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch {
            payload = null;
          }
        }
        return {
          status: response.status,
          ok: response.ok,
          payload,
          retrievedAt: new Date().toISOString(),
        };
      }
      const delay = retryDelayMs(response, attempt);
      await wait(delay);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("QvaPay request retry policy exhausted.");
}

export class QvaPayAccountClient {
  constructor(private readonly options: QvaPayAccountClientOptions) {
    if (!options.appId || !options.appSecret) {
      throw new Error("QvaPay application credentials are required");
    }
    if (!options.userApiToken) {
      throw new Error("QvaPay user API token is required");
    }
  }

  async fetchAccount(): Promise<QvaPayAccountSnapshot> {
    const spacingMs = Math.max(
      0,
      this.options.minimumRequestSpacingMs ?? 1_700,
    );
    const balance = await request(this.options, "/v2/balance", {
      method: "POST",
    });
    await wait(spacingMs);
    const info = await request(this.options, "/v2/info", { method: "POST" });
    await wait(spacingMs);
    const user = await request(
      this.options,
      "/user",
      { method: "GET" },
      "user",
    );
    await wait(spacingMs);
    const ownOffers = await request(
      this.options,
      "/p2p?my=1&take=1&page=1",
      { method: "GET" },
    );

    const balanceUsd = balance.ok ? parseBalance(balance.payload) : null;
    const application = info.ok ? parseApplication(info.payload) : null;
    const identity = user.ok ? parseAuthenticatedUser(user.payload) : null;
    const own = ownOffers.ok
      ? parseOwnOffers(ownOffers.payload)
      : { total: null };
    const balanceSource: QvaPayAccountSourceMetadata = {
      endpoint: "/v2/balance",
      retrievedAt: balance.retrievedAt,
      httpStatus: balance.status,
      status:
        balanceUsd !== null
          ? "verified"
          : balance.ok
            ? "unavailable"
            : "failed",
      error:
        balance.ok && balanceUsd === null
          ? "QvaPay returned an incompatible balance payload."
          : balance.ok
            ? null
            : `QvaPay balance request failed with HTTP ${balance.status}.`,
    };
    const identityProvenance: QvaPayAccountSourceMetadata = {
      endpoint: "/user",
      retrievedAt: user.retrievedAt,
      httpStatus: user.status,
      status:
        identity !== null ? "verified" : user.ok ? "unavailable" : "failed",
      error:
        user.ok && identity === null
          ? "QvaPay returned an incompatible authenticated-user payload."
          : user.ok
            ? null
            : `QvaPay authenticated-user request failed with HTTP ${user.status}.`,
    };
    const applicationProvenance: QvaPayAccountSourceMetadata = {
      endpoint: "/v2/info",
      retrievedAt: info.retrievedAt,
      httpStatus: info.status,
      status:
        application !== null ? "verified" : info.ok ? "unavailable" : "failed",
      error:
        info.ok && application === null
          ? "QvaPay returned an incompatible application payload."
          : info.ok
            ? null
            : `QvaPay application request failed with HTTP ${info.status}.`,
    };
    const ownOffersProvenance: QvaPayAccountSourceMetadata = {
      endpoint: "/p2p?my=1&take=1&page=1",
      retrievedAt: ownOffers.retrievedAt,
      httpStatus: ownOffers.status,
      status: ownOffers.ok ? "verified" : "failed",
      error: ownOffers.ok
        ? null
        : `QvaPay own-offers request failed with HTTP ${ownOffers.status}.`,
    };
    const integrationStatus = evaluateAccountIntegration({
      balanceOk: balanceUsd !== null,
      identityOk: identity !== null,
      applicationOk: application !== null,
      p2pAccessible: own.compatible,
    });

    return {
      balanceUsd,
      balanceSource,
      balanceHttpStatus: balance.status,
      balanceOk: balanceUsd !== null,
      balanceError:
        balance.ok && balanceUsd === null
          ? "QvaPay returned an incompatible balance payload."
          : balance.ok
            ? null
            : `QvaPay balance request failed with HTTP ${balance.status}.`,
      identity,
      identityProvenance,
      identitySource: "/user",
      identityHttpStatus: user.status,
      identityOk: identity !== null,
      identityError:
        user.ok && identity === null
          ? "QvaPay returned an incompatible authenticated-user payload."
          : user.ok
            ? null
            : `QvaPay authenticated-user request failed with HTTP ${user.status}.`,
      application,
      applicationProvenance,
      applicationHttpStatus: info.status,
      applicationOk: application !== null,
      p2pAccessible: ownOffers.ok,
      ownOffersTotal: own.total,
      ownOffersProvenance,
      integrationStatus,
      fetchedAt: new Date().toISOString(),
    };
  }
}
