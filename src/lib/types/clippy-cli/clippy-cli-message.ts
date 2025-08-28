// Base message interface with common properties
interface BaseMessage {
  text: string;
  timestamp?: number; // Optional, can be set by server if not provided
  sessionId?: string; // Optional session tracking
}

// Discriminated union for different message types from CLI
export type ClippyCliMessage =
  | (BaseMessage & {
      type: "typing";
      isIncremental: boolean; // Whether this is replacing previous typing or appending
    })
  | (BaseMessage & {
      type: "message";
      priority?: "low" | "normal" | "high"; // Optional priority level
    })
  | (BaseMessage & {
      type: "command";
      command: string; // The actual command being executed
      args?: string[]; // Optional command arguments
    })
  | (BaseMessage & {
      type: "clear";
      text: ""; // Clear messages have empty text
      clearScope: "all" | "typing" | "session"; // What to clear
    })
  | (BaseMessage & {
      type: "error";
      errorCode?: string; // Optional error classification
      retryable: boolean; // Whether the action can be retried
    });

// Type guards for better type safety
export function isTypingMessage(
  msg: ClippyCliMessage
): msg is ClippyCliMessage & { type: "typing" } {
  return msg.type === "typing";
}

export function isRegularMessage(
  msg: ClippyCliMessage
): msg is ClippyCliMessage & { type: "message" } {
  return msg.type === "message";
}

export function isCommandMessage(
  msg: ClippyCliMessage
): msg is ClippyCliMessage & { type: "command" } {
  return msg.type === "command";
}

export function isClearMessage(
  msg: ClippyCliMessage
): msg is ClippyCliMessage & { type: "clear" } {
  return msg.type === "clear";
}

export function isErrorMessage(
  msg: ClippyCliMessage
): msg is ClippyCliMessage & { type: "error" } {
  return msg.type === "error";
}

// Additional web-specific message type for connection status
export type WebStreamMessage =
  | ClippyCliMessage
  | {
      type: "connection-established";
      timestamp: number;
    };
