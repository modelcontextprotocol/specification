/**
 * PostMessage Transport Protocol - Message Interfaces
 * 
 * This protocol defines a two-phase approach to MCP server connections:
 * 1. Setup Phase - One-time configuration when adding a server
 * 2. Transport Phase - Active MCP communication with configured servers
 * 
 * PHASE DETECTION:
 * - Setup: Server URL includes #setup hash parameter
 * - Transport: Server URL has no hash parameter
 * 
 * SECURITY: Servers must always validate message origins using event.origin
 * from the browser's MessageEvent API. This is the only trusted source of
 * origin information in the postMessage security model.
 * 
 * TARGET ORIGINS:
 * - Server's first message in each phase uses targetOrigin '*' (doesn't know client yet)
 * - After receiving client's first message, server pins event.origin and uses it exclusively
 * - Client always uses server's origin (known from iframe URL) as targetOrigin
 */

// ============================================================================
// SETUP PHASE MESSAGES
// ============================================================================

/**
 * Permission requirements for browser capabilities
 */
export interface PermissionRequirement {
  /**
   * Standard permission name from Permissions API / Feature Policy.
   * Examples: "camera", "microphone", "clipboard-read", "display-capture"
   */
  name: string;

  /**
   * One or more phases during which this permission is needed.
   * At least one phase must be specified.
   */
  phase: ('setup' | 'transport')[];

  /**
   * Whether this permission is required for core functionality.
   * - true: Connection may fail without it.
   * - false: Tool can degrade gracefully.
   */
  required: boolean;

  /**
   * User-facing explanation of why this permission is being requested.
   * Should be concise and written in plain language.
   * Example: "To analyze copied text and generate diagrams"
   */
  purpose: string;
}

/**
 * Setup Handshake (Inner Frame → Outer Frame)
 * 
 * Context: The Outer Frame has created a subordinate window (Inner Frame) and
 * navigated it to a URL with a `#setup` hash. The code in the Inner Frame
 * detects this and initiates the setup phase by sending this message.
 * 
 * TARGET ORIGIN: The Inner Frame must use '*' because it cannot know the
 * origin of its parent/opener at this stage. This is the only message where
 * the initiating party uses a wildcard target origin.
 */
export interface SetupHandshakeMessage {
  type: 'MCP_SETUP_HANDSHAKE';
  
  /**
   * Minimum protocol version required by the inner frame.
   * Example: "1.0"
   */
  minProtocolVersion: string;

  /**
   * Maximum protocol version supported by the inner frame.
   * Example: "2.0"
   */
  maxProtocolVersion: string;
  
  /** Whether the server needs to show UI during setup */
  requiresVisibleSetup: boolean;

  /**
   * Optional permissions this inner frame needs during setup and/or transport phases.
   * Used by outer frame to configure iframe sandbox and user consent flows.
   */
  requestedPermissions?: PermissionRequirement[];
}

/**
 * Setup Handshake Reply (Outer Frame → Inner Frame)
 * 
 * Context: The Outer Frame receives the `SetupHandshakeMessage` and replies
 * to confirm its willingness to proceed with setup. If `requiresVisibleSetup`
 * was true, the Outer Frame is responsible for making the Inner Frame visible.
 * 
 * TARGET ORIGIN: The Outer Frame uses the origin of the Inner Frame, which
 * it knows from the iframe's `src` or the popup's URL.
 * 
 * SECURITY: Upon receiving this message, the Inner Frame must:
 * 1. Validate that `event.origin` matches the expected Outer Frame's origin.
 * 2. Pin `event.origin` for all subsequent communication in this session.
 */
export interface SetupHandshakeReplyMessage {
  type: 'MCP_SETUP_HANDSHAKE_REPLY';
  
  /**
   * The agreed-upon protocol version chosen by the outer frame,
   * which must fall within [minProtocolVersion, maxProtocolVersion].
   * Must be a valid semantic version string.
   */
  protocolVersion: string;
  
