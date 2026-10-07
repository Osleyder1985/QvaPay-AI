import fs from "node:fs";
import path from "node:path";

const IGNORED = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".wrangler",
  "package-lock.json",
]);
const EXTENSIONS = new Set([
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".toml",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".sql",
]);
const EXCEPTION_CATEGORIES = new Set([
  "TECH_IDENTIFIER",
  "API_CONTRACT",
  "PERSISTED_LITERAL",
  "TECH_NAME",
  "COMMAND",
  "OFFICIAL_NAME",
  "EXTERNAL_TEXT",
  "FIXTURE_TEXT",
]);
const SPANISH = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "de",
  "del",
  "para",
  "por",
  "con",
  "sin",
  "que",
  "se",
  "es",
  "son",
  "en",
  "y",
  "o",
  "como",
  "cuando",
  "donde",
  "debe",
  "deben",
  "esta",
  "este",
  "estos",
  "estas",
  "puede",
  "pueden",
  "solo",
  "también",
  "texto",
  "control",
  "documentación",
  "archivo",
  "archivos",
  "error",
  "mensaje",
  "prueba",
  "pruebas",
  "configuración",
  "seguridad",
  "cuenta",
  "mercado",
  "oferta",
  "ofertas",
  "usuario",
  "usuarios",
  "datos",
  "estado",
  "válido",
  "válida",
  "requiere",
  "requieren",
  "ejecución",
  "verificación",
  "verificar",
  "evidencia",
  "catálogo",
  "excepción",
  "excepciones",
  "pendiente",
  "permitido",
  "permitida",
]);
const ENGLISH = new Set([
  "the",
  "this",
  "these",
  "those",
  "and",
  "or",
  "of",
  "to",
  "for",
  "from",
  "with",
  "without",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "as",
  "by",
  "on",
  "in",
  "into",
  "through",
  "after",
  "before",
  "when",
  "where",
  "which",
  "that",
  "must",
  "should",
  "can",
  "cannot",
  "does",
  "do",
  "not",
  "only",
  "all",
  "any",
  "using",
  "used",
  "use",
  "valid",
  "invalid",
  "required",
  "failed",
  "failure",
  "checkout",
  "install",
  "setup",
  "verify",
  "deploy",
  "passed",
  "missing",
  "expected",
  "received",
  "creates",
  "created",
  "accepts",
  "rejects",
  "preserves",
  "preserve",
  "schedules",
  "schedule",
  "configured",
  "interval",
  "execution",
]);

function likelyEnglish(text) {
  const tokens =
    text
      .toLocaleLowerCase("en")
      .normalize("NFKC")
      .match(/[a-záéíóúüñ]+(?:'[a-z]+)?/gi) || [];
  let en = 0;
  let es = 0;
  for (const token of tokens) {
    if (ENGLISH.has(token)) en += 1;
    if (SPANISH.has(token)) es += 1;
  }
  const value = text.trim().toLocaleLowerCase("en");
  const strong =
    es === 0 &&
    (/^(the|this|these|those)\b/i.test(value) ||
      /\b(must|failed|missing|verification|repository|deployment|credentials)\b/i.test(
        value,
      ));
  return strong || (en >= 2 && en > es && tokens.length >= 2);
}

function technicalLiteral(text) {
  const value = text.trim();
  if (!value) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^\//.test(value) && !/\s/.test(value)) return true;
  if (/^[A-Z0-9_./:@-]+$/.test(value) && !/\s/.test(value)) return true;
  if (/^[a-z0-9_.:@/-]+$/.test(value) && !/\s/.test(value)) return true;
  if (/^\$\{.*\}$/.test(value)) return true;
  if (/^[A-Za-z_$][\\w$]*:\\s*$/.test(value)) return true;
  if (/^[{}[\\],;]+[A-Za-z_$][\\w$]*:\\s*$/.test(value)) return true;
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/i.test(value)) {
    return true;
  }
  if (
    /^(BUY|SELL|open|processing|paid|completed|cancelled|revision)$/i.test(
      value,
    )
  )
    return true;
  if (/^(npm\s+run|npx\s|node\s|git\s|wrangler\s)/i.test(value)) return true;
  return false;
}

function position(source, offset) {
  const before = source.slice(0, Math.max(0, offset));
  return {
    line: before.split(/\r?\n/).length,
    column: offset - before.lastIndexOf("\n"),
  };
}
function makeCandidate(file, source, text, category, offset, context) {
  const pos = position(source, offset);
  return {
    file,
    line: pos.line,
    column: pos.column,
    text: text.trim(),
    category,
    source: "language-control:" + context,
  };
}

function discover(root) {
  const result = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (IGNORED.has(entry.name)) continue;
      if (entry.name.startsWith(".") && entry.name !== ".github") continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (
        entry.isFile() &&
        EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      )
        result.push(full);
    }
  }
  visit(root);
  return result.sort();
}

