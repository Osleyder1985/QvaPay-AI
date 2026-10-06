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

    expect(snapshot.identity?.uuid).toBe("owner-uuid");
    expect(snapshot.identity?.username).toBe("owner-user");
    expect(snapshot.identitySource).toBe("/user");
    expect(snapshot.ownOffersTotal).toBe(12);
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
    expect(snapshot.identity).toBeNull();
    expect(snapshot.identitySource).toBe("/user");
    expect(snapshot.integrationStatus).toBe("degraded");
  });
});
