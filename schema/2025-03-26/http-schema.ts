/**
 * HTTP-based Model Context Protocol Schema
 *
 * This schema defines a simplified approach to the Model Context Protocol (MCP)
 * that leverages standard HTTP protocols and methods rather than using a custom JSON-RPC envelope.
 */

export const LATEST_PROTOCOL_VERSION = "2025-03-26";

/**
 * Session initialization response
 */
export interface SessionInitResponse {
  /**
   * Bearer token for authentication in subsequent requests
   */
  token: string;

  /**
   * URL for accessing resources
   */
  resources: string;

  /**
   * URL for accessing prompts
   */
  prompts: string;

  /**
   * URL for accessing tools
   */
  tools: string;

  /**
   * Server capabilities
   */
  capabilities?: ServerCapabilities;

  /**
   * Protocol version being used
   */
  protocolVersion?: string;

  /**
   * Server implementation information
   */
  serverInfo?: Implementation;

  /**
   * Instructions for using the server
   */
  instructions?: string;
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  /**
   * Resource capabilities
   */
  resources?: {
    /**
     * Whether the server supports notifications for changes to the resource list
     */
    listChanged?: boolean;

    /**
     * Whether the server supports subscribing to resource updates
     */
    subscribe?: boolean;
  };

  /**
   * Prompt capabilities
   */
  prompts?: {
    /**
     * Whether the server supports notifications for changes to the prompt list
     */
    listChanged?: boolean;
  };

  /**
   * Tool capabilities
   */
  tools?: {
    /**
     * Whether the server supports notifications for changes to the tool list
     */
    listChanged?: boolean;
  };

  /**
   * Completion capabilities
   */
  completions?: Record<string, unknown>;

  /**
   * Logging capabilities
   */
  logging?: Record<string, unknown>;

  /**
   * Experimental capabilities
   */
  experimental?: Record<string, Record<string, unknown>>;
}

/**
 * Implementation information
 */
export interface Implementation {
  /**
   * Name of the implementation
   */
  name: string;

  /**
   * Version of the implementation
   */
  version: string;
}

/**
 * Resource definition
 */
export interface Resource {
  /**
   * The URI of this resource
   */
  uri: string;

  /**
   * A human-readable name for this resource
   */
  name: string;

  /**
   * A description of what this resource represents
   */
  description?: string;

  /**
   * The MIME type of this resource, if known
   */
  mimeType?: string;

  /**
   * Optional annotations for the client
   */
  annotations?: Annotations;
}

/**
 * Optional annotations for the client
 */
export interface Annotations {
  /**
   * Describes how important this data is (0-1)
   */
  priority?: number;

  /**
   * Describes who the intended customer of this object or data is
   */
  audience?: Role[];
}

/**
 * List resources response
 */
export interface ListResourcesResponse {
  /**
   * Array of available resources
   */
  resources: Resource[];

  /**
   * Optional pagination token for fetching next page of results
   */
  nextCursor?: string;
}

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  /**
   * The name of the argument
   */
  name: string;

  /**
   * A human-readable description of the argument
   */
  description?: string;

  /**
   * Whether this argument must be provided
   */
  required?: boolean;
}

/**
 * Prompt definition
 */
export interface Prompt {
  /**
   * The name of the prompt or prompt template
   */
  name: string;

  /**
   * An optional description of what this prompt provides
   */
  description?: string;

  /**
   * A list of arguments to use for templating the prompt
   */
  arguments?: PromptArgument[];
}

/**
 * List prompts response
 */
export interface ListPromptsResponse {
  /**
   * Array of available prompts
   */
  prompts: Prompt[];

  /**
   * Optional pagination token for fetching next page of results
   */
  nextCursor?: string;
}

/**
 * Role in a conversation
 */
export type Role = "user" | "assistant";

/**
 * Content types that can be included in messages
 */
export type ContentType = "text" | "image" | "audio" | "resource";

/**
 * Text content
 */
export interface TextContent {
  /**
   * Content type
   */
  type: "text";

  /**
   * The text content
   */
  text: string;

  /**
   * Optional annotations for the client
   */
  annotations?: Annotations;
}

/**
 * Image content
 */
export interface ImageContent {
  /**
   * Content type
   */
  type: "image";

  /**
   * Base64-encoded image data
   */
  data: string;

  /**
   * The MIME type of the image
   */
  mimeType: string;

  /**
   * Optional annotations for the client
   */
  annotations?: Annotations;
}

/**
 * Audio content
 */
export interface AudioContent {
  /**
   * Content type
   */
  type: "audio";

  /**
   * Base64-encoded audio data
   */
  data: string;

  /**
   * The MIME type of the audio
   */
  mimeType: string;

  /**
   * Optional annotations for the client
   */
  annotations?: Annotations;
}

/**
 * Resource content
 */
export interface ResourceContent {
  /**
   * Content type
   */
  type: "resource";

  /**
   * URI of the resource
   */
  uri: string;

  /**
   * The MIME type of the resource, if known
   */
  mimeType?: string;
}

/**
 * Message content union type
 */
export type MessageContent =
  | TextContent
  | ImageContent
  | AudioContent
  | ResourceContent;

