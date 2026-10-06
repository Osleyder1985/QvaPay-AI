import { beforeEach, describe, expect, it, vi } from "vitest";

const { createUserMock } = vi.hoisted(() => ({
  createUserMock: vi.fn(),
}));

vi.mock("../../src/infrastructure/cloudflare/auth-rbac.js", () => ({
  createUser: createUserMock,
}));

import { bootstrapInitialAdmin } from "../../src/infrastructure/cloudflare/initial-admin-setup.js";

function createDb(count: number) {
  const run = vi.fn().mockResolvedValue({});
  const bind = vi.fn(() => ({ run }));
  const first = vi.fn().mockResolvedValue({ count });
  const prepare = vi.fn((sql: string) => ({
    first: sql.includes("COUNT(*)") ? first : undefined,
    bind,
  }));
  return { prepare, run, bind, first };
}

describe("initial Administration bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUserMock.mockResolvedValue({
      id: "admin-id",
      username: "owner",
      role: "ADMINISTRATION",
      active: true,
      createdAt: "2026-10-06T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z",
      lastLoginAt: null,
    });
  });

  it("rejects an invalid bootstrap token before reading user state", async () => {
    const db = createDb(0);
    await expect(
      bootstrapInitialAdmin(
        db as never,
        "expected",
        "wrong",
        "owner",
        "a".repeat(12),
      ),
    ).rejects.toThrow("Token de configuración inválido.");
    expect(db.prepare).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("creates the first Administration account with the owner-selected credentials", async () => {
    const db = createDb(0);
    const user = await bootstrapInitialAdmin(
      db as never,
      "expected",
      "expected",
      "owner",
      "a".repeat(12),
    );
    expect(user.username).toBe("owner");
    expect(createUserMock).toHaveBeenCalledWith(
      db,
      "owner",
      "a".repeat(12),
      "ADMINISTRATION",
    );
    expect(db.run).toHaveBeenCalledTimes(1);
  });

  it("rejects bootstrap after the first application user exists", async () => {
    const db = createDb(1);
    await expect(
      bootstrapInitialAdmin(
        db as never,
        "expected",
        "expected",
        "owner",
        "a".repeat(12),
      ),
    ).rejects.toThrow("La configuración inicial ya fue completada.");
    expect(createUserMock).not.toHaveBeenCalled();
  });
});
