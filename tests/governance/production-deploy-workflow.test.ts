import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("gobernanza del despliegue de producción", () => {
  const workflow = readFileSync(
    ".github/workflows/cloudflare-deploy.yml",
    "utf8",
  );

  it("no expone una ruta manual de despliegue de producción", () => {
    expect(workflow).not.toContain("workflow_dispatch:");
  });

  it("despliega únicamente el commit verificado por Security Gate", () => {
    expect(workflow).toContain("github.event.workflow_run.head_sha");
    expect(workflow).not.toContain("github.sha }}");
    expect(workflow).toContain(
      "github.event.workflow_run.conclusion == 'success'",
    );
  });

  it("ejecuta una validación previa de Cloudflare antes del despliegue", () => {
    expect(workflow).toContain(
      "validación previa del despliegue de Cloudflare",
    );
    expect(workflow).toContain("npx wrangler deploy --dry-run");
  });
});
