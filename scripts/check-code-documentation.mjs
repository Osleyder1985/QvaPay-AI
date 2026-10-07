#!/usr/bin/env node

/**
 * @archivo scripts/check-code-documentation.mjs
 * @proposito Verificar la documentación estructural mínima del código fuente.
 * @responsabilidades Comprobar encabezados documentales y contratos TSDoc/JSDoc aplicables.
 * @dependencias Node.js fs y path.
 * @seguridad Solo lee el árbol fuente; no procesa secretos ni modifica archivos.
 * @superficie-publica Proceso ejecutable mediante npm run check:code-docs.
 * @mantenimiento Mantener alineado con docs/quality/code-documentation-standard.md.
 * @ubicacion Herramientas de gobernanza y calidad del repositorio.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const BASE_REQUIRED_MARKERS = [
  "@archivo",
  "@proposito",
  "@responsabilidades",
  "@ubicacion",
];
const CRITICAL_REQUIRED_MARKERS = [
  ...BASE_REQUIRED_MARKERS,
  "@dependencias",
  "@seguridad",
  "@superficie-publica",
  "@mantenimiento",
];
const CRITICAL_FILES = new Set([
  "src/application/scanner-runtime.ts",
  "src/domain/market.ts",
  "src/domain/offer.ts",
  "src/infrastructure/qvapay/qvapay-account-client.ts",
  "src/infrastructure/qvapay/qvapay-p2p-client.ts",
  "src/infrastructure/qvapay/p2p-mapper.ts",
]);

function collectFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(fullPath));
    else if (
      entry.isFile() &&
      /\.tsx?$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      result.push(fullPath);
    }
  }
  return result;
}

function firstCommentBlock(source) {
  const normalized = source.replace(/^\uFEFF/, "");
  const match = normalized.match(/^\s*\/\*[\s\S]*?\*\//);
  return match?.[0] ?? "";
}

function hasDocumentationImmediatelyBefore(source, index) {
  const before = source.slice(0, index);
  return /\/\*[\s\S]*\*\/\s*$/.test(before);
}

const findings = [];
for (const file of collectFiles(ROOT).sort()) {
  const source = fs.readFileSync(file, "utf8");
  const comment = firstCommentBlock(source);
  const relativeFile = path.relative(process.cwd(), file).replaceAll(path.sep, "/");
  const requiredMarkers = CRITICAL_FILES.has(relativeFile)
    ? CRITICAL_REQUIRED_MARKERS
    : BASE_REQUIRED_MARKERS;

  for (const marker of requiredMarkers) {
    if (!comment.includes(marker)) {
      findings.push({
        file: relativeFile,
        marker,
      });
    }
  }

  const behaviorPattern =
    /(?:^|\n)(\s*)export\s+(?:(?:async)\s+)?(?:function|class)\s+[A-Za-z_$][\w$]*/g;
  for (const match of source.matchAll(behaviorPattern)) {
    const exportIndex = match.index + match[0].lastIndexOf("export");
    if (!hasDocumentationImmediatelyBefore(source, exportIndex)) {
      findings.push({
        file: relativeFile,
        marker: "JSDoc/TSDoc para API de comportamiento exportada",
      });
    }
  }
}

if (findings.length) {
  console.error("CONTROL DE DOCUMENTACIÓN DEL CÓDIGO: FALLÓ");
  for (const finding of findings) {
    console.error(`- ${finding.file}: falta ${finding.marker}`);
  }
  process.exit(1);
}

console.log("CONTROL DE DOCUMENTACIÓN DEL CÓDIGO: PASS");
