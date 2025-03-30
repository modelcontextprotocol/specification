---
linkTitle: 2025-03-26（最新）
title: Model Context Protocol 规范
cascade:
  type: docs
breadcrumbs: false
weight: 1
aliases:
  - /latest
---

{{< callout type="info" >}} **协议修订版本**: 2025-03-26 {{< /callout >}}

[Model Context Protocol](https://modelcontextprotocol.io)（MCP）是一种开放协议，
使 LLM（大语言模型）应用程序可以与外部数据源和工具无缝集成。无论您是在构建一个基于 AI 的 IDE、
增强聊天界面，还是创建定制的 AI 工作流，MCP 都提供了一种标准化的方式，
将 LLM 与它们所需的上下文连接起来。

本规范定义了权威的协议要求，基于
[TypeScript schema](https://github.com/modelcontextprotocol/specification/blob/main/schema/2025-03-26/schema.ts)
中的定义。

有关实现指南和示例，请访问 [modelcontextprotocol.io](https://modelcontextprotocol.io)。

本文档中的以下关键字 "MUST"、"MUST NOT"、"REQUIRED"、"SHALL"、"SHALL NOT"、
"SHOULD"、"SHOULD NOT"、"RECOMMENDED"、"NOT RECOMMENDED"、"MAY" 和 "OPTIONAL"，
应按照 [BCP 14](https://datatracker.ietf.org/doc/html/bcp14)
[[RFC2119](https://datatracker.ietf.org/doc/html/rfc2119)]
[[RFC8174](https://datatracker.ietf.org/doc/html/rfc8174)] 的描述进行解释，
并仅在它们以全大写形式出现时遵循这些定义。

## 概述

MCP 为应用程序提供了一种标准化方式，用于：

- 与语言模型共享上下文信息
- 向 AI 系统暴露工具和功能
- 构建可组合的集成和工作流

该协议使用 [JSON-RPC](https://www.jsonrpc.org/) 2.0 消息格式，在以下组件之间建立通信：

- **主机（Hosts）**：启动连接的 LLM 应用程序
- **客户端（Clients）**：主机应用程序中的连接器
- **服务器（Servers）**：提供上下文和功能的服务

MCP 的灵感部分来源于
[Language Server Protocol](https://microsoft.github.io/language-server-protocol/)，
该协议标准化了如何在整个开发工具生态系统中添加对编程语言的支持。类似地，
MCP 标准化了如何将额外的上下文和工具集成到 AI 应用程序的生态系统中。

## 关键细节

### 基础协议

- [JSON-RPC](https://www.jsonrpc.org/) 消息格式
- 有状态连接
- 服务器和客户端的功能协商

### 功能

服务器可以向客户端提供以下功能之一：

- **资源（Resources）**：上下文和数据，供用户或 AI 模型使用
- **提示（Prompts）**：为用户提供的模板化消息和工作流
- **工具（Tools）**：供 AI 模型执行的功能

客户端可以向服务器提供以下功能：

- **采样（Sampling）**：由服务器触发的代理行为和递归 LLM 交互

### 附加实用功能

- 配置
- 进度跟踪
- 取消操作
- 错误报告
- 日志记录

## 安全性与信任与安全

Model Context Protocol 通过任意数据访问和代码执行路径提供了强大的功能。
与这样的功能相伴的是所有实现者必须仔细解决的重要安全性和信任问题。

### 关键原则

1. **用户同意与控制**

   - 用户必须明确同意并理解所有数据访问和操作
   - 用户必须能够控制哪些数据被共享以及采取哪些操作
   - 实现者应提供清晰的用户界面，用于审查和授权活动

2. **数据隐私**

   - 主机必须在向服务器暴露用户数据之前获得明确的用户同意
   - 主机不得在未经用户同意的情况下将资源数据传输到其他地方
   - 用户数据应通过适当的访问控制进行保护

3. **工具安全**

   - 工具代表任意代码执行，必须以适当的谨慎态度对待。
     - 特别是，工具行为（如注释）的描述应被视为不可信，除非它们来自可信服务器。
   - 主机必须在调用任何工具之前获得明确的用户同意
   - 用户应了解每个工具的功能后再授权其使用

4. **LLM 采样控制**
   - 用户必须明确批准任何 LLM 采样请求
   - 用户应控制：
     - 是否允许采样
     - 将要发送的实际提示
     - 服务器可以看到的结果
   - 协议有意限制了服务器对提示的可见性

### 实现指南

虽然 MCP 本身无法在协议层面强制执行这些安全原则，但实现者 **应该**：

1. 在其应用中构建可靠的同意和授权流程
2. 提供清晰的安全隐患文档
3. 实施适当的访问控制和数据保护
4. 在集成中遵循安全最佳实践
5. 在功能设计中考虑隐私影响

## 了解更多

探索每个协议组件的详细规范：

{{< cards >}} 
{{< card link="architecture" title="架构" icon="template" >}}
{{< card link="basic" title="基础协议" icon="code" >}}
{{< card link="server" title="服务器功能" icon="server" >}}
{{< card link="client" title="客户端功能" icon="user" >}}
{{< card link="contributing" title="贡献指南" icon="pencil" >}} 
{{< /cards >}}