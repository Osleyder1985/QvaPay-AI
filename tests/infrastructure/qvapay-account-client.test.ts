import { describe, expect, it, vi } from "vitest";
import { QvaPayAccountClient } from "../../src/infrastructure/qvapay/qvapay-account-client.js";

function response(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("QvaPayAccountClient", () => {
  it("uses the authenticated QvaPay user endpoint for owner identity", async () => {
    const calls: Array<{ url: string; authorization?: string }> = [];
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "test-app-id",
      appSecret: "test-app-secret",
      userApiToken: "test-profile-token",
      minimumRequestSpacingMs: 0,
      fetcher: vi.fn(async (input, init) => {
        const url = String(input);
        const authorization = init?.headers
          ? new Headers(init.headers).get("authorization")
          : null;
        calls.push(authorization ? { url, authorization } : { url });

        if (url.endsWith("/v2/balance")) {
          return response(200, { balance: 125.5 });
        }
        if (url.endsWith("/v2/info")) {
          return response(200, {
            uuid: "app-uuid",
            name: "QvaPay AI",
            active: true,
            enabled: true,
            "app-secret": "must-not-escape",
          });
        }
        if (url.endsWith("/user")) {
          return response(200, {
            uuid: "owner-uuid",
            username: "owner-user",
            name: "Owner",
            lastname: "Account",
            average_rating: 4.8,
            kyc: true,
            golden_check: true,
            phone_verified: true,
            telegram: "owner",
            p2p_enabled: true,
          });
        }
        return response(200, {
          data: [
            {
              User: {
                uuid: "counterparty-uuid",
                username: "must-never-be-owner",
              },
            },
          ],
          total: 12,
        });
      }),
    });

    const snapshot = await client.fetchAccount();

    expect(snapshot.balanceSource.endpoint).toBe("/v2/balance");
    expect(snapshot.balanceSource.status).toBe("verified");
    expect(snapshot.balanceSource.retrievedAt).toEqual(expect.any(String));
    expect(snapshot.identity?.uuid).toBe("owner-uuid");
    expect(snapshot.identity?.username).toBe("owner-user");
    expect(snapshot.identitySource).toBe("/user");
    expect(snapshot.identityProvenance.endpoint).toBe("/user");
    expect(snapshot.identityProvenance.status).toBe("verified");
    expect(snapshot.ownOffersTotal).toBe(12);
    expect(snapshot.ownOffersProvenance.endpoint).toBe(
      "/p2p?my=1&take=1&page=1",
    );
    expect(snapshot.ownOffersProvenance.status).toBe("verified");
    expect(snapshot.integrationStatus).toBe("verified");

    const userCall = calls.find((call) => call.url.endsWith("/user"));
    expect(userCall?.authorization).toBe("Bearer test-profile-token");
    expect(JSON.stringify(snapshot)).not.toContain("must-not-escape");
    expect(JSON.stringify(snapshot)).not.toContain("must-never-be-owner");
    expect(calls).toHaveLength(4);
  });

  it(
    "retries HTTP 429 using Retry-After and returns the successful payload",
    async () => {
      let attempts = 0;
      const client = new QvaPayAccountClient({
        baseUrl: "https://api.qvapay.com",
        appId: "test-app-id",
        appSecret: "test-app-secret",
        userApiToken: "test-profile-token",
        minimumRequestSpacingMs: 0,
        retryAttempts: 2,
        fetcher: vi.fn(async (input) => {
          attempts += 1;
          const url = String(input);
          if (url.endsWith("/v2/balance") && attempts === 1) {
            return new Response(JSON.stringify({ error: "rate limited" }), {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": "0",
              },
            });
          }
          if (url.endsWith("/v2/balance")) {
            return response(200, { balance: 125.5 });
          }
          if (url.endsWith("/v2/info")) {
            return response(200, { uuid: "app-uuid", name: "QvaPay AI" });
          }
          if (url.endsWith("/user")) {
            return response(200, {
              uuid: "owner-uuid",
              username: "owner-user",
            });
          }
          return response(200, { data: [], total: 0 });
        }),
      });

      const snapshot = await client.fetchAccount();

      expect(snapshot.balanceUsd).toBe(125.5);
      expect(attempts).toBe(5);
    },
  );

  it("fails closed when the authenticated-user contract is unavailable", async () => {
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "test-app-id",
      appSecret: "test-app-secret",
      userApiToken: "test-profile-token",
      minimumRequestSpacingMs: 0,
      fetcher: vi.fn(async (input) => {
        const url = String(input);
        if (url.endsWith("/v2/balance")) {
          return response(200, { balance: "99" });
        }
        if (url.endsWith("/v2/info")) {
          return response(503, {});
        }
        if (url.endsWith("/user")) {
          return response(401, {});
        }
        return response(200, { data: [], total: 0 });
      }),
    });

    const snapshot = await client.fetchAccount();

    expect(snapshot.balanceUsd).toBeNull();
    expect(snapshot.balanceSource.status).toBe("unavailable");
    expect(snapshot.balanceSource.httpStatus).toBe(200);
    expect(snapshot.identityProvenance.status).toBe("failed");
    expect(snapshot.identityProvenance.httpStatus).toBe(401);
    expect(snapshot.applicationProvenance.status).toBe("failed");
    expect(snapshot.identity).toBeNull();
    expect(snapshot.identitySource).toBe("/user");
    expect(snapshot.integrationStatus).toBe("degraded");
  });
});
