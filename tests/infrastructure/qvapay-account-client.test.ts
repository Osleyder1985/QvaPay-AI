import { describe, expect, it, vi } from "vitest";
import { QvaPayAccountClient } from "../../src/infrastructure/qvapay/qvapay-account-client.js";

function response(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("QvaPayAccountClient", () => {
  it("builds a sanitized account snapshot from QvaPay contracts", async () => {
    const calls: string[] = [];
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "app-id",
      appSecret: "secret",
      fetcher: vi.fn(async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/v2/balance")) {
          return response(200, { balance: 125.5 });
        }
        if (url.endsWith("/v2/info")) {
          return response(200, {
            uuid: "app-uuid",
            name: "QvaPay AI",
            url: "https://example.test",
            desc: "Test",
            callback: "https://example.test/callback",
            success_url: "https://example.test/success",
            cancel_url: "https://example.test/cancel",
            logo: "apps/logo.png",
            app_photo_url: "https://example.test/logo.png",
            active: true,
            enabled: true,
            card: false,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-02T00:00:00.000Z",
            "app-secret": "must-not-escape",
          });
        }
        return response(200, {
          data: [
            {
              uuid: "offer-uuid",
              User: {
                uuid: "user-uuid",
                username: "CRYPTOBRO",
                name: "Cryptobro",
                rating_avg: 4.92,
                rating_count: 897,
                kyc: true,
                vip: true,
                golden_check: true,
                phone_verified: true,
                telegram_verified: true,
                _count: { P2P: 12, P2P_Peer: 8 },
              },
            },
          ],
          total: 12,
        });
      }),
    });

    const snapshot = await client.fetchAccount();
    expect(snapshot.balanceUsd).toBe(125.5);
    expect(snapshot.identity?.username).toBe("CRYPTOBRO");
    expect(snapshot.identity?.ratingCount).toBe(897);
    expect(snapshot.application?.uuid).toBe("app-uuid");
    expect(snapshot.ownOffersTotal).toBe(12);
    expect(snapshot.integrationStatus).toBe("verified");
    expect(JSON.stringify(snapshot)).not.toContain("must-not-escape");
    expect(calls).toHaveLength(3);
  });

  it("fails closed for incompatible balance and missing identity", async () => {
    const client = new QvaPayAccountClient({
      baseUrl: "https://api.qvapay.com",
      appId: "app-id",
      appSecret: "secret",
      fetcher: vi.fn(async (input) => {
        const url = String(input);
        if (url.endsWith("/v2/balance")) {
          return response(200, { balance: "99" });
        }
        if (url.endsWith("/v2/info")) {
          return response(503, {});
        }
        return response(200, { data: [], total: 0 });
      }),
    });

    const snapshot = await client.fetchAccount();
    expect(snapshot.balanceUsd).toBeNull();
    expect(snapshot.identity).toBeNull();
    expect(snapshot.integrationStatus).toBe("degraded");
  });
});
