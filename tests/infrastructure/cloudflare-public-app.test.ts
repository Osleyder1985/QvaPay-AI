import { describe, expect, it } from "vitest";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
} from "../../src/infrastructure/cloudflare/public-app.js";

describe("public production application", () => {
  it("serves the application HTML without credentials", async () => {
    const response = createPublicAppResponse();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const body = await response.text();
    expect(body).toContain("<title>QvaPay-AI</title>");
    expect(body).not.toContain("QVAPAY_APP_SECRET");
    expect(body).not.toContain("SCANNER_BOOTSTRAP_TOKEN");
  });

  it("returns only the read-only scanner status contract", async () => {
    const response = createPublicScannerStateResponse({
      configured: true,
      coin: "QUSD",
      intervalSeconds: 10,
      nextAlarmAt: 1234567890,
      running: false,
      lastStartedAt: "2026-10-05T16:00:00.000Z",
      lastCompletedAt: "2026-10-05T16:00:01.000Z",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      configured: true,
      coin: "QUSD",
      intervalSeconds: 10,
      nextAlarmAt: 1234567890,
      running: false,
      lastStartedAt: "2026-10-05T16:00:00.000Z",
      lastCompletedAt: "2026-10-05T16:00:01.000Z",
    });
  });
});
