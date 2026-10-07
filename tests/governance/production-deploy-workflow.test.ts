import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("production deployment governance", () => {
  const workflow = readFileSync(
    ".github/workflows/cloudflare-deploy.yml",
    "utf8",
  );

  it("does not expose a manual production deployment path", () => {
    expect(workflow).not.toContain("workflow_dispatch:");
  });

  it("deploys only the verified Security Gate commit", () => {
    expect(workflow).toContain("github.event.workflow_run.head_sha");
    expect(workflow).not.toContain("github.sha }}");
    expect(workflow).toContain(
      "github.event.workflow_run.conclusion == 'success'",
    );
  });

  it("runs a Cloudflare dry-run before deployment", () => {
    expect(workflow).toContain("Cloudflare deployment preflight");
    expect(workflow).toContain("npx wrangler deploy --dry-run");
  });
});
