import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("GET /api/scanner/status", () => {
  it("no programa el scheduler como efecto secundario de una lectura", () => {
    const path = fileURLToPath(
      new URL("../../src/infrastructure/cloudflare/worker.ts", import.meta.url),
    );
    const source = readFileSync(path, "utf8");
    const marker = 'if (url.pathname === "/api/scanner/status")';
    const start = source.indexOf(marker);
    const end = source.indexOf("const applyMatch", start);
    const block = source.slice(start, end);
    expect(block).toContain("getState()");
    expect(block).not.toContain("ensureScheduled");
  });
});
