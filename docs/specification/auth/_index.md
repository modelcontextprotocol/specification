---
title: Authentication
type: docs 
weight: 50
---

{{< callout type="info" >}}
**Experimental Section!**
{{< /callout >}}

The Model Context Protocol (MCP) provides a standardized way for clients and servers to establish secure communication channels. The authentication framework supports multiple authentication methods to accommodate different security requirements and use cases.

## User Interaction Model

Authentication in MCP is designed to be flexible and secure, supporting various authentication flows that may require different levels of user interaction:

- OAuth 2.0 for standardized authorization flows
- Credential-based authentication for API keys and similar secrets

## Capabilities

Clients that support authentication **MUST** declare their supported authentication methods during [initialization]({{< ref "/specification/basic/lifecycle#initialization" >}}):

```json
{
  "capabilities": {
    "auth": {
      "oauth2": true,
      "credential": true,
    }
  }
}
```

The `auth` capability can include any combination of the following authentication methods:

- `oauth2`: Indicates support for [OAuth 2.0]({{< ref "/specification/auth/oauth2" >}}) authentication flows
- `credential`: Indicates support for [credential-based]({{< ref "/specification/auth/credential" >}}) authentication

## Server Response

Servers that support authentication **MUST** include their supported authentication methods in their initialization response:

```json
{
  "capabilities": {
    "auth": {
      "oauth2": {
        "token": true,
        "revoke": true
      },
      "credential": {
        "list": true
      },
    }
  }
}
```

## Security Considerations

1. Clients **MUST**:
   - Store and manage authentication tokens and credentials securely
   - Implement proper token refresh and revocation flows where applicable
   - Validate server authenticity before sending credentials
   - Monitor authentication state and handle expiration

2. Servers **MUST**:
   - Implement proper security measures for storing and managing secrets
   - Provide clear error messages for authentication failures

## Implementation Guidelines

1. Clients **SHOULD**:
   - Prompt users for consent before initiating authentication flows
   - Provide clear user interfaces for authentication management
   - Handle authentication errors gracefully

2. Servers **SHOULD**:
   - Provide clear documentation for authentication requirements
   - Implement proper logging and monitoring