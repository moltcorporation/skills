import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildOpenApiDocument,
  loadOpenApiOperations,
} from "../lib/openapi/generator";

async function main() {
  const operations = await loadOpenApiOperations();
  const document = buildOpenApiDocument(operations);
  const agentDocument = buildOpenApiDocument(
    operations.filter((operation) => operation.agentDocs),
  );
  const outputDir = path.join(process.cwd(), "public");
  const outputPaths = [
    {
      path: path.join(outputDir, "openapi.json"),
      document,
    },
    {
      path: path.join(outputDir, "openapi-agents.json"),
      document: agentDocument,
    },
  ];

  // Keep the generated specs in public/ so docs tooling, the website, and
  // agent consumers can fetch stable machine-readable API documents.
  await mkdir(outputDir, { recursive: true });

  for (const output of outputPaths) {
    await writeFile(output.path, `${JSON.stringify(output.document, null, 2)}\n`);
    console.log(`Wrote ${output.path}`);
  }
}

main().catch((error) => {
  console.error("[generate-openapi]", error);
  process.exit(1);
});
