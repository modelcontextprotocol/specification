---
title: 基础协议
cascade:
  type: docs
weight: 20
---

{{< callout type="info" >}} **协议修订版本**: 2025-03-26 {{< /callout >}}

Model Context Protocol (MCP) 由多个关键组件共同构成：

- **基础协议**: 核心的 JSON-RPC 消息类型
- **生命周期管理**: 连接初始化、功能协商和会话控制
- **服务器功能**: 服务器暴露的资源、提示和工具
- **客户端功能**: 客户端提供的采样和根目录列表
- **实用工具**: 如日志记录和参数补全等跨领域功能

所有实现 **必须** 支持基础协议和生命周期管理组件。其他组件可以根据应用的特定需求 **选择性** 实现。

这些协议层次在客户端和服务器之间建立了明确的关注点分离，同时支持丰富的交互。模块化设计允许实现仅支持所需的功能。

## 消息

所有 MCP 客户端与服务器之间的消息 **必须** 遵循 [JSON-RPC 2.0](https://www.jsonrpc.org/specification) 规范。协议定义了以下几种消息类型：

### 请求 (Requests)

请求由客户端发送到服务器，或由服务器发送到客户端，用于启动一个操作。

```typescript
{
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: {
    [key: string]: unknown;
  };
}
```

- 请求 **必须** 包含一个字符串或整数类型的 ID。
- 与基础 JSON-RPC 不同，ID **不得** 为 `null`。
- 请求 ID **不得** 在同一会话内被请求方重复使用。

### 响应 (Responses)

响应是针对请求的回复，包含操作的结果或错误信息。

```typescript
{
  jsonrpc: "2.0";
  id: string | number;
  result?: {
    [key: string]: unknown;
  }
  error?: {
    code: number;
    message: string;
    data?: unknown;
  }
}
```

- 响应 **必须** 包含与其关联请求相同的 ID。
- **响应** 分为 **成功结果** 和 **错误** 两种情况。响应中 **必须** 设置 `result` 或 `error` 之一，但 **不得** 同时设置两者。
- 结果 (`result`) **可以** 遵循任意 JSON 对象结构，而错误 (`error`) **必须** 至少包括错误代码和错误消息。
- 错误代码 **必须** 是整数。

### 通知 (Notifications)

通知是客户端或服务器发送的单向消息，接收方 **不得** 发送响应。

```typescript
{
  jsonrpc: "2.0";
  method: string;
  params?: {
    [key: string]: unknown;
  };
}
```

- 通知 **不得** 包含 ID。

### 批处理 (Batching)

JSON-RPC 定义了一种通过数组发送多个请求和通知的方式，详见 [批处理规范](https://www.jsonrpc.org/specification#batch)。MCP 的实现 **可以** 支持发送 JSON-RPC 批处理，但 **必须** 支持接收 JSON-RPC 批处理。

## 认证 (Auth)

MCP 提供了一个适用于 HTTP 的 [授权框架]({{< ref "authorization" >}})。使用基于 HTTP 的传输实现 **应** 遵循该规范，而使用 STDIO 传输的实现 **不应** 遵循该规范，而是从环境中获取凭据。

此外，客户端和服务器 **可以** 协商自定义的身份验证和授权策略。

如果您希望进一步讨论和推动 MCP 认证机制的演化，请访问 [GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)，共同塑造协议的未来！

## Schema

协议的完整规范定义为 [TypeScript Schema](https://github.com/modelcontextprotocol/specification/blob/main/schema/2025-03-26/schema.ts)。这是所有协议消息和结构的权威来源。

同时，还有一个 [JSON Schema](https://github.com/modelcontextprotocol/specification/blob/main/schema/2025-03-26/schema.json)，它由 TypeScript 源代码自动生成，可用于各种自动化工具。