/**
 * @archivo scripts/check-prettier-exclusions.mjs
 * @proposito Impide que se excluyan archivos o bloques del formato global de Prettier.
 * @responsabilidades Detectar archivos .prettierignore y directivas prettier-ignore en archivos de texto del repositorio.
 * @ubicacion scripts de control de calidad del repositorio QvaPay-AI.
 */
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".wrangler",
]);
const binaryExtensions = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);
const directive =
  /^\s*(?:\/\/|\/\*|\*|<!--|#)\s*prettier-ignore(?:-start|-end)?\b/m;
const violations = [];

async function inspectDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    const relativePath = relative(root, path).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      await inspectDirectory(path);
      continue;
    }

    if (entry.name === ".prettierignore") {
      violations.push(
        relativePath + ": no se permiten listas de exclusión de Prettier",
      );
      continue;
    }

    if (binaryExtensions.has(extname(entry.name).toLowerCase())) continue;

    const content = await readFile(path);
    // Evita decodificar archivos binarios desconocidos como si fueran texto.
    if (content.includes(0)) continue;

    if (directive.test(content.toString("utf8"))) {
      violations.push(
        relativePath + ": contiene una directiva prettier-ignore",
      );
    }
  }
}

await inspectDirectory(root);
if (violations.length > 0) {
  console.error("Se detectaron exclusiones de formato no permitidas:");
  for (const violation of violations) console.error("- " + violation);
  process.exitCode = 1;
} else {
  console.log(
    "Control de exclusiones de Prettier aprobado: no hay archivos ni bloques excluidos.",
  );
}
