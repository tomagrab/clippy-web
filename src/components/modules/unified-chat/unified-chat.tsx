"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TextStreamStatus from "../text-stream/text-stream-status";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import {
  WebStreamMessage,
  ClippyCliMessage,
} from "@/lib/types/clippy-cli/clippy-cli-message";
import { Send, MessageSquare, Loader2, Trash2 } from "lucide-react";

type UnifiedChatProps = {
  connectionStatus: ConnectionStatus;
  incomingMessages: WebStreamMessage[];
  onClearMessages: () => void;
  onMessageSent?: (message: ClippyCliMessage) => void;
};

type ChatMessage = {
  id: string;
  text: string;
  timestamp: number;
  sender: "web" | "cli";
  type: "message" | "typing" | "system";
  originalMessage?: WebStreamMessage | ClippyCliMessage;
};

export default function UnifiedChat({
  connectionStatus,
  incomingMessages,
  onClearMessages,
  onMessageSent,
}: UnifiedChatProps) {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<ClippyCliMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [isTypingIndicatorSent, setIsTypingIndicatorSent] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cleanup typing timeout when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Convert incoming CLI messages to chat messages and merge with sent messages
  useEffect(() => {
    const convertedIncoming: ChatMessage[] = incomingMessages.map(
      (msg, index) => ({
        id: `cli-${index}-${msg.timestamp || Date.now()}`,
        text: getMessageText(msg),
        timestamp: msg.timestamp || Date.now(),
        sender: "cli",
        type:
          msg.type === "typing"
            ? "typing"
            : msg.type === "connection-established"
            ? "system"
            : "message",
        originalMessage: msg,
      })
    );

    const convertedSent: ChatMessage[] = sentMessages.map((msg, index) => ({
      id: `web-${index}-${msg.timestamp}`,
      text: msg.text,
      timestamp: msg.timestamp || Date.now(),
      sender: "web",
      type: "message",
      originalMessage: msg,
    }));

    // Merge and sort by timestamp
    const merged = [...convertedIncoming, ...convertedSent].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    setAllMessages(merged);
  }, [incomingMessages, sentMessages]);

  // Helper function to get message text safely
  const getMessageText = (msg: WebStreamMessage): string => {
    if (msg.type === "connection-established") return "Connected to CLI";
    if ("text" in msg) return msg.text;
    return "";
  };

  // Send typing indicator to CLI
  const sendTypingIndicator = async () => {
    try {
      const typingMessage: ClippyCliMessage = {
        type: "typing",
        text: "", // Don't send actual text content
        timestamp: Date.now(),
        isIncremental: true,
      };

      await fetch("/api/clippy/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(typingMessage),
      });

      setIsTypingIndicatorSent(true);
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error);
    }
  };

  // Clear typing indicator
  const clearTypingIndicator = async () => {
    try {
      const clearMessage: ClippyCliMessage = {
        type: "clear",
        text: "",
        timestamp: Date.now(),
        clearScope: "typing",
      };

      await fetch("/api/clippy/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clearMessage),
      });

      setIsTypingIndicatorSent(false);
    } catch (error) {
      console.error("❌ Failed to clear typing indicator:", error);
    }
  };

  // Handle input changes with typing indicators
  const handleInputChange = async (value: string) => {
    setMessageText(value);

    // Clear any existing typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // If input is now empty, clear typing indicator immediately
    if (!value.trim()) {
      if (isTypingIndicatorSent) {
        await clearTypingIndicator();
      }
      setTypingTimeout(null);
      return;
    }

    // If user is typing and we haven't sent typing indicator yet, send it
    if (value.trim() && !isTypingIndicatorSent) {
      await sendTypingIndicator();
    }

    // Set a timeout to clear the typing indicator if user stops typing
    const timeout = setTimeout(async () => {
      if (isTypingIndicatorSent) {
        await clearTypingIndicator();
      }
    }, 2000); // Clear typing indicator after 2 seconds of inactivity

    setTypingTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);

    try {
      // Clear typing indicator before sending message
      if (isTypingIndicatorSent) {
        await clearTypingIndicator();
      }

      const message: ClippyCliMessage = {
        type: "message",
        text: messageText.trim(),
        timestamp: Date.now(),
      };

      // Send to the CLI stream endpoint
      const response = await fetch("/api/clippy/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Message sent to CLI:", result);

      // Add to sent messages
      setSentMessages((prev) => [...prev, message]);
      onMessageSent?.(message);

      // Clear the input
      setMessageText("");
    } catch (error) {
      console.error("❌ Failed to send message to CLI:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearAll = () => {
    setSentMessages([]);
    onClearMessages();
  };

  const renderMessage = (message: ChatMessage) => {
    const isWeb = message.sender === "web";
    const isSystem = message.type === "system";
    const isTyping = message.type === "typing";

    return (
      <div
        key={message.id}
        className={`flex ${isWeb ? "justify-end" : "justify-start"} mb-4`}
      >
        <div className={`max-w-[80%] ${isWeb ? "order-2" : "order-1"}`}>
          {/* Message header */}
          <div
            className={`flex items-center gap-2 mb-1 ${
              isWeb ? "justify-end" : "justify-start"
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isSystem
                  ? "text-purple-600"
                  : isWeb
                  ? "text-blue-600"
                  : "text-green-600"
              }`}
            >
              {isSystem ? "⚡ System" : isWeb ? "🌐 Web" : "💻 CLI"}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Message bubble */}
          <div
            className={`p-3 rounded-lg ${
              isSystem
                ? "bg-purple-50 border border-purple-200 text-purple-800"
                : isWeb
                ? "bg-blue-500 text-white"
                : isTyping
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-sm break-words">{message.text}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TextStreamStatus connectionStatus={connectionStatus} />
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Clippy Chat
              </CardTitle>
              <CardDescription>
                Real-time chat with your CLI tool
              </CardDescription>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            disabled={allMessages.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[500px] border rounded-lg p-4 bg-gray-50">
          {allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <MessageSquare className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500 mb-1">No messages yet</p>
                <p className="text-sm text-gray-400">
                  Start a conversation with your CLI tool!
                </p>
              </div>
            </div>
          ) : (
            <>
              {allMessages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Area */}
        <div className="border-t pt-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message and press Enter..."
              value={messageText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-lg border-2 focus:border-blue-500 transition-colors"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim() || isSending}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <p className="text-xs text-gray-500">
              {connectionStatus === "connected"
                ? "🟢 Connected"
                : connectionStatus === "connecting"
                ? "🟡 Connecting..."
                : "🔴 Disconnected"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
