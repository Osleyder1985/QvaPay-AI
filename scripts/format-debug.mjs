import { readFile } from "node:fs/promises";
import prettier from "prettier";
const path = "tests/data/positive-financial-invariants.test.ts";
const source = await readFile(path, "utf8");
console.log(await prettier.format(source, { filepath: path }));
