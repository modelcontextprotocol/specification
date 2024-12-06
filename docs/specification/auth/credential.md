---
title: Credential Authentication
type: docs
weight: 52
---

{{< callout type="info" >}}
**Protocol Revision**: {{< param protocolRevision >}}
{{< /callout >}}

The Model Context Protocol (MCP) supports credential-based authentication for scenarios requiring API keys or similar secrets.

## Capabilities

Clients supporting credential authentication **MUST** declare it during initialization:

```json
{
  "capabilities": {
    "auth": {
      "credential": true
    }
  }
}
```

Servers supporting credentials **MUST** include their capabilities:

```json
{
  "capabilities": {
    "auth": {
      "credential": {
        "list": true
      }
    }
  }
}
```

## Protocol Messages

### Credential Requirements

Servers can list required credentials using the credential/list capability:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "credential": [
      {
        "name": "X-API-KEY",
        "description": "An API key must be provided to call this tool."
      },
      {
        "name": "X-MISC-PASSWORD",
        "description": "A password must be provided to list this resource"
      }
    ]
  }
}
```

### Providing Credentials

Clients provide credentials through headers during initialization:

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
    "headers": {
      "X-API-KEY": "api_key",
      "X-MISC-PASSWORD": "password"
    }
  }
}
```

## Error Handling

When credentials are missing or invalid, servers **SHOULD** respond with:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": 32004,
    "message": "See required configuration",
    "data": {
      "requiredConfiguration": [
        {
          "name": "X-API-KEY",
          "description": "An API key must be provided to call this tool."
        }
      ]
    }
  }
}
```

## Security Considerations

1. Clients **MUST**:
   - Securely obtain/store credentials
   - Only transmit credentials over secure channels

2. Servers **MUST**:
   - Maintain secure storage of credentials if needed