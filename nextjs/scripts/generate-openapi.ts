import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateOpenApiDocument } from "../lib/openapi/generator";

async function main() {
  const document = await generateOpenApiDocument();
  const outputDir = path.join(process.cwd(), "public");
  const outputPath = path.join(outputDir, "openapi.json");

  // Keep the generated spec in public/ so docs tooling and the website can
  // fetch a single canonical OpenAPI document at a stable URL.
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error("[generate-openapi]", error);
  process.exit(1);
});
