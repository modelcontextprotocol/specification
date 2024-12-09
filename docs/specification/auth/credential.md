---
title: Credential Authentication
type: docs
weight: 52
---

{{< callout type="warning" >}}
Auth is **experimental**, and being drafted for release in the next [revision]({{< ref "/specification/revisions" >}}) of the protocol.

The additions to the base protocol are backwards compatible to revision 2024-11-05; however, **the auth specification may change in backwards incompatible ways** until the next protocol revision.
{{< /callout >}}

The Model Context Protocol (MCP) supports credential-based authentication for scenarios requiring API keys or similar secrets.

## Capabilities

Clients supporting credential authentication **MUST** declare it during initialization:

```json
{
  "capabilities": {
    "auth": {
      "credentials": true
    }
  }
}
```

Servers supporting credentials **MUST** include their capabilities:

```json
{
  "capabilities": {
    "auth": {
      "credentials": {
        "list": true
      }
    }
  }
}
```

## Protocol Messages

### Credential Requirements
Clients can list required credentials with an `auth/credentials/list` capability.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "auth/credentials/list",
}
```
**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "credentials": [
      {
        "name": "API-KEY",
        "description": "An API key must be provided to call this tool."
      },
      {
        "name": "MISC-PASSWORD",
        "description": "A password must be provided to list this resource"
      }
    ]
  }
}
```
- Clients and servers **MUST** treat credential names as case-insensitive.

### Providing Credentials

Clients **MUST** provide credentials through headers during initialization:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "capabilities": {
      "auth": {
        "credential": true
      }
    },
    "auth": {
      "credentials": {
        "API-KEY": "api_key",
        "MISC-PASSWORD": "password"
      }
    }
  }
}
```

## Error Handling

When credentials are missing or invalid, servers **MUST** respond with at least an error code.

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Auth error, please see nested data.",
    "data": {
      "authRequest": {
        "credentials": {
          "error": "ASCII error code", // REQUIRED
          "errors": { // RECOMMENDED
            // Breakdown of error per-credential
          }
          
        }
      }
    }
  }
}
```
- Servers **SHOULD** include helpful error messages
- Servers **SHOULD** include per-credential breakdowns of errors
- Clients **SHOULD** surface errors in a human-readable way to the end user.

## Security Considerations

1. Clients **MUST**:
   - Securely obtain/store credentials
   - Only transmit credentials over secure channels

2. Servers **MUST**:
   - Maintain secure storage of credentials if needed
   - Treat credential names as case-insensitive (like HTTP headers)