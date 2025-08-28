"use client";

import TextStreamCard from "@/components/modules/text-stream/text-stream-card";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import { WebStreamMessage } from "@/lib/types/clippy-cli/clippy-cli-message";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<WebStreamMessage[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

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

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="border rounded-lg shadow-sm">
      <TextStreamCard
        connectionStatus={connectionStatus}
        messages={messages}
        onClearMessages={clearMessages}
      />
    </div>
  );
}
