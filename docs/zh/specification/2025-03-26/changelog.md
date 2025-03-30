---
title: 关键变更
type: docs
weight: 5
---

本文档列出了自上一版本 [2024-11-05]({{< ref "../2024-11-05" >}}) 起，对 Model Context Protocol (MCP) 规范所做的更改。

## 主要变更

1. 添加了基于 OAuth 2.1 的全面 **[授权框架]({{< ref "basic/authorization" >}})** (PR [#133](https://github.com/modelcontextprotocol/specification/pull/133))  
1. 将之前的 HTTP+SSE 传输替换为更灵活的 **[可流式传输的 HTTP 传输]({{< ref "basic/transports#streamable-http" >}})** (PR [#206](https://github.com/modelcontextprotocol/specification/pull/206))  
1. 增加了对 JSON-RPC **[批处理](https://www.jsonrpc.org/specification#batch)** 的支持 (PR [#228](https://github.com/modelcontextprotocol/specification/pull/228))  
1. 添加了全面的 **工具注解**，用于更好地描述工具行为，例如工具是只读的还是具有破坏性 (PR [#185](https://github.com/modelcontextprotocol/specification/pull/185))  

## 其他 Schema 变更

- 在 `ProgressNotification` 中新增了 `message` 字段，用于提供描述性的状态更新  
- 增加了对音频数据的支持，与现有的文本和图像内容类型并列  
- 添加了 `completions` 功能，用于明确指示支持参数自动补全建议  

有关更多详细信息，请参阅 [更新后的 Schema](http://github.com/modelcontextprotocol/specification/tree/main/schema/2025-03-26/schema.ts)。

## 完整变更日志

有关自上一协议修订版以来所做的所有更改的完整列表，请查看 [GitHub](https://github.com/modelcontextprotocol/specification/compare/2024-11-05...2025-03-26)。