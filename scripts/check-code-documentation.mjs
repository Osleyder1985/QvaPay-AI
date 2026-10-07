#!/usr/bin/env node

/**
 * @archivo scripts/check-code-documentation.mjs
 * @proposito Verificar la documentación estructural mínima del código fuente.
 * @responsabilidades Comprobar encabezados documentales de archivos mantenidos bajo src.
 * @ubicacion Herramientas de gobernanza y calidad del repositorio.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const REQUIRED_MARKERS = [
  "@archivo",
  "@proposito",
  "@responsabilidades",
  "@ubicacion",
];

function collectFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(fullPath));
    else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
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

const findings = [];
for (const file of collectFiles(ROOT).sort()) {
  const comment = firstCommentBlock(fs.readFileSync(file, "utf8"));
  const relativeFile = path.relative(process.cwd(), file).replaceAll(path.sep, "/");

  for (const marker of REQUIRED_MARKERS) {
    if (!comment.includes(marker)) {
      findings.push({
        file: relativeFile,
        marker,
      });
    }
  }

  const source = fs.readFileSync(file, "utf8");
  const behaviorPattern = /(?:^|\n)(\s*)export\s+(?:(?:async)\s+)?(?:function|class)\\s+[A-Za-z_$][\\w$]*/g;
  for (const match of source.matchAll(behaviorPattern)) {
    const before = source.slice(0, match.index + match[0].lastIndexOf("export"));
    if (!/\\/\\*[\\s\\S]*\\*\\/\\s*$/.test(before)) {
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
