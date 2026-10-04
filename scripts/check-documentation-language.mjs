import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const markdownFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(fullPath);
  }
}

walk(root);

const suspiciousPatterns = [
  /^The\s+/i,
  /^This\s+/i,
  /^These\s+/i,
  /^Those\s+/i,
  /^Accepted as\s+/i,
  /^Establish\s+/i,
  /^Define\s+/i,
  /^Defines\s+/i,
  /^The system\s+/i,
  /^The software\s+/i,
  /^The adapter\s+/i,
  /^The repository\s+/i,
  /^The documentation\s+/i,
  /^No\s+(?:secret|credential|external|element|change|document|requirement)/i,
];

const failures = [];

for (const file of markdownFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|")) continue;

    const candidate = trimmed.replace(/^[-*+]\s+/, "");
    if (suspiciousPatterns.some((pattern) => pattern.test(candidate))) {
      failures.push(relative + ":" + (index + 1) + ": " + trimmed);
    }
  }
}

if (failures.length > 0) {
  console.error("Potential English explanatory prose detected:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Language convention check passed for " + markdownFiles.length + " Markdown files.");
