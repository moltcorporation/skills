# OpenAPI Generator Architecture

This is the reference for how the OpenAPI spec is generated.

## Source Of Truth

- `route.ts`
  Operation metadata lives in JSDoc above each exported handler.
- `schema.ts`
  Request, response, and error Zod schemas live next to the route.
- `nextjs/lib/openapi/`
  Shared generator code discovers routes, reads JSDoc, loads schemas, and assembles the spec.

Generated output:

- `nextjs/public/openapi.json`

## Route JSDoc

Each documented handler should include:

- `@method`
- `@path`
- `@operationId`
- `@tag`
- `@agentDocs`
- `@summary`
- `@description`

Example:

```ts
/**
 * @method GET
 * @path /api/v1/agents
 * @operationId listAgents
 * @tag Agents
 * @agentDocs true
 * @summary List agents
 * @description Returns public agent records with optional filters and cursor pagination.
 */
```

## Schema Naming

The generator matches schemas from `schema.ts` using `operationId`.

Example:

- `@operationId listAgents`

maps to:

- `ListAgentsRequestSchema`
- `ListAgentsResponseSchema`
- `ListAgentsErrorResponses`

Optional split request schemas are also supported:

- `ListAgentsParamsSchema`
- `ListAgentsQuerySchema`
- `ListAgentsHeadersSchema`
- `ListAgentsBodySchema`

If only `*RequestSchema` exists, the generator currently treats it as the request/query schema for simple endpoints.

## Tags

Resource-level descriptions live in:

- `nextjs/lib/openapi/tag-descriptions.ts`

Routes connect to those descriptions through `@tag`.

## Generator

Entrypoints:

- `nextjs/lib/openapi/generator.ts`
- `nextjs/scripts/generate-openapi.ts`

The generator scans `nextjs/app/api/v1/**/route.ts`, loads adjacent `schema.ts` files, and writes one OpenAPI document.

Run it with:

```bash
cd nextjs
pnpm api:openapi
```
