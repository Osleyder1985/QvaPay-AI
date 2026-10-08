import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workerSource = readFileSync(
  resolve(process.cwd(), "src/infrastructure/cloudflare/worker.ts"),
  "utf8",
);
const deployWorkflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/cloudflare-deploy.yml"),
  "utf8",
);

describe("production credential separation", () => {
  it("declara un secreto de smoke dedicado en el entorno del Worker", () => {
    expect(workerSource).toContain("PRODUCTION_SMOKE_TOKEN: string");
    expect(workerSource).toContain(
      "authorization !== \`Bearer \${env.PRODUCTION_SMOKE_TOKEN}\`",
    );
  });

  it("mantiene la autoridad de bootstrap del scanner en sus endpoints", () => {
    expect(workerSource).toContain(
      "authorization !== \`Bearer \${env.SCANNER_BOOTSTRAP_TOKEN}\`",
    );
    const smokeSection = workerSource.slice(
      workerSource.indexOf('url.pathname === "/internal/auth/smoke-user"'),
      workerSource.indexOf('url.pathname === "/api/auth/logout"'),
    );
    expect(smokeSection).not.toContain("SCANNER_BOOTSTRAP_TOKEN");
  });

  it("provisiona y utiliza credenciales de producción separadas en CI", () => {
    expect(deployWorkflow).toContain("PRODUCTION_SMOKE_TOKEN=");
    expect(deployWorkflow).toContain(
      "secret put PRODUCTION_SMOKE_TOKEN",
    );
    const smokeLifecycle = deployWorkflow.slice(
      deployWorkflow.indexOf("cleanup_smoke_user()"),
      deployWorkflow.indexOf('echo "Authenticating smoke account against production..."'),
    );
    expect(smokeLifecycle).toContain(
      "Authorization: Bearer $PRODUCTION_SMOKE_TOKEN",
    );
    expect(smokeLifecycle).not.toContain(
      "Authorization: Bearer $SCANNER_BOOTSTRAP_TOKEN",
    );
  });
});
