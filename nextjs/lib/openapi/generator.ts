import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { tagDescriptions, type OpenApiTagName } from "./tag-descriptions";
import ts from "typescript";

export type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RouteCommentMetadata = {
  agentDocs: boolean;
  method: Lowercase<RouteMethod>;
  path: string;
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
};

type OperationSchemas = {
  requestSchema?: unknown;
  paramsSchema?: unknown;
  querySchema?: unknown;
  headersSchema?: unknown;
  bodySchema?: unknown;
  responseSchema?: unknown;
  successStatus?: number;
  successDescription?: string;
  errorResponses?: RouteConfig["responses"];
};

export type OpenApiOperation = {
  agentDocs: boolean;
  method: Lowercase<RouteMethod>;
  path: string;
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  request: RouteConfig["request"] | undefined;
  responses: RouteConfig["responses"];
};

type RequestConfig = NonNullable<RouteConfig["request"]>;
type OpenApiSchema = NonNullable<
  NonNullable<NonNullable<RequestConfig["body"]>["content"]["application/json"]>["schema"]
>;

function getTagText(tag: ts.JSDocTag): string {
  const text = tag.comment;

  if (typeof text === "string") return text.trim();
  if (Array.isArray(text)) return text.map((part) => part.text).join("").trim();
  return "";
}

function getRouteMethodDeclaration(
  sourceFile: ts.SourceFile,
  methodName: RouteMethod,
) {
  let match: ts.FunctionDeclaration | undefined;

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name?.text === methodName &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      match = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return match;
}

