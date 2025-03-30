---
title: 授权
type: docs
weight: 15
---

{{< callout type="info" >}} **协议修订**: 2025-03-26 {{< /callout >}}

## 1. 简介

### 1.1 目的与范围

Model Context Protocol (MCP) 在传输层提供授权功能，使 MCP 客户端能够代表资源所有者向受限的 MCP 服务器发出请求。本规范定义了基于 HTTP 传输的授权流程。

### 1.2 协议要求

授权对 MCP 实现来说是 **可选的**。当支持授权时：

- 使用基于 HTTP 的传输实现 **应当 (SHOULD)** 遵循本规范。
- 使用 STDIO 传输实现 **不应当 (SHOULD NOT)** 遵循本规范，而应从环境中获取凭据。
- 使用其他传输方式的实现 **必须 (MUST)** 遵循其协议的既定安全最佳实践。

### 1.3 标准合规性

此授权机制基于以下已建立的规范，但仅实现了其中的精选功能，以确保安全性和互操作性，同时保持简单性：

- [OAuth 2.1 IETF 草案](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12)
- OAuth 2.0 授权服务器元数据
  ([RFC8414](https://datatracker.ietf.org/doc/html/rfc8414))
- OAuth 2.0 动态客户端注册协议
  ([RFC7591](https://datatracker.ietf.org/doc/html/rfc7591))

## 2. 授权流程

### 2.1 概述

1. MCP 授权实现 **必须 (MUST)** 实现 OAuth 2.1，并对机密客户端和公共客户端采取适当的安全措施。

2. MCP 授权实现 **应当 (SHOULD)** 支持 OAuth 2.0 动态客户端注册协议
   ([RFC7591](https://datatracker.ietf.org/doc/html/rfc7591))。

3. MCP 服务器 **应当 (SHOULD)**，而 MCP 客户端 **必须 (MUST)** 实现 OAuth 2.0 授权服务器元数据
   ([RFC8414](https://datatracker.ietf.org/doc/html/rfc8414))。不支持授权服务器元数据的服务器 **必须 (MUST)** 遵循默认 URI 方案。

### 2.2 基础 OAuth 2.1 授权

当客户端未证明授权时，服务器 **必须 (MUST)** 响应 _HTTP 401 Unauthorized_。

客户端在接收到 _HTTP 401 Unauthorized_ 响应后，启动
[OAuth 2.1 IETF 草案](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12)
的授权流程。

以下展示了使用 PKCE 的公共客户端的基本 OAuth 2.1 授权流程：

```mermaid
sequenceDiagram
    participant B as 用户代理 (浏览器)
    participant C as 客户端
    participant M as MCP 服务器

    C->>M: MCP 请求
    M->>C: HTTP 401 Unauthorized
    Note over C: 生成 code_verifier 和 code_challenge
    C->>B: 打开带有授权 URL 和 code_challenge 的浏览器
    B->>M: GET /authorize
    Note over M: 用户登录并授权
    M->>B: 重定向到带有授权码的回调 URL
    B->>C: 带有授权码的回调
    C->>M: 使用 code 和 code_verifier 发出令牌请求
    M->>C: 访问令牌 (+ 刷新令牌)
    C->>M: 带访问令牌的 MCP 请求
    Note over C,M: 开始标准 MCP 消息交换
```

### 2.3 服务器元数据发现

对于服务器功能发现：

- MCP 客户端 **必须 (MUST)** 遵循 [RFC8414](https://datatracker.ietf.org/doc/html/rfc8414) 定义的 OAuth 2.0 授权服务器元数据协议。
- MCP 服务器 **应当 (SHOULD)** 遵循 OAuth 2.0 授权服务器元数据协议。
- 不支持 OAuth 2.0 授权服务器元数据协议的 MCP 服务器 **必须 (MUST)** 支持回退 URL。

发现流程如下所示：

```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as 服务器

    C->>S: GET /.well-known/oauth-authorization-server
    alt 发现成功
        S->>C: 200 OK + 元数据文档
        Note over C: 使用元数据中的端点
    else 发现失败
        S->>C: 404 Not Found
        Note over C: 回退到默认端点
    end
    Note over C: 继续授权流程
```

#### 2.3.1 服务器元数据发现头部

MCP 客户端在服务器元数据发现期间 **应当 (SHOULD)** 包含头部 `MCP-Protocol-Version: <protocol-version>`，以允许 MCP 服务器根据 MCP 协议版本响应。

例如：`MCP-Protocol-Version: 2024-11-05`

#### 2.3.2 授权基础 URL

授权基础 URL **必须 (MUST)** 从 MCP 服务器 URL 中确定，通过移除任何现有的 `path` 组件。例如：

如果 MCP 服务器 URL 为 `https://api.example.com/v1/mcp`，则：

- 授权基础 URL 是 `https://api.example.com`
- 元数据端点 **必须 (MUST)** 位于
  `https://api.example.com/.well-known/oauth-authorization-server`

这确保了授权端点始终位于托管 MCP 服务器的域的根级别，无论 MCP 服务器 URL 中是否包含路径组件。

#### 2.3.3 无元数据发现的服务器的回退方案

对于未实现 OAuth 2.0 授权服务器元数据的服务器，客户端 **必须 (MUST)** 使用以下相对于授权基础 URL 的默认端点路径（如 [第 2.3.2 节](#232-authorization-base-url) 中定义）：

| 端点                     | 默认路径    | 描述                                |
| ---------------------- | --------- | --------------------------------- |
| 授权端点                 | /authorize | 用于授权请求                        |
| 令牌端点                 | /token     | 用于令牌交换与刷新                  |
| 注册端点                 | /register  | 用于动态客户端注册                  |

例如，若 MCP 服务器托管在 `https://api.example.com/v1/mcp`，则默认端点为：

- `https://api.example.com/authorize`
- `https://api.example.com/token`
- `https://api.example.com/register`

客户端 **必须 (MUST)** 优先尝试通过元数据文档发现端点，然后才回退到默认路径。在使用默认路径时，所有其他协议要求保持不变。

### 2.3 动态客户端注册

MCP 客户端和服务器 **应当 (SHOULD)** 支持
[OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591)，以允许 MCP 客户端无需用户交互即可获取 OAuth 客户端 ID。这为客户端自动注册新服务器提供了标准化方法，对 MCP 尤为重要，因为：

- 客户端无法提前知道所有可能的服务器
- 手动注册会增加用户使用的阻力
- 它支持无缝连接到新服务器
- 服务器可以实施自己的注册策略

未支持动态客户端注册的 MCP 服务器需要提供替代方式以获取客户端 ID（以及客户端密钥，如适用）。对于这些服务器，MCP 客户端必须：

1. 为特定 MCP 服务器硬编码一个客户端 ID（以及客户端密钥，如适用），或
2. 提供一个用户界面，允许用户输入这些详细信息，在自行注册 OAuth 客户端后（例如，通过服务器托管的配置界面）。

### 2.4 授权流程步骤

完整的授权流程如下：

```mermaid
sequenceDiagram
    participant B as 用户代理 (浏览器)
    participant C as 客户端
    participant M as MCP 服务器

    C->>M: GET /.well-known/oauth-authorization-server
    alt 服务器支持发现
        M->>C: 授权服务器元数据
    else 无法发现
        M->>C: 404 (使用默认端点)
    end

    alt 动态客户端注册
        C->>M: POST /register
        M->>C: 客户端凭据
    end

    Note over C: 生成 PKCE 参数
    C->>B: 打开带有授权 URL 和 code_challenge 的浏览器
    B->>M: 授权请求
    Note over M: 用户授权
    M->>B: 重定向到回调，带有授权码
    B->>C: 授权码回调
    C->>M: 使用 code_verifier 发出令牌请求
    M->>C: 访问令牌 (+ 刷新令牌)
    C->>M: 带访问令牌的 API 请求
```

#### 2.4.1 决策流程概览

```mermaid
flowchart TD
    A[开始授权流程] --> B{检查元数据发现}
    B -->|可用| C[使用元数据端点]
    B -->|不可用| D[使用默认端点]

    C --> G{检查注册端点}
    D --> G

    G -->|可用| H[执行动态注册]
    G -->|不可用| I[需要替代注册]

    H --> J[启动 OAuth 流程]
    I --> J

    J --> K[生成 PKCE 参数]
    K --> L[发起授权请求]
    L --> M[用户授权]
    M --> N[使用令牌交换授权码]
    N --> O[使用访问令牌]
```

### 2.5 访问令牌使用

#### 2.5.1 令牌要求

访问令牌的处理 **必须 (MUST)** 符合
[OAuth 2.1 第 5 节](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#section-5)
关于资源请求的要求。具体来说：

1. MCP 客户端 **必须 (MUST)** 使用 `Authorization` 请求头字段
   [第 5.1.1 节](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#section-5.1.1)：

```http
Authorization: Bearer <access-token>
```

注意，客户端到服务器的每个 HTTP 请求中 **必须 (MUST)** 包含授权信息，即使它们属于同一逻辑会话。

2. 访问令牌 **不得 (MUST NOT)** 包含在 URI 查询字符串中。

请求示例：

```http
GET /v1/contexts HTTP/1.1
Host: mcp.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 2.5.2 令牌处理

资源服务器 **必须 (MUST)** 按照
[第 5.2 节](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#section-5.2)
描述验证访问令牌。如果验证失败，服务器 **必须 (MUST)** 根据
[第 5.3 节](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-12#section-5.3)
错误处理要求进行响应。无效或过期的令牌 **必须 (MUST)** 返回 HTTP 401 响应。

### 2.6 安全注意事项

必须实现以下安全要求：

1. 客户端 **必须 (MUST)** 根据 OAuth 2.0 最佳实践安全存储令牌。
2. 服务器 **应当 (SHOULD)** 强制令牌过期和轮换。
3. 所有授权端点 **必须 (MUST)** 通过 HTTPS 提供服务。
4. 服务器 **必须 (MUST)** 验证重定向 URI 以防止开放重定向漏洞。
5. 重定向 URI **必须 (MUST)** 是 localhost URL 或 HTTPS URL。

### 2.7 错误处理

对于授权错误，服务器 **必须 (MUST)** 返回适当的 HTTP 状态码：

| 状态码   | 描述           | 用途                                   |
| ------- | ------------ | ------------------------------------ |
| 401     | 未授权         | 需要授权或令牌无效                      |
| 403     | 禁止访问       | 无效的范围或权限不足                    |
| 400     | 错误请求       | 授权请求格式错误                        |


### 2.8 实现要求

1. 实现 **必须 (MUST)** 遵循 OAuth 2.1 的安全最佳实践。
2. 所有客户端 **必须 (MUST)** 使用 PKCE。
3. **应当 (SHOULD)** 实现令牌轮换以增强安全性。
4. **应当 (SHOULD)** 根据安全需求限制令牌生命周期。

### 2.9 第三方授权流程

#### 2.9.1 概述

MCP 服务器 **可以 (MAY)** 通过第三方授权服务器支持委托授权。在此流程中，MCP 服务器既充当 OAuth 客户端（对第三方授权服务器），又充当 OAuth 授权服务器（对 MCP 客户端）。

#### 2.9.2 流程描述

第三方授权流程包括以下步骤：

1. MCP 客户端启动与 MCP 服务器的标准 OAuth 流程。
2. MCP 服务器将用户重定向到第三方授权服务器。
3. 用户通过第三方授权服务器进行授权。
4. 第三方授权服务器将用户重定向回 MCP 服务器，并附带授权码。
5. MCP 服务器使用授权码从第三方授权服务器获取访问令牌。
6. MCP 服务器生成绑定到第三方会话的自身访问令牌。
7. MCP 服务器完成与 MCP 客户端的原始 OAuth 流程。

```mermaid
sequenceDiagram
    participant B as 用户代理 (浏览器)
    participant C as MCP 客户端
    participant M as MCP 服务器
    participant T as 第三方授权服务器

    C->>M: 启动 OAuth 请求
    M->>B: 重定向到第三方 /authorize
    B->>T: 授权请求
    Note over T: 用户授权
    T->>B: 重定向到 MCP 服务器回调
    B->>M: 授权码
    M->>T: 使用授权码交换令牌
    T->>M: 第三方访问令牌
    Note over M: 生成绑定的 MCP 令牌
    M->>B: 重定向到 MCP 客户端回调
    B->>C: MCP 授权码
    C->>M: 用授权码交换令牌
    M->>C: MCP 访问令牌
```

#### 2.9.3 会话绑定要求

实现第三方授权的 MCP 服务器 **必须 (MUST)**：

1. 维护第三方令牌与发行的 MCP 令牌之间的安全映射。
2. 验证第三方令牌的状态后再承认 MCP 令牌。
3. 实现适当的令牌生命周期管理。
4. 处理第三方令牌的过期与更新。

#### 2.9.4 安全注意事项

在实现第三方授权时，服务器 **必须 (MUST)**：

1. 验证所有重定向 URI。
2. 安全存储第三方凭据。
3. 实现适当的会话超时处理。
4. 考虑令牌链式使用的安全隐患。
5. 对第三方授权失败进行适当的错误处理。

## 3. 最佳实践

### 3.1 本地客户端作为公共 OAuth 2.1 客户端

我们强烈建议本地客户端作为公共客户端实现 OAuth 2.1：

1. 在授权请求中使用代码挑战 (PKCE)，以防止拦截攻击。
2. 实施适合本地系统的安全令牌存储。
3. 遵循令牌刷新最佳实践以维护会话。
4. 正确处理令牌的过期与更新。

### 3.2 授权元数据发现

我们强烈建议所有客户端实现元数据发现。这减少了用户手动提供端点的需求或客户端回退到定义的默认值的必要性。

### 3.3 动态客户端注册

由于客户端无法提前知道 MCP 服务器的集合，我们强烈建议实现动态客户端注册。这允许应用程序自动注册 MCP 服务器，并消除了用户手动获取客户端 ID 的需求。
