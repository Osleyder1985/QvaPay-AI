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
            email: "owner@example.com",
            bio: "Owner bio",
            balance: 77.25,
            satoshis: 123,
            phone: "+123456789",
            average_rating: 4.8,
            kyc: true,
            golden_check: true,
            phone_verified: true,
            golden_expire: "2030-01-01T00:00:00.000Z",
            p2p_enabled: true,
            savings_roundup: false,
            cover: "https://example.com/cover",
            image: "https://example.com/image",
            twitter: "@owner",
            telegram: "owner",
            two_factor_secret: "***",
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
    expect(snapshot.identity?.email).toBe("owner@example.com");
    expect(snapshot.identity?.bio).toBe("Owner bio");
    expect(snapshot.identity?.balance).toBe(77.25);
    expect(snapshot.identity?.satoshis).toBe(123);
    expect(snapshot.identity?.phone).toBe("+123456789");
    expect(snapshot.identity?.phoneVerified).toBe(true);
    expect(snapshot.identity?.goldenExpire).toBe("2030-01-01T00:00:00.000Z");
    expect(snapshot.identity?.savingsRoundup).toBe(false);
    expect(snapshot.identity?.telegram).toBe("owner");
    expect(snapshot.identity?.telegramVerified).toBeNull();
    expect(snapshot.identity?.ratingCount).toBeNull();
    expect(snapshot.identity?.vip).toBeNull();
    expect(snapshot.identity?.twoFactorEnabled).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("two_factor_secret");
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

  it("fails closed when the authenticated-user contract is unavailable", async () => {
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "test-app-id",
      appSecret: "test-app-secret",
      userApiToken: "test-profile-token",
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
  it("does not verify P2P integration when the HTTP 200 payload is incompatible", async () => {
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "test-app-id",
      appSecret: "test-app-secret",
      userApiToken: "test-profile-token",
      fetcher: vi.fn(async (input) => {
        const url = String(input);
        if (url.endsWith("/v2/balance")) {
          return response(200, { balance: 125.5 });
        }
        if (url.endsWith("/v2/info")) {
          return response(200, { uuid: "app-uuid", name: "QvaPay AI" });
        }
        if (url.endsWith("/user")) {
          return response(200, { uuid: "owner-uuid", username: "owner-user" });
        }
        return response(200, { data: [{ malformed: true }] });
      }),
    });

    const snapshot = await client.fetchAccount();

    expect(snapshot.p2pAccessible).toBe(false);
    expect(snapshot.ownOffersTotal).toBeNull();
    expect(snapshot.ownOffersProvenance.status).toBe("unavailable");
    expect(snapshot.integrationStatus).toBe("degraded");
  });
});