  /** 
   * Unique identifier for this connection instance.
   * The MCP Client provides this ID, and the MCP Server uses it to
   * scope any persistent storage (e.g., localStorage).
   */
  sessionId: string;
}

/**
 * Setup Complete (Inner Frame → Outer Frame)
 * 
 * Context: The setup process within the Inner Frame is complete (e.g., user
 * authenticated, configuration set). The Inner Frame sends this final message
 * to the Outer Frame, which can then persist the configuration and close
 * or hide the setup window.
 * 
 * TARGET ORIGIN: The Inner Frame uses the pinned origin of the Outer Frame.
 */
export interface SetupCompleteMessage {
  type: 'MCP_SETUP_COMPLETE';
  
  /** Whether setup succeeded or failed */
  status: 'success' | 'error';
  
  /** 
   * A user-facing name for the inner frame's application.
   * In the Standard Architecture, this is the MCP Server's title (e.g., "Pi Calculator").
   * In the Inverted Architecture, this could be the MCP Client's title (e.g., "AI Copilot").
   * This appears in the Outer Frame's UI.
   */
  displayName: string;
  
  /** 
   * Optional message to briefly show the user (toast/notification style)
   * Examples: "Successfully authenticated!", "Configuration saved"
   */
  ephemeralMessage?: string;
  
  /** 
   * Visibility behavior during transport phase
   */
  transportVisibility: {
    /** 
     * Visibility requirement:
     * - 'required': Server must be visible (e.g., shows live visualizations)
     * - 'optional': User can choose (e.g., can show logs but not necessary)
     * - 'hidden': Server should stay hidden (most common case)
     */
    requirement: 'required' | 'optional' | 'hidden';
    
    /**
     * If `requirement` is 'optional', this user-facing string describes
     * the benefit of keeping the transport visible. The Outer Frame's UI
     * should display this next to a show/hide control.
     *
     * @example "Show to see live diagram previews."
     */
    description?: string;
  };
  
  /** If status is 'error', details about what went wrong */
  error?: {
    code: 'USER_CANCELLED' | 'AUTH_FAILED' | 'TIMEOUT' | 'CONFIG_ERROR' | 'VERSION_MISMATCH' | 'INSUFFICIENT_PERMISSIONS';
    message: string;
  };
}

// ============================================================================
// TRANSPORT PHASE MESSAGES
// ============================================================================

/**
 * Transport Handshake (Inner Frame → Outer Frame)
 * 
 * Context: The Outer Frame has created a subordinate window (Inner Frame) for
 * an active transport session (i.e., no `#setup` hash). The Inner Frame
 * initiates the connection by sending this message.
 * 
 * TARGET ORIGIN: The Inner Frame must use '*' because, as a new window
 * instance, it does not yet know its controller's origin.
 */
export interface TransportHandshakeMessage {
  type: 'MCP_TRANSPORT_HANDSHAKE';
  
  /** Protocol version for compatibility checking */
  protocolVersion: '1.0';
}

/**
 * Transport Handshake Reply (Outer Frame → Inner Frame)
 * 
 * Context: The Outer Frame receives the `TransportHandshakeMessage` and replies
 * with the `sessionId` for this connection, authorizing the transport to begin.
 * 
 * TARGET ORIGIN: The Outer Frame uses the Inner Frame's origin.
 * 
 * SECURITY: Upon receiving this message, the Inner Frame must:
 * 1. Validate that `event.origin` is an allowed origin.
 * 2. Pin `event.origin` for all subsequent communication in this session.
 */
export interface TransportHandshakeReplyMessage {
  type: 'MCP_TRANSPORT_HANDSHAKE_REPLY';
  
  /** 
   * Unique identifier for this connection instance.
   * The MCP Client provides this ID, and the MCP Server uses it to
   * scope any persistent storage (e.g., localStorage).
   */
  sessionId: string;
  
  /** Protocol version for compatibility checking */
  protocolVersion: '1.0';
}

