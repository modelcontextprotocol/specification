---
title: "Building an STDIO to Streamable HTTP Adapter"
description: "Learn how to build an adapter that bridges STDIO-based MCP servers to Streamable HTTP transport"
---

In this tutorial, we'll build an adapter that allows STDIO-based MCP servers to be accessed via Streamable HTTP transport. This transport uses HTTP POST for client-to-server communication and can respond with either JSON or Server-Sent Events (SSE) for streaming. This is useful when you want to expose local MCP servers to web applications or remote clients.

### What we'll be building

Many MCP servers use STDIO (standard input/output) for communication, which works great for local CLI tools but isn't accessible from web browsers or remote clients. We'll build an adapter that:

1. Accepts HTTP requests from clients
2. Spawns STDIO-based MCP servers as subprocesses
3. Translates between HTTP/SSE and STDIO transports
4. Manages multiple client sessions

### Core Concepts

Before we dive in, let's understand the key components:

1. **STDIO Transport**: Uses standard input/output streams for communication
2. **Streamable HTTP Transport**: Uses HTTP POST for requests and can respond with either JSON or Server-Sent Events (SSE) for streaming
3. **Transport Proxy**: Bridges messages between different transport types
4. **Session Management**: Handles multiple concurrent client connections

### Prerequisites

This tutorial assumes familiarity with:
- TypeScript/Node.js
- Express.js
- MCP protocol basics
- HTTP and Server-Sent Events

### System Requirements

- Node.js 16 or higher
- npm or yarn
- An existing STDIO-based MCP server to test with

## Setting Up the Project

First, let's create a new Node.js project and install dependencies:

```bash
# Create project directory
mkdir mcp-stdio-adapter
cd mcp-stdio-adapter

# Initialize npm project
npm init -y

# Install dependencies
npm install express @modelcontextprotocol/sdk
npm install -D typescript @types/node @types/express tsx

# Create TypeScript config
npx tsc --init

# Create source directory
mkdir src
touch src/adapter.ts
```

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

## Building the Adapter

### Setting Up Imports and Types

Let's start by importing the necessary modules and defining our types:

```typescript
#!/usr/bin/env tsx
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { 
  CancelledNotification, 
  CancelledNotificationSchema, 
  isJSONRPCError, 
  isJSONRPCResponse,
  isInitializeRequest 
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
```

### Creating the Transport Proxy

The transport proxy is the heart of our adapter. It forwards messages between the Streamable HTTP transport (server-side) and STDIO transport (client-side):

```typescript
const isCancelledNotification = (value: unknown): value is CancelledNotification =>
    CancelledNotificationSchema.safeParse(value).success;

export function proxyTransports(clientTransport: Transport, serverTransport: Transport) {
    let closed = false;
    
    // Propagate close events between transports
    const propagateClose = (source: Transport, target: Transport) => {
        source.onclose = () => {
            if (!closed) {
                closed = true;
                target.close();
            }
        };
    };
    propagateClose(serverTransport, clientTransport);
    propagateClose(clientTransport, serverTransport);

    // Propagate messages between transports
    const propagateMessage = (source: Transport, target: Transport) => {
        source.onmessage = (message, extra) => {
            // Handle cancelled notifications specially
            const relatedRequestId = isCancelledNotification(message) 
                ? message.params.requestId 
                : undefined;
            target.send(message, {relatedRequestId});
        };
    };
    propagateMessage(serverTransport, clientTransport);
    propagateMessage(clientTransport, serverTransport);

    // Start both transports
    serverTransport.start();
    clientTransport.start();
}
```

### Setting Up Express Server

Now let's create the Express server with session management:

```typescript
const PORT = Number(process.env.PORT ?? '3000');

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
```

### Handling HTTP POST Requests

The main endpoint handles initialization and subsequent requests. Based on the Streamable HTTP specification, the server can respond with either a single JSON response or an SSE stream:

```typescript
const mcpPostHandler = async (req: Request, res: Response) => {
  console.log('Received MCP request:', req.body);
  
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for established session
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new session for initialization request
      const eventStore = new InMemoryEventStore();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore, // Enable resumability
        onsessioninitialized: (sessionId) => {
          console.log(`Session initialized with ID: ${sessionId}`);
          transports[sessionId] = transport;
        }
      });

      // Clean up when transport closes
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}`);
          delete transports[sid];
        }
      };
      
      // Parse command line arguments (skip '--' if present)
      const args = process.argv.slice(2);
      if (args[0] === '--') {
        args.splice(0, 1);
      }
      
      // Create STDIO transport to the actual MCP server
      const clientTransport = new StdioClientTransport({
        command: args[0],
        args: args.slice(1),
        env: process.env,
      });

      // Connect the transports
      proxyTransports(clientTransport, transport);

      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      // Invalid request - no session ID or not initialization
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
};

