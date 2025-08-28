"use client";

import TextStreamCard from "@/components/modules/text-stream/text-stream-card";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import { WebStreamMessage } from "@/lib/types/clippy-cli/clippy-cli-message";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<WebStreamMessage[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  console.log(connectionStatus);

  useEffect(() => {
    // Connect to the SSE endpoint
    setConnectionStatus("connecting");
    const eventSource = new EventSource("/api/clippy");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: WebStreamMessage = JSON.parse(event.data);

        // Handle connection establishment confirmation
        if (data.type === "connection-established") {
          setConnectionStatus("connected");
          return; // Don't add this to messages
        }

        // Only process messages that have actual text content
        if (!data.text && data.type !== "typing") {
          return;
        }

        setMessages((prev) => {
          // If this is a clear message, remove based on clearScope
          if (data.type === "clear") {
            if ("clearScope" in data) {
              switch (data.clearScope) {
                case "all":
                  return [];
                case "typing":
                  return prev.filter((msg) => msg.type !== "typing");
                case "session":
                  return prev.filter(
                    (msg) =>
                      !("sessionId" in msg) || msg.sessionId !== data.sessionId
                  );
                default:
                  return prev.filter((msg) => msg.type !== "typing");
              }
            }
            return prev.filter((msg) => msg.type !== "typing");
          }

          // If this is a typing update, replace the last typing message
          if (data.type === "typing") {
            // Check if the last message was also a typing message
            if (prev.length > 0 && prev[prev.length - 1].type === "typing") {
              // Replace the last message with the new typing content
              return [...prev.slice(0, -1), data];
            } else {
              // Add as new message if last wasn't typing
              return [...prev, data];
            }
          } else {
            // For final messages, replace typing if it exists
            if (prev.length > 0 && prev[prev.length - 1].type === "typing") {
              // Replace the typing message with the final message
              return [...prev.slice(0, -1), data];
            } else {
              // Add as new message
              return [...prev, data];
            }
          }
        });
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus("disconnected");
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="">
      <div className="border rounded-lg shadow-sm">
        <TextStreamCard connectionStatus={connectionStatus} />

        <div className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.481L3 21l2.519-5.906A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">
                No messages yet. Start typing in your CLI tool!
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Send text to:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  POST http://localhost:3000/api/clippy
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message, index) => {
                // Helper function to get message text safely
                const getMessageText = (msg: WebStreamMessage): string => {
                  if (msg.type === "connection-established")
                    return "Connected to CLI";
                  if ("text" in msg) return msg.text;
                  return "";
                };

                // Helper function to get additional message info
                const getMessageInfo = (msg: WebStreamMessage): string => {
                  if (msg.type === "command" && "command" in msg) {
                    return `Command: ${msg.command}${
                      msg.args ? ` ${msg.args.join(" ")}` : ""
                    }`;
                  }
                  if (msg.type === "error" && "errorCode" in msg) {
                    return `Error${msg.errorCode ? ` (${msg.errorCode})` : ""}${
                      msg.retryable ? " - Retryable" : ""
                    }`;
                  }
                  return "";
                };

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.type === "connection-established"
                        ? "bg-blue-50 border border-blue-200"
                        : message.type === "typing"
                        ? "bg-yellow-50 border border-yellow-200"
                        : message.type === "error"
                        ? "bg-red-50 border border-red-200"
                        : message.type === "command"
                        ? "bg-purple-50 border border-purple-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800">
                          {getMessageText(message)}
                        </p>
                        {getMessageInfo(message) && (
                          <p className="text-xs text-gray-600 mt-1">
                            {getMessageInfo(message)}
                          </p>
                        )}
                        {message.type === "typing" && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Typing...
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                        {new Date(
                          message.timestamp ?? Date.now()
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
