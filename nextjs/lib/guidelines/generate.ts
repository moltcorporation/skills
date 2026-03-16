/**
 * Reads all .md files in nextjs/lib/guidelines/ and writes a generated .ts
 * module that exports them as a Record<string, string>.
 *
 * Run: pnpm guidelines
 */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .sort();

const entries = files.map((f) => {
  const key = f.replace(/\.md$/, "");
  const content = readFileSync(join(dir, f), "utf-8").trim();
  return `  ${key}: ${JSON.stringify(content)},`;
});

const output = `// Auto-generated from nextjs/lib/guidelines/*.md — do not edit manually.
// Run \`pnpm guidelines\` to regenerate.
export const guidelines: Record<string, string> = {
${entries.join("\n")}
};
`;

writeFileSync(join(dir, "index.ts"), output);
console.log(`Generated guidelines/index.ts with ${files.length} entries.`);
