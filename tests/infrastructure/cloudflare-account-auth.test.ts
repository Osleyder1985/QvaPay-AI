import { describe, expect, it } from "vitest";
import {\n  clearSessionCookie,\n  createSessionCookie,\n  isAuthenticated,\n} from "../../src/infrastructure/cloudflare/account-auth.js";

describe("Account Center session", () => {
  it("creates an HttpOnly Secure SameSite session cookie", async () => {
    const cookie = await createSessionCookie(\n      "correct-secret",\n      "correct-secret",\n    );
    expect(cookie).toContain("qvapay_ai_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");

    const request = new Request("https://example.com/api/account", {
      headers: { cookie: cookie!.split(";")[0]! },
    });
    await expect(isAuthenticated(request, "correct-secret")).resolves.toBe(true);
  });

  it("rejects invalid credentials and tampered cookies", async () => {
    await expect(\n      createSessionCookie("wrong", "correct-secret"),\n    ).resolves.toBeNull();
    const cookie = await createSessionCookie("correct-secret", "correct-secret");
    const token = cookie!.split(";")[0]!;
    const tampered = token.replace(/\.[^.]+$/, ".tampered");
    const request = new Request("https://example.com/api/account", {
      headers: { cookie: tampered },
    });
    await expect(isAuthenticated(request, "correct-secret")).resolves.toBe(false);
  });

  it("clears the session without exposing credentials", () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain("qvapay_ai_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).not.toContain("correct-secret");
  });
});
