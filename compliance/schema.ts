/**
 * MCP SDK Support Manifest TypeScript Types
 */

export type SdkPlatform = 
  | "python" 
  | "typescript" 
  | "java" 
  | "csharp"
  | "kotlin"
  | "go"
  | "ruby"
  | "rust"
  | "swift";

export type ProtocolVersion = string; // Format: YYYY-MM-DD

export interface TransportFeatures {
  stdio?: boolean;
  streamable_http?: boolean;
  http_sse?: boolean;
}

export interface ClientFeatures {
  roots?: boolean;
  sampling?: boolean;
}

export interface ServerFeatures {
  prompts?: boolean;
  resources?: boolean;
  tools?: boolean;
}

export interface UtilityFeatures {
  cancellation?: boolean;
  ping?: boolean;
  completion?: boolean;
  logging?: boolean;
  pagination?: boolean;
  progress?: boolean;
}

export interface AuthorizationFeatures {
  oauth_client_auth?: boolean;
}

export interface ProtocolSupport {
  transport?: TransportFeatures;
  client?: ClientFeatures;
  server?: ServerFeatures;
  utilities?: UtilityFeatures;
  authorization?: AuthorizationFeatures;
}

export interface McpSdkSupportManifest {
  /** The schema version this manifest complies with */
  schema_version: string;
  
   /** The language or platform of the SDK */
  sdk_platform: SdkPlatform;
  
  /** The version of the SDK */
  sdk_version: string;
  
  /** Support status for each MCP protocol version */
  mcp_spec_support: Record<ProtocolVersion, ProtocolSupport>;
  
  /** The date when this manifest was last updated (YYYY-MM-DD) */
  last_updated: string;
}
