# Model Context Protocol Schemas

This directory contains the schema definitions for the Model Context Protocol (MCP).

## Versions

### 2024-11-05

Initial version of the MCP schema using JSON-RPC.

### 2025-03-26

Contains two implementations:

- JSON-RPC based implementation (schema.ts, schema.json)
- HTTP-based implementation (http-schema.ts, http-schema.json)

## HTTP-based Implementation

The HTTP-based implementation simplifies the protocol by:

1. Using standard HTTP methods (GET, POST, PUT, DELETE) for operations
2. Leveraging existing standards like OpenAPI for tool definitions
3. Using standard HTTP authentication mechanisms
4. Minimizing protocol complexity by eliminating unnecessary wrappers

For more details, see the [HTTP Protocol documentation](../docs/http-protocol.md).

## Schema Files

Each version directory contains:

- `schema.ts`: TypeScript definitions for the JSON-RPC based protocol
- `schema.json`: JSON Schema generated from the TypeScript definitions
- `http-schema.ts`: TypeScript definitions for the HTTP-based protocol (2025-03-26 only)
- `http-schema.json`: JSON Schema for the HTTP-based protocol (2025-03-26 only)

## Usage

The schema files can be used to:

1. Validate protocol messages
2. Generate client and server code
3. Document the protocol
4. Provide type safety in TypeScript applications
