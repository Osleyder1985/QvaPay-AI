import { describe, expect, it } from "vitest";
import { canRecoverBootstrapAdmin } from "../../src/infrastructure/cloudflare/auth-rbac.js";
import {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
} from "../../src/infrastructure/cloudflare/account-auth.js";

describe("Account Center session", () => {
  it("creates an HttpOnly Secure SameSite session cookie", async () => {
    const cookie = await createSessionCookie(
      "correct-secret",
      "correct-secret",
    );
    expect(cookie).toContain("qvapay_ai_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");

    const request = new Request("https://example.com/api/account", {
      headers: { cookie: cookie!.split(";")[0]! },
    });
    await expect(isAuthenticated(request, "correct-secret")).resolves.toBe(
      true,
    );
  });

  it("rejects invalid credentials and tampered cookies", async () => {
    await expect(
      createSessionCookie("wrong", "correct-secret"),
    ).resolves.toBeNull();
    const cookie = await createSessionCookie(
      "correct-secret",
      "correct-secret",
    );
    const token = cookie!.split(";")[0]!;
    const tampered = token.replace(/\.[^.]+$/, ".tampered");
    const request = new Request("https://example.com/api/account", {
      headers: { cookie: tampered },
    });
    await expect(isAuthenticated(request, "correct-secret")).resolves.toBe(
      false,
    );
  });

  it("clears the session without exposing credentials", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("qvapay_ai_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).not.toContain("correct-secret");
  });
  it("allows bootstrap recovery only for the active Administration admin account", () => {
    const user = {
      id: "admin-id",
      username: "admin",
      role: "ADMINISTRATION" as const,
      active: true,
      createdAt: "2026-10-06T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z",
      lastLoginAt: null,
    };

    expect(canRecoverBootstrapAdmin(user, "admin", "strong-bootstrap-secret", "strong-bootstrap-secret")).toBe(true);
    expect(canRecoverBootstrapAdmin(user, "admin", "wrong-secret", "strong-bootstrap-secret")).toBe(false);
    expect(canRecoverBootstrapAdmin({ ...user, role: "AUDITOR" }, "admin", "strong-bootstrap-secret", "strong-bootstrap-secret")).toBe(false);
    expect(canRecoverBootstrapAdmin({ ...user, active: false }, "admin", "strong-bootstrap-secret", "strong-bootstrap-secret")).toBe(false);
    expect(canRecoverBootstrapAdmin(user, "other", "strong-bootstrap-secret", "strong-bootstrap-secret")).toBe(false);
  });

});