app.post('/mcp', mcpPostHandler);
```

### Handling SSE Streams

For Server-Sent Events, we need a GET endpoint:

```typescript
const mcpGetHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  // Support resumability with Last-Event-ID
  const lastEventId = req.headers['last-event-id'] as string | undefined;
  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', mcpGetHandler);
```

### Handling Session Termination

The DELETE endpoint allows clients to cleanly terminate sessions:

```typescript
const mcpDeleteHandler = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
};

app.delete('/mcp', mcpDeleteHandler);
```

### Starting the Server

Finally, let's start the server and handle graceful shutdown:

```typescript
app.listen(PORT, () => {
  console.log(`MCP STDIO to Streamable HTTP Adapter listening on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');

  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  
  console.log('Server shutdown complete');
  process.exit(0);
});
```

## Running the Adapter

To use the adapter, you need to specify which STDIO server to wrap:

```bash
# Make the script executable
chmod +x src/adapter.ts

# Run with a Python MCP server
./src/adapter.ts -- python path/to/mcp-server.py

# Run with a Node.js MCP server
./src/adapter.ts -- node path/to/mcp-server.js

# Run on a different port
PORT=8080 ./src/adapter.ts -- python path/to/mcp-server.py
```

## Testing the Adapter

You can test the adapter using curl:

```bash
# Initialize a session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# The response will include a session ID in headers
# Use it for subsequent requests:

# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list"
  }'
```

## Key Features Explained

### 1. **Streamable HTTP Transport**

The Streamable HTTP transport provides flexible communication patterns:

- **Client-to-Server**: All messages are sent as HTTP POST requests with JSON bodies
- **Server-to-Client**: Responses can be either:
  - Single JSON responses (`Content-Type: application/json`) for simple request/response patterns
  - SSE streams (`Content-Type: text/event-stream`) for multiple messages or server-initiated communication
- **Session Support**: Maintains stateful connections across multiple HTTP requests
- **Resumability**: Supports reconnection and message replay using SSE event IDs

### 2. **Transport Bridging**

The `proxyTransports` function creates a bidirectional bridge between two different transport types. It:
- Forwards all messages between transports
- Propagates close events to ensure clean shutdown
- Handles special cases like cancelled notifications

### 3. **Session Management**

Each client connection gets a unique session ID that:
- Identifies which STDIO subprocess to route messages to
- Enables connection resumption if the client disconnects
- Allows multiple clients to use different MCP servers simultaneously

### 4. **Error Handling**

The adapter includes comprehensive error handling:
- Validates requests before processing
- Returns appropriate HTTP status codes
- Cleans up resources on errors

### 5. **Resumability**

Using `InMemoryEventStore`, the adapter supports:
- Client reconnection after network issues
- Event replay using Last-Event-ID
- Stateful session management

## Common Use Cases

1. **Web Application Integration**
   - Expose local MCP servers to web frontends
   - Build browser-based MCP clients
   - Create web dashboards for MCP tools

2. **Remote Access**
   - Access MCP servers over the network
   - Deploy MCP servers in cloud environments
   - Build distributed MCP systems

3. **Protocol Translation**
   - Bridge between STDIO and Streamable HTTP transports
   - Add HTTP authentication to STDIO servers
   - Implement custom routing logic

## Best Practices

1. **Security**
   - Add authentication middleware for production use
   - Validate and sanitize all inputs
   - Use HTTPS in production environments
   - Implement rate limiting

2. **Resource Management**
   - Set limits on concurrent sessions
   - Implement session timeouts
   - Monitor subprocess resource usage
   - Clean up zombie processes

3. **Error Handling**
   - Log all errors for debugging
   - Return meaningful error messages
   - Implement retry logic for transient failures
   - Monitor adapter health

## Troubleshooting

### Common Issues

1. **STDIO Server Not Starting**
   - Check the command path is correct
   - Verify the server has execute permissions
   - Ensure all dependencies are installed
   - Check server logs for errors

2. **Session Management Issues**
   - Verify session IDs are being passed correctly
   - Check for session timeout issues
   - Monitor memory usage for session leaks
   - Ensure proper cleanup on disconnect

3. **Message Routing Problems**
   - Enable debug logging for message flow
   - Verify transport proxy is working
   - Check for message format issues
   - Monitor for dropped messages

## Next Steps

Now that you have a working STDIO to Streamable HTTP adapter, you can:

- Add authentication and authorization
- Implement connection pooling for better performance
- Add WebSocket support for full-duplex communication
- Build a web UI for managing MCP sessions
- Deploy the adapter as a microservice

This adapter pattern can be extended to bridge between any MCP transport types, making it a powerful tool for building flexible MCP architectures.