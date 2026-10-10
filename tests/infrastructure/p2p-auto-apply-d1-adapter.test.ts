import { describe, expect, it, vi } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import {
  QvaPayAmbiguousOperationError,
  QvaPayProviderError,
} from "../../src/infrastructure/qvapay/qvapay-p2p-client.js";
import { createD1AutoApplyExecutionPorts } from "../../src/infrastructure/cloudflare/p2p-auto-apply-d1-adapter.js";
import { executeAutoApplyCandidate } from "../../src/application/p2p-auto-apply-executor.js";

function unusedDatabase(): D1Database {
  return {
    prepare: vi.fn(() => {
      throw new Error("D1 no debe consultarse sin estrategia habilitada");
    }),
    batch: vi.fn(() => {
      throw new Error("D1 no debe consultarse sin estrategia habilitada");
    }),
  } as unknown as D1Database;
}

describe("createD1AutoApplyExecutionPorts", () => {
  it("falla cerrado sin estrategia y no toca D1 ni al proveedor", async () => {
    const applyOffer = vi.fn(async () => ({}));
    const db = unusedDatabase();
    const ports = createD1AutoApplyExecutionPorts({ db, provider: { applyOffer } });

    await expect(executeAutoApplyCandidate(ports)).resolves.toEqual({
      examined: 0,
      eligible: 0,
      attempted: 0,
      skipped: 0,
    });
    expect(applyOffer).not.toHaveBeenCalled();
    expect(db.prepare).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("clasifica un timeout ambiguo sin reintentar el proveedor", async () => {
    const applyOffer = vi.fn(async () => {
      throw new QvaPayAmbiguousOperationError("offer-1");
    });
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "AMBIGUOUS",
      httpStatus: null,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });

  it("clasifica un rechazo explícito 4xx como REJECTED sin reintentar", async () => {
    const applyOffer = vi.fn(async () => {
      throw new QvaPayProviderError(403, "No autorizado", "invalid-request");
    });
    const ports = createD1AutoApplyExecutionPorts({
      db: unusedDatabase(),
      provider: { applyOffer },
    });

    await expect(ports.applyOnce("offer-1")).resolves.toEqual({
      status: "REJECTED",
      httpStatus: 403,
    });
    expect(applyOffer).toHaveBeenCalledTimes(1);
  });
});
