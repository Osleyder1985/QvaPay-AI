import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error El módulo MJS se ejecuta como script de Node y no expone declaraciones TypeScript.
import { analyzeRepository, validateCatalog } from "../../scripts/documentation-language-control.mjs";

const temporaryDirectories: string[] = [];

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "qvapay-language-"));
  temporaryDirectories.push(root);
  fs.mkdirSync(path.join(root, "config"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "config", "documentation-language-exceptions.json"),
    JSON.stringify({ schema_version: "1.0.0", exceptions: [] }, null, 2),
  );
  fs.writeFileSync(
    path.join(root, "config", "documentation-language-exceptions.schema.json"),
    "{}",
  );
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("control lingüístico documental", () => {
  it("acepta prosa authored en español", () => {
    const root = createFixture();
    fs.writeFileSync(
      path.join(root, "documento.md"),
      "# Documento\n\nLa verificación del control requiere evidencia.\n",
    );

    const report = analyzeRepository(root);

    expect(report.result).toBe("PASS");
    expect(report.findings).toHaveLength(0);
  });

  it("rechaza comentarios y descripciones de pruebas authored en inglés", () => {
    const root = createFixture();
    fs.writeFileSync(
      path.join(root, "ejemplo.ts"),
      [
        "// This comment explains the system",
        "describe(\"validates the configured interval\", () => {});",
      ].join("\n"),
    );

    const report = analyzeRepository(root);

    expect(report.result).toBe("FAIL");
    expect(report.findings.some((item: { category: string }) => item.category === "DOC_COMMENT")).toBe(true);
    expect(report.findings.some((item: { category: string }) => item.category === "TEST_DESCRIPTION")).toBe(true);
  });

  it("preserva literales técnicos sin convertirlos en prosa", () => {
    const root = createFixture();
    fs.writeFileSync(
      path.join(root, "contrato.ts"),
      [
        "const current_page = \"current_page\";",
        "const operation = \"buy\";",
      ].join("\n"),
    );

    const report = analyzeRepository(root);

    expect(report.result).toBe("PASS");
    expect(report.findings).toHaveLength(0);
  });

  it("aplica una excepción ACTIVE solo con revisión VALIDADA y contexto compatible", () => {
    const root = createFixture();
    fs.writeFileSync(
      path.join(root, "workflow.yml"),
      "name: Security Gate\n",
    );
    fs.writeFileSync(
      path.join(root, "config", "documentation-language-exceptions.json"),
      JSON.stringify({
        schema_version: "1.0.0",
        exceptions: [{
          id: "EXC-998",
          match: "Security Gate",
          match_type: "literal",
          category: "OFFICIAL_NAME",
          scope: { paths: ["workflow.yml"] },
          context: { kind: "workflow_name" },
          reason_es: "Nombre oficial del flujo de trabajo.",
          source: "Definición del flujo de trabajo del repositorio.",
          translation_risk: "HIGH",
          owner: "QvaPay-AI",
          state: "ACTIVE",
          review: { status: "VALIDADA" },
          evidence: ["El nombre es referenciado por otros flujos del repositorio."],
        }],
      }, null, 2),
    );

    const report = analyzeRepository(root);

    expect(report.result).toBe("PASS");
    expect(report.findings).toHaveLength(0);
  });

  it("rechaza una excepción ACTIVE sin revisión válida", () => {
    const errors = validateCatalog({
      schema_version: "1.0.0",
      exceptions: [{
        id: "EXC-999",
        match: "current_page",
        match_type: "literal",
        category: "API_CONTRACT",
        scope: { paths: ["src/example.ts"] },
        context: { kind: "clave_contractual" },
        reason_es: "Cadena contractual.",
        source: "contrato externo",
        translation_risk: "CRITICAL",
        owner: "QvaPay-AI",
        state: "ACTIVE",
        review: { status: "PENDIENTE" },
        evidence: ["Evidencia de prueba."],
      }],
    });

    expect(errors).toContain("EXC-999: ACTIVE requiere revisión VALIDADA.");
  });

  it("produce resultados deterministas", () => {
    const root = createFixture();
    fs.writeFileSync(
      path.join(root, "documento.md"),
      "The repository must pass the verification before deployment.\n",
    );

    const first = JSON.stringify(analyzeRepository(root));
    const second = JSON.stringify(analyzeRepository(root));

    expect(first).toBe(second);
  });
});
