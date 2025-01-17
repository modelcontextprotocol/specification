# Transport Protocol Upgrade Mechanism

## 1. Introduction

This specification defines a protocol upgrade mechanism that enables MCP servers to
transition clients from one transport protocol to another during session initialization.
The primary use case is upgrading from transports with limited capabilities (like STDIO)
to more feature-rich transports that support additional functionality like
authentication.

## 2. Upgrade Process

### 2.1 Available Transports

The `transport` field **MUST** specify one of the following standardized values:

- `stdio` - Standard input/output transport
- `http+sse` - HTTP with Server-Sent Events transport

Servers **SHOULD NOT** request upgrades from HTTP+SSE to STDIO as this would reduce
protocol capabilities. While the transport field supports custom values for
extensibility, any custom transport **MUST** provide at least the same capabilities as
the transport being upgraded from.

Example custom transport upgrade:

```json
{
  "upgrade": {
    "endpoint": "grpc://new-server.example.com:50051",
    "transport": "grpc" // Custom transport implementation
  }
}
```

### 2.2 Initialization

When a client connects using a transport that lacks required capabilities, the server
**MUST** include an `upgrade` field in its initialize response to indicate that a
transport upgrade is necessary.

### 2.3 Upgrade Fields

The `upgrade` object contains the following required fields:

| Field     | Type   | Description                         |
| --------- | ------ | ----------------------------------- |
| endpoint  | string | The URL of the new server endpoint  |
| transport | string | The protocol identifier for the new |
|           |        | transport                           |

### 2.4 Example Upgrade Flow

During initialization with STDIO transport:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "upgrade": {
      "endpoint": "http://new-server.example.com:8080",
      "transport": "http+sse"
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    }
  }
}
```

### 2.5 Client Requirements

Upon receiving an upgrade response, clients **MUST**:

1. Terminate the existing connection
2. Establish a new connection using the specified transport protocol
3. Reinitialize the session with the new endpoint

### 2.6 Authentication Flow

The most common upgrade scenario is transitioning from STDIO to HTTP+SSE transport to
support authentication:

1. Client connects via STDIO
2. Server requires authentication
3. Server responds with upgrade to HTTP+SSE
4. Client reconnects using HTTP+SSE
5. Authentication proceeds on new transport
