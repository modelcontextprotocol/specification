# HTTP-based Model Context Protocol

This document provides comprehensive documentation for the HTTP-based implementation of
the Model Context Protocol (MCP). This implementation leverages standard HTTP methods and
conventions rather than using a custom JSON-RPC envelope.

## Overview

The HTTP-based MCP implementation offers a simplified approach to the Model Context
Protocol that is more familiar to developers accustomed to RESTful APIs. It maintains the
core functionality of the original JSON-RPC implementation while reducing complexity and
improving integration with existing HTTP-based systems.

## Authentication

All requests (except for the initial session creation) require authentication using a
Bearer token:

```
Authorization: Bearer <token>
```

This token is obtained during session initialization.

## Endpoints

### Session Management

#### Initialize Session

Creates a new MCP session and returns authentication token and resource URLs.

**Request:**

```
POST /mcp
```

**Response:**

```
200 OK
{
  "token": "bearer-token-value",
  "resources": "https://example.com/mcp/resources",
  "prompts": "https://example.com/mcp/prompts",
  "tools": "https://example.com/mcp/tools",
  "capabilities": {
    "resources": {
      "listChanged": true,
      "subscribe": true
    },
    "prompts": {
      "listChanged": true
    },
    "tools": {
      "listChanged": true
    },
    "completions": {}
  },
  "protocolVersion": "2025-03-26",
  "serverInfo": {
    "name": "ExampleMCPServer",
    "version": "1.0.0"
  },
  "instructions": "This server provides access to document resources and weather tools."
}
```

#### Terminate Session

Ends the current MCP session.

**Request:**

```
DELETE /mcp
Authorization: Bearer <token>
```

**Response:**

```
204 No Content
```

### Resources

#### List Resources

Retrieves a list of available resources.

**Request:**

```
GET /mcp/resources
Authorization: Bearer <token>
```

Optional query parameters:

- `cursor`: Pagination token for fetching next page of results

**Response:**

```
200 OK
{
  "resources": [
    {
      "uri": "https://example.com/mcp/resources/document1",
      "name": "Document 1",
      "description": "Example document",
      "mimeType": "text/plain"
    }
  ],
  "nextCursor": "cursor-token-for-pagination"
}
```

#### Get Resource

Retrieves the content of a specific resource.

**Request:**

```
GET <resource-uri>
Authorization: Bearer <token>
```

**Response:**

```
200 OK
Content-Type: <mime-type>

[resource content]
```

#### Subscribe to Resource Updates

Subscribes to notifications when a resource is updated.

**Request:**

```
POST /mcp/resources/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "uri": "<resource-uri>"
}
```

**Response:**

```
201 Created
```

#### Unsubscribe from Resource Updates

Cancels a subscription to resource updates.

**Request:**

```
DELETE /mcp/resources/subscriptions/<resource-id>
Authorization: Bearer <token>
```

**Response:**

```
204 No Content
```

### Prompts

#### List Prompts

Retrieves a list of available prompts.

**Request:**

```
GET /mcp/prompts
Authorization: Bearer <token>
```

Optional query parameters:

- `cursor`: Pagination token for fetching next page of results

**Response:**

```
200 OK
{
  "prompts": [
    {
      "name": "greeting",
      "description": "A friendly greeting prompt",
      "arguments": [
        {
          "name": "name",
          "description": "The name of the person to greet",
          "required": true
        }
      ]
    }
  ],
  "nextCursor": "cursor-token-for-pagination"
}
```

#### Get Prompt

Retrieves a specific prompt, with optional argument substitution.

**Request:**

```
GET /mcp/prompts/<prompt-name>
Authorization: Bearer <token>
```

Query parameters:

- Any prompt arguments as key-value pairs

**Response:**

```
200 OK
{
  "description": "A friendly greeting prompt",
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Hello, John! Welcome to our service."
      }
    }
  ]
}
```

### Tools

#### List Tools

Retrieves the OpenAPI specification describing available tools.

**Request:**

```
GET /.well-known/openapi.json
Authorization: Bearer <token>
```

**Response:**

```
200 OK
{
  "openapi": "3.0.0",
  "info": {
    "title": "MCP Tools",
    "version": "1.0.0"
  },
  "paths": {
    "/tools/get_weather": {
      "post": {
        "summary": "Get current weather information for a location",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "location": {
                    "type": "string",
                    "description": "City name or zip code"
                  }
                },
                "required": ["location"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Weather information"
          }
        }
      }
    }
  }
}
```

#### Call Tool

Invokes a specific tool with the provided arguments.

**Request:**

```
POST /tools/<tool-name>
Authorization: Bearer <token>
Content-Type: application/json

{
  [tool arguments]
}
```

**Response (JSON):**

```
200 OK
Content-Type: application/json

{
  [tool result]
}
```

**Response (non-JSON):**

```
200 OK
Content-Type: <mime-type>

[binary data]
```

### Completions

#### Get Completion Suggestions

Retrieves completion suggestions for prompt arguments.

**Request:**

```
GET /mcp/completions
Authorization: Bearer <token>
```

Query parameters:

- `ref`: Reference to prompt or resource (e.g., "prompt/greeting")
- `argument`: Name of the argument to complete
- `value`: Current partial value to get completions for

**Response:**

```
200 OK
{
  "completion": {
    "values": ["John", "Jane", "James", "Jennifer"],
    "hasMore": false,
    "total": 4
  }
}
```

### Real-time Notifications

WebSocket connections can be established for real-time notifications:

**Connection:**

```
WebSocket wss://example.com/mcp/notifications
Authorization: Bearer <token>
```

**Notification Types:**

1. **Resource Updated:**

```json
{
  "type": "resource_updated",
  "uri": "https://example.com/mcp/resources/document1"
}
```

2. **Resource List Changed:**

```json
{
  "type": "resource_list_changed"
}
```

3. **Prompt List Changed:**

```json
{
  "type": "prompt_list_changed"
}
```

4. **Tool List Changed:**

```json
{
  "type": "tool_list_changed"
}
```

5. **Progress Update:**

```json
{
  "type": "progress",
  "requestId": "request-123",
  "progress": 50,
  "total": 100,
  "message": "Processing halfway complete"
}
```

## Error Handling

The HTTP implementation uses standard HTTP status codes for error reporting:

- **400 Bad Request**: Invalid parameters or request format
- **401 Unauthorized**: Authentication failure
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource, prompt, or tool not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

Example error response:

```
400 Bad Request
Content-Type: application/json

{
  "error": "Invalid parameter",
  "message": "The 'location' parameter is required",
  "code": "INVALID_PARAMETER"
}
```

## Advanced Features

### Logging

#### Set Logging Level

Sets the minimum logging level for messages sent from the server.

**Request:**

```
POST /mcp/logging/level
Authorization: Bearer <token>
Content-Type: application/json

{
  "level": "info"
}
```

Valid levels: "emergency", "alert", "critical", "error", "warning", "notice", "info",
"debug"

**Response:**

```
204 No Content
```

#### Receive Log Messages

Log messages are sent as server-sent events:

**Connection:**

```
GET /mcp/logging/events
Authorization: Bearer <token>
```

**Event:**

```
event: log
data: {"level":"info","message":"Processing started","logger":"weather-service"}
```

### Roots Management

#### List Roots

Retrieves a list of root URIs from the client.

**Request:**

```
GET /mcp/roots
Authorization: Bearer <token>
```

**Response:**

```
200 OK
{
  "roots": [
    {
      "uri": "file:///home/user/documents",
      "name": "Documents"
    },
    {
      "uri": "file:///home/user/projects",
      "name": "Projects"
    }
  ]
}
```

#### Notify Roots Changed

Notifies the server that the list of roots has changed.

**Request:**

```
POST /mcp/roots/notify
Authorization: Bearer <token>
```

**Response:**

```
204 No Content
```

### Sampling/LLM Interaction

#### Create Message

Requests the client to sample from an LLM.

**Request:**

```
POST /mcp/sampling/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "What is the capital of France?"
      }
    }
  ],
  "maxTokens": 100,
  "temperature": 0.7,
  "stopSequences": ["\n\n"],
  "modelPreferences": {
    "intelligencePriority": 0.8,
    "speedPriority": 0.5,
    "costPriority": 0.3,
    "hints": [
      {
        "name": "claude-3-5-sonnet"
      }
    ]
  },
  "includeContext": "thisServer"
}
```

**Response:**

```
200 OK
{
  "content": {
    "type": "text",
    "text": "The capital of France is Paris."
  },
  "model": "claude-3-5-sonnet-20241022",
  "role": "assistant",
  "stopReason": "stop_sequence"
}
```

## Implementation Notes

- All non-JSON responses should include appropriate Content-Type headers
- Error responses should use standard HTTP status codes with descriptive messages
- Pagination can be handled through standard query parameters or Link headers
- WebSockets are used for real-time notifications
- Binary data is handled through standard HTTP content types and base64 encoding when
  needed
- CORS headers should be included for browser-based clients
- Rate limiting can be implemented using standard HTTP headers (Retry-After,
  X-RateLimit-\*)
- Requests that may take a long time should support progress tracking via WebSocket
  notifications