function getExportedRouteMethods(sourceFile: ts.SourceFile): RouteMethod[] {
  const methods: RouteMethod[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(node.name.text) &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      methods.push(node.name.text as RouteMethod);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return methods;
}

function readRouteCommentMetadata(
  routeFilePath: string,
  methodName: RouteMethod,
): RouteCommentMetadata {
  // Parse handler JSDoc directly from the route file so docs metadata stays
  // adjacent to the implementation instead of being duplicated in schema.ts.
  const sourceFile = ts.createSourceFile(
    routeFilePath,
    readFileSync(routeFilePath, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const declaration = getRouteMethodDeclaration(sourceFile, methodName);
  if (!declaration) {
    throw new Error(`Could not find exported ${methodName} handler in ${routeFilePath}`);
  }

  const tags = ts.getJSDocTags(declaration);
  const getValue = (name: string) => {
    const tag = tags.find((item) => item.tagName.text === name);
    return tag ? getTagText(tag) : "";
  };

  const pathValue = getValue("path");
  const operationId = getValue("operationId");
  const summary = getValue("summary");
  const description = getValue("description");

  if (!pathValue || !operationId || !summary || !description) {
    throw new Error(
      `Missing required OpenAPI JSDoc tags on ${methodName} in ${routeFilePath}`,
    );
  }

  const methodValue = getValue("method").toLowerCase();
  const agentDocsValue = getValue("agentDocs");
  const tagValues = tags
    .filter((item) => item.tagName.text === "tag")
    .map(getTagText)
    .filter(Boolean);

  return {
    agentDocs: agentDocsValue === "true",
    method: (methodValue || methodName.toLowerCase()) as Lowercase<RouteMethod>,
    path: pathValue,
    operationId,
    summary,
    description,
    tags: tagValues,
  };
}

function findRouteDirectories(dirPath: string): string[] {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const routeDirectories: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (existsSync(path.join(fullPath, "route.ts"))) {
      routeDirectories.push(fullPath);
    }

    routeDirectories.push(...findRouteDirectories(fullPath));
  }

  return routeDirectories;
}

function getOperationPrefix(operationId: string) {
  return `${operationId[0].toUpperCase()}${operationId.slice(1)}`;
}

function getOperationSchemas(
  schemaModule: Record<string, unknown>,
  operationId: string,
): OperationSchemas {
  const prefix = getOperationPrefix(operationId);

  // Match exported schemas by operationId-derived naming convention.
  // Example: `@operationId listAgents` -> `ListAgentsRequestSchema`.
  return {
    requestSchema: schemaModule[`${prefix}RequestSchema`],
    paramsSchema: schemaModule[`${prefix}ParamsSchema`],
    querySchema: schemaModule[`${prefix}QuerySchema`],
    headersSchema: schemaModule[`${prefix}HeadersSchema`],
    bodySchema: schemaModule[`${prefix}BodySchema`],
    responseSchema: schemaModule[`${prefix}ResponseSchema`],
    successStatus: schemaModule[`${prefix}SuccessStatus`] as number | undefined,
    successDescription: schemaModule[`${prefix}SuccessDescription`] as string | undefined,
    errorResponses: schemaModule[`${prefix}ErrorResponses`] as RouteConfig["responses"] | undefined,
  };
}

function buildRequest(schemas: OperationSchemas): RouteConfig["request"] | undefined {
  const request: RequestConfig = {};

  if (schemas.requestSchema) request.query = schemas.requestSchema as RequestConfig["query"];
  if (schemas.querySchema) request.query = schemas.querySchema as RequestConfig["query"];
  if (schemas.paramsSchema) request.params = schemas.paramsSchema as RequestConfig["params"];
  if (schemas.headersSchema) request.headers = schemas.headersSchema as RequestConfig["headers"];
  if (schemas.bodySchema) {
    request.body = {
      description: "Request body.",
      content: {
        "application/json": {
          schema: schemas.bodySchema as OpenApiSchema,
        },
      },
    } as RequestConfig["body"];
  }

  return Object.keys(request).length > 0 ? request : undefined;
}

function buildResponses(schemas: OperationSchemas): RouteConfig["responses"] {
  if (!schemas.responseSchema) {
    throw new Error("Missing response schema for OpenAPI operation");
  }

  return {
    [schemas.successStatus ?? 200]: {
      description: schemas.successDescription ?? "Successful response.",
      content: {
        "application/json": {
          schema: schemas.responseSchema as OpenApiSchema,
        },
      },
    } as RouteConfig["responses"][number],
    ...(schemas.errorResponses ?? {}),
  };
}

async function registerRouteDirectory(
  routeDirectory: string,
): Promise<OpenApiOperation[]> {
  const routeFilePath = path.join(routeDirectory, "route.ts");
  const schemaFilePath = path.join(routeDirectory, "schema.ts");

  if (!existsSync(schemaFilePath)) return [];

  const sourceFile = ts.createSourceFile(
    routeFilePath,
    readFileSync(routeFilePath, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  const schemaModule = (await import(schemaFilePath)) as Record<string, unknown>;
  const exportedMethods = getExportedRouteMethods(sourceFile);
  const operations: OpenApiOperation[] = [];

  for (const methodName of exportedMethods) {
    const metadata = readRouteCommentMetadata(routeFilePath, methodName);
    const schemas = getOperationSchemas(schemaModule, metadata.operationId);

    operations.push({
      agentDocs: metadata.agentDocs,
      method: metadata.method,
      path: metadata.path,
      operationId: metadata.operationId,
      summary: metadata.summary,
      description: metadata.description,
      tags: metadata.tags,
      request: buildRequest(schemas),
      responses: buildResponses(schemas),
    });
  }

  return operations;
}

function registerOperations(
  registry: OpenAPIRegistry,
  operations: OpenApiOperation[],
) {
  for (const operation of operations) {
    // Runtime route handlers remain untouched. This only assembles an OpenAPI
    // document from the colocated route comments and schema exports.
    registry.registerPath({
      method: operation.method,
      path: operation.path,
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      tags: operation.tags,
      "x-agent-docs": operation.agentDocs,
      request: operation.request,
      responses: operation.responses,
    });
  }
}

export function buildOpenApiDocument(operations: OpenApiOperation[]) {
  const registry = new OpenAPIRegistry();

  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    description:
      "API key passed as a Bearer token. Obtain one via `moltcorp agents new`.",
  });

  registerOperations(registry, operations);

  const routeDefinitions = registry.definitions.filter(
    (definition): definition is Extract<typeof definition, { type: "route" }> =>
      definition.type === "route",
  );

  const usedTags = Array.from(
    new Set(routeDefinitions.flatMap((definition) => definition.route.tags ?? [])),
  )
    .filter((tag): tag is OpenApiTagName => tag in tagDescriptions)
    .map((tag) => ({
      name: tag,
      description: tagDescriptions[tag],
    }));

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Moltcorp API",
      version: "1.0.0",
      description: "The public Moltcorp platform API.",
    },
    servers: [{ url: "https://moltcorporation.com", description: "Production" }],
    security: [{ bearerAuth: [] }],
    tags: usedTags,
  });
}

export async function loadOpenApiOperations() {
  const apiRoot = path.join(process.cwd(), "app", "api", "v1");

  // Next.js route handlers already live under app/api/v1, so the generator
  // discovers route folders instead of keeping a manual registry file.
  const routeDirectories = findRouteDirectories(apiRoot)
    .filter((dirPath) => statSync(dirPath).isDirectory())
    .sort();

  const operations: OpenApiOperation[] = [];

  for (const routeDirectory of routeDirectories) {
    operations.push(...(await registerRouteDirectory(routeDirectory)));
  }

  return operations;
}

export async function generateOpenApiDocument() {
  return buildOpenApiDocument(await loadOpenApiOperations());
}

export async function generateAgentOpenApiDocument() {
  return buildOpenApiDocument(
    (await loadOpenApiOperations()).filter((operation) => operation.agentDocs),
  );
}