function extractMarkdown(text, file) {
  const result = [];
  let fence = false;
  let offset = 0;
  const fenceMarker = String.fromCharCode(96).repeat(3);
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(fenceMarker)) {
      fence = !fence;
      offset += raw.length + 1;
      continue;
    }
    if (!fence && trimmed && !/^\|/.test(trimmed)) {
      const value = trimmed.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, "");
      if (value && !technicalLiteral(value))
        result.push(
          makeCandidate(file, text, value, "PROSE", offset, "markdown"),
        );
    }
    offset += raw.length + 1;
  }
  return result;
}

function extractCode(text, file) {
  const result = [];
  const commentPattern = /\/\/!?[^\r\n]*|\/\*[\s\S]*?\*\//g;
  for (const match of text.matchAll(commentPattern)) {
    const raw = match[0]
      .replace(/^\/\/!?\s?/, "")
      .replace(/^\/\*[*!]?\s?/, "")
      .replace(/\*\/$/, "")
      .trim();
    if (raw)
      result.push(
        makeCandidate(file, text, raw, "DOC_COMMENT", match.index, "comment"),
      );
  }

  const stringPattern = /(['"])([^'"\r\n]*)\1/g;
  for (const match of text.matchAll(stringPattern)) {
    const value = match[0].slice(1, -1).trim();
    if (!value || technicalLiteral(value)) continue;
    const offset = match.index;
    const before = text.slice(Math.max(0, offset - 80), offset);
    if (/:\s*$/.test(before)) continue;
    let category = "PROSE";
    let context = "string";
    if (/\b(?:describe|it|test)\s*\(\s*$/.test(before)) {
      category = "TEST_DESCRIPTION";
      context = "test";
    } else if (
      /\b(?:console\.(?:error|warn|log|info|debug))\s*\(\s*$/.test(before)
    ) {
      category = "LOG_MESSAGE";
      context = "console";
    } else if (
      /\bnew\s+Error\s*\(\s*$/.test(before) ||
      /\bthrow\s+new\s+Error\s*\(\s*$/.test(before)
    ) {
      category = "ERROR_MESSAGE";
      context = "Error";
    }
    result.push(makeCandidate(file, text, value, category, offset, context));
  }
  return result;
}
function extractJson(text, file) {
  const result = [];
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [
      makeCandidate(file, text, "JSON no válido", "PROSE", 0, "json-parse"),
    ];
  }
  function visit(value) {
    if (typeof value === "string") {
      if (!technicalLiteral(value)) {
        const offset = text.indexOf(JSON.stringify(value));
        result.push(
          makeCandidate(
            file,
            text,
            value,
            "PROSE",
            offset >= 0 ? offset : 0,
            "json-value",
          ),
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") Object.values(value).forEach(visit);
  }
  visit(data);
  return result;
}

function extractLineFormat(text, file, kind) {
  const result = [];
  let offset = 0;
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) {
      offset += raw.length + 1;
      continue;
    }
    const comment =
      kind === "sql"
        ? trimmed.match(/^--\s?(.*)$/)
        : trimmed.match(/^#\s?(.*)$/);
    if (comment && comment[1])
      result.push(
        makeCandidate(
          file,
          text,
          comment[1],
          "DOC_COMMENT",
          offset,
          kind + "-comment",
        ),
      );
    if (kind === "yaml") {
      const name = trimmed.match(/^name:\s*(.+?)\s*$/);
      if (name && name[1] && !technicalLiteral(name[1]))
        result.push(
          makeCandidate(
            file,
            text,
            name[1].replace(/^["']|["']$/g, ""),
            "CI_MESSAGE",
            offset,
            "yaml-name",
          ),
        );
      const run = trimmed.match(/^run:\s*(.+?)\s*$/);
      if (run && run[1] && /\b(echo|printf)\b/i.test(run[1])) {
        const message = run[1]
          .replace(/^\s*(echo|printf)\s+/i, "")
          .replace(/^["']|["']$/g, "");
        if (message && !technicalLiteral(message))
          result.push(
            makeCandidate(
              file,
              text,
              message,
              "CI_MESSAGE",
              offset,
              "yaml-output",
            ),
          );
      }
    }
    if ((kind === "toml" || kind === "sql") && /["']/.test(trimmed)) {
      const match = trimmed.match(/["']([^"']+)["']/);
      if (match && !technicalLiteral(match[1]))
        result.push(
          makeCandidate(
            file,
            text,
            match[1],
            "PROSE",
            offset,
            kind + "-literal",
          ),
        );
    }
    offset += raw.length + 1;
  }
  return result;
}

function extract(file, root) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const text = fs.readFileSync(file, "utf8");
  const ext = path.extname(file).toLowerCase();
  if (ext === ".md") return extractMarkdown(text, relative);
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(ext))
    return extractCode(text, relative);
  if (ext === ".json") return extractJson(text, relative);
  if (ext === ".yaml" || ext === ".yml")
    return extractLineFormat(text, relative, "yaml");
  if (ext === ".toml") return extractLineFormat(text, relative, "toml");
  if (ext === ".sql") return extractLineFormat(text, relative, "sql");
  return [];
}

export function validateCatalog(catalog) {
  const errors = [];
  const ids = new Set();
  if (!catalog || typeof catalog !== "object")
    return ["El catálogo no es un objeto."];
  if (!/^\d+\.\d+\.\d+$/.test(catalog.schema_version || ""))
    errors.push("schema_version inválida.");
  if (!Array.isArray(catalog.exceptions))
    errors.push("exceptions debe ser un arreglo.");
  for (const entry of catalog.exceptions || []) {
    const required = [
      "id",
      "match",
      "match_type",
      "category",
      "scope",
      "context",
      "reason_es",
      "source",
      "translation_risk",
      "owner",
      "state",
      "review",
      "evidence",
    ];
    for (const key of required)
      if (!(key in entry))
        errors.push((entry.id || "<sin-id>") + ": falta " + key + ".");
    if (ids.has(entry.id)) errors.push(entry.id + ": ID duplicado.");
    ids.add(entry.id);
    if (!EXCEPTION_CATEGORIES.has(entry.category))
      errors.push(entry.id + ": categoría no permitida.");
    if (!Array.isArray(entry.scope?.paths) || entry.scope.paths.length === 0)
      errors.push(entry.id + ": alcance vacío.");
    if (!entry.context?.kind) errors.push(entry.id + ": contexto ausente.");
    if (!entry.reason_es?.trim()) errors.push(entry.id + ": reason_es vacío.");
    if (!entry.owner?.trim()) errors.push(entry.id + ": owner vacío.");
    if (!Array.isArray(entry.evidence) || entry.evidence.length === 0)
      errors.push(entry.id + ": evidence ausente.");
    if (entry.state === "ACTIVE" && entry.review?.status !== "VALIDADA")
      errors.push(entry.id + ": ACTIVE requiere revisión VALIDADA.");
    if (
      ["EXTERNAL_TEXT", "FIXTURE_TEXT", "OFFICIAL_NAME"].includes(
        entry.category,
      ) &&
      (!entry.source || !entry.evidence?.length)
    )
      errors.push(entry.id + ": requiere procedencia y evidencia.");
    if (
      entry.scope?.paths?.some(
        (value) => value === "." || value === "**" || value === "**/*",
      )
    )
      errors.push(entry.id + ": no se permite alcance global.");
  }
  return errors;
}

function loadCatalog(root) {
  return JSON.parse(
    fs.readFileSync(
      path.join(root, "config", "documentation-language-exceptions.json"),
      "utf8",
    ),
  );
}
function exceptionMatches(entry, item) {
  if (entry.state !== "ACTIVE" || entry.review?.status !== "VALIDADA")
    return false;
  if (!entry.scope?.paths?.includes(item.file)) return false;
  if (entry.match_type === "literal") return entry.match === item.text;
  if (entry.match_type === "pattern") {
    try {
      return new RegExp(entry.match).test(item.text);
    } catch {
      return false;
    }
  }
  return false;
}

function exceptionCategoryApplies(entry, item) {
  const compatible = new Map([
    ["OFFICIAL_NAME", new Set(["CI_MESSAGE", "PROSE"])],
    ["EXTERNAL_TEXT", new Set(["ERROR_MESSAGE", "LOG_MESSAGE", "PROSE"])],
    [
      "FIXTURE_TEXT",
      new Set(["PROSE", "TEST_DESCRIPTION", "ERROR_MESSAGE", "LOG_MESSAGE"]),
    ],
    ["TECH_IDENTIFIER", new Set(["PROSE"])],
    ["API_CONTRACT", new Set(["PROSE"])],
    ["PERSISTED_LITERAL", new Set(["PROSE"])],
    ["TECH_NAME", new Set(["PROSE"])],
    ["COMMAND", new Set(["PROSE", "CI_MESSAGE"])],
  ]);
  return compatible.get(entry.category)?.has(item.category) ?? false;
}

function contextMatches(entry, item) {
  const sourceContext = item.source.split(":").at(-1);
  const allowed = new Map([
    ["workflow_name", new Set(["yaml-name"])],
    ["external_response", new Set(["string", "Error", "console"])],
    ["fixture", new Set(["string", "test", "Error", "console"])],
    ["clave_contractual", new Set(["string"])],
    ["valor_contractual", new Set(["string"])],
  ]);
  return (
    !entry.context?.kind ||
    allowed.get(entry.context.kind)?.has(sourceContext) === true
  );
}

function resolveException(catalog, item) {
  const matches = (catalog.exceptions || []).filter(
    (entry) =>
      exceptionMatches(entry, item) &&
      exceptionCategoryApplies(entry, item) &&
      contextMatches(entry, item),
  );
  return matches.length === 1 ? matches[0] : null;
}

export function analyzeRepository(root = process.cwd()) {
  const catalog = loadCatalog(root);
  const catalogErrors = validateCatalog(catalog);
  const allFiles = discover(root);
  const candidates = allFiles.flatMap((file) => extract(file, root));
  const findings = [];
  for (const item of candidates) {
    const exception = resolveException(catalog, item);
    if (exception) continue;
    if (!likelyEnglish(item.text)) continue;
    findings.push({
      ...item,
      severity: "ERROR",
      decision: "CORREGIR",
      rule: "AUTHORED_PROSE_MUST_BE_SPANISH",
      message_es:
        "Se detectó prosa authored en inglés y no existe una excepción activa aplicable.",
    });
  }
  for (const error of catalogErrors)
    findings.push({
      file: "config/documentation-language-exceptions.json",
      line: 1,
      column: 1,
      text: error,
      category: "PROSE",
      source: "catalog-validator",
      severity: "ERROR",
      decision: "REVISAR",
      rule: "VALID_CATALOG_REQUIRED",
      message_es: error,
    });
  findings.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.text.localeCompare(b.text),
  );
  return {
    version: "1.0.0",
    catalog_version: catalog.schema_version,
    result: findings.length === 0 ? "PASS" : "FAIL",
    findings,
    summary: {
      files: allFiles.length,
      candidates: candidates.length,
      findings: findings.length,
      errors: findings.filter((x) => x.severity === "ERROR").length,
      review_required: findings.filter((x) => x.severity === "REVIEW_REQUIRED")
        .length,
    },
  };
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  const report = analyzeRepository(process.cwd());
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.result === "PASS" ? 0 : 1);
}
