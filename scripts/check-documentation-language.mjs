import { analyzeRepository } from "./documentation-language-control.mjs";

const report = analyzeRepository(process.cwd());
console.log(JSON.stringify(report, null, 2));
process.exit(report.result === "PASS" ? 0 : 1);