/**
 * Prompt message
 */
export interface PromptMessage {
  /**
   * The role of the message sender
   */
  role: Role;

  /**
   * The content of the message
   */
  content: MessageContent;
}

/**
 * Get prompt response
 */
export interface GetPromptResponse {
  /**
   * An optional description for the prompt
   */
  description?: string;

  /**
   * The messages in the prompt
   */
  messages: PromptMessage[];
}

/**
 * Binary response
 */
export interface BinaryResponse {
  /**
   * Base64-encoded binary data
   */
  data: string;

  /**
   * MIME type of the content
   */
  mimeType: string;
}

/**
 * Types of notifications that can be sent via WebSocket
 */
export type NotificationType =
  | "resource_updated"
  | "resource_list_changed"
  | "prompt_list_changed"
  | "tool_list_changed"
  | "progress";

/**
 * Resource updated notification
 */
export interface ResourceUpdatedNotification {
  /**
   * Notification type
   */
  type: "resource_updated";

  /**
   * URI of the updated resource
   */
  uri: string;
}

/**
 * Resource list changed notification
 */
export interface ResourceListChangedNotification {
  /**
   * Notification type
   */
  type: "resource_list_changed";
}

/**
 * Prompt list changed notification
 */
export interface PromptListChangedNotification {
  /**
   * Notification type
   */
  type: "prompt_list_changed";
}

/**
 * Tool list changed notification
 */
export interface ToolListChangedNotification {
  /**
   * Notification type
   */
  type: "tool_list_changed";
}

/**
 * Progress notification
 */
export interface ProgressNotification {
  /**
   * Notification type
   */
  type: "progress";

  /**
   * ID of the request that is in progress
   */
  requestId: string;

  /**
   * Current progress value
   */
  progress: number;

  /**
   * Total progress required, if known
   */
  total?: number;

  /**
   * Optional message describing the current progress
   */
  message?: string;
}

/**
 * Notification union type
 */
export type Notification =
  | ResourceUpdatedNotification
  | ResourceListChangedNotification
  | PromptListChangedNotification
  | ToolListChangedNotification
  | ProgressNotification;

/**
 * Completion response
 */
export interface CompletionResponse {
  /**
   * Completion information
   */
  completion: {
    /**
     * Array of completion values
     */
    values: string[];

    /**
     * Indicates whether there are additional completion options
     */
    hasMore?: boolean;

    /**
     * The total number of completion options available
     */
    total?: number;
  };
}

/**
 * Error response
 */
export interface ErrorResponse {
  /**
   * Error type
   */
  error: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code
   */
  code: string;
}

/**
 * Logging level
 */
export type LoggingLevel =
  | "emergency"
  | "alert"
  | "critical"
  | "error"
  | "warning"
  | "notice"
  | "info"
  | "debug";

/**
 * Log message
 */
export interface LogMessage {
  /**
   * The severity of this log message
   */
  level: LoggingLevel;

  /**
   * The data to be logged
   */
  data: unknown;

  /**
   * An optional name of the logger issuing this message
   */
  logger?: string;
}

/**
 * Root definition
 */
export interface Root {
  /**
   * The URI identifying the root
   */
  uri: string;

  /**
   * An optional name for the root
   */
  name?: string;
}

/**
 * List roots response
 */
export interface ListRootsResponse {
  /**
   * Array of available roots
   */
  roots: Root[];
}

/**
 * Model hint
 */
export interface ModelHint {
  /**
   * A hint for a model name
   */
  name?: string;
}

/**
 * Model preferences
 */
export interface ModelPreferences {
  /**
   * How much to prioritize intelligence (0-1)
   */
  intelligencePriority?: number;

  /**
   * How much to prioritize speed (0-1)
   */
  speedPriority?: number;

  /**
   * How much to prioritize cost (0-1)
   */
  costPriority?: number;

  /**
   * Optional hints for model selection
   */
  hints?: ModelHint[];
}

/**
 * Create message request
 */
export interface CreateMessageRequest {
  /**
   * Messages to send to the LLM
   */
  messages: SamplingMessage[];

  /**
   * Maximum number of tokens to sample
   */
  maxTokens: number;

  /**
   * Temperature for sampling
   */
  temperature?: number;

  /**
   * Stop sequences for sampling
   */
  stopSequences?: string[];

  /**
   * Model preferences
   */
  modelPreferences?: ModelPreferences;

  /**
   * Request to include context
   */
  includeContext?: "none" | "thisServer" | "allServers";

  /**
   * Optional system prompt
   */
  systemPrompt?: string;

  /**
   * Optional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Sampling message
 */
export interface SamplingMessage {
  /**
   * The role of the message sender
   */
  role: Role;

  /**
   * The content of the message
   */
  content: TextContent | ImageContent | AudioContent;
}

/**
 * Create message response
 */
export interface CreateMessageResponse {
  /**
   * The content of the message
   */
  content: TextContent | ImageContent | AudioContent;

  /**
   * The name of the model that generated the message
   */
  model: string;

  /**
   * The role of the message sender
   */
  role: Role;

  /**
   * The reason why sampling stopped, if known
   */
  stopReason?: string;
}
