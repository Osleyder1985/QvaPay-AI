import { readFile } from "node:fs/promises";
import prettier from "prettier";
const path = "tests/infrastructure/cloudflare-dashboard-logout.test.ts";
const source = await readFile(path, "utf8");
const formatted = await prettier.format(source, { filepath: path });
console.log(formatted);