/**
 * Transport Accepted (Inner Frame → Outer Frame)
 * 
 * Context: The Inner Frame has received the handshake reply, validated the
 * Outer Frame's origin, and is now ready for MCP communication. This message
 * signals to the Outer Frame that the transport is fully established.
 * 
 * TARGET ORIGIN: The Inner Frame uses the pinned origin of the Outer Frame.
 */
export interface TransportAcceptedMessage {
  type: 'MCP_TRANSPORT_ACCEPTED';
  
  /** Echo back the session ID to confirm */
  sessionId: string;
}

/**
 * After the transport handshake is complete, the client and server exchange
 * standard MCP protocol messages (JSON-RPC 2.0 format). All MCP messages
 * use the pinned origins established during handshake:
 * - Server → Client: Uses the pinned client origin from Step 2
 * - Client → Server: Uses the server origin from the iframe URL
 */

/**
 * MCP Message Wrapper (Bidirectional)
 * 
 * Context: After TransportAccepted, all MCP protocol messages are wrapped
 * in this message type. This allows the transport to distinguish between
 * transport control messages and MCP protocol messages.
 * 
 * TARGET ORIGIN: Both parties use their respective pinned origins.
 */
export interface MCPMessage {
  type: 'MCP_MESSAGE';
  
  /** The complete MCP JSON-RPC 2.0 message */
  payload: {
    jsonrpc: '2.0';
    id?: string | number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
  };
}

// ============================================================================
// RUNTIME MESSAGES (During Active Transport)
// ============================================================================

/**
 * (Inner Frame → Outer Frame) (Optional)
 * 
 * Context: During an active session, the Inner Frame determines it needs 
 * to re-run the setup phase. For example:
 * - OAuth token has expired
 * - API key is no longer valid  
 * - Server configuration has changed
 * - User permissions have changed
 * 
 * The Outer Frame should prompt the user to re-run setup for this server.
 * 
 * TARGET ORIGIN: The Inner Frame uses the pinned origin from the session.
 */
export interface SetupRequiredMessage {
  type: 'MCP_SETUP_REQUIRED';
  
  /** Why setup is needed again */
  reason: 'AUTH_EXPIRED' | 'CONFIG_CHANGED' | 'PERMISSIONS_CHANGED' | 'OTHER';
  
  /** Human-readable explanation */
  message: string;
  
  /** 
   * Whether the current session can continue working
   * - true: Session works but setup recommended soon
   * - false: Session will fail, setup required immediately
   */
  canContinue: boolean;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/** All setup phase messages */
export type SetupMessage = 
  | SetupHandshakeMessage 
  | SetupHandshakeReplyMessage 
  | SetupCompleteMessage;

/** All transport phase messages */
export type TransportMessage = 
  | TransportHandshakeMessage 
  | TransportHandshakeReplyMessage 
  | TransportAcceptedMessage
  | SetupRequiredMessage
  | MCPMessage;

/** All PostMessage protocol messages */
export type PostMessageProtocolMessage = 
  | SetupMessage 
  | TransportMessage;

/** Check if a message is a PostMessage protocol message */
export function isPostMessageProtocol(message: any): message is PostMessageProtocolMessage {
  return message?.type?.startsWith('MCP_');
}

/** Check if a message is from setup phase */
export function isSetupMessage(message: any): message is SetupMessage {
  return message?.type?.startsWith('MCP_SETUP_') && 
         message.type !== 'MCP_SETUP_REQUIRED';
}

/** Check if a message is from transport phase */
export function isTransportMessage(message: any): message is TransportMessage {
  return message?.type?.startsWith('MCP_TRANSPORT_') ||
         message?.type === 'MCP_SETUP_REQUIRED' ||
         message?.type === 'MCP_MESSAGE';
}

/** Check if a message is an MCP message wrapper */
export function isMCPMessage(message: any): message is MCPMessage {
  return message?.type === 'MCP_MESSAGE';
}