"use client";

import { useEffect, useState } from "react";

interface StreamMessage {
  text: string;
  timestamp: number;
  type?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");

  useEffect(() => {
    // Connect to the SSE endpoint
    setConnectionStatus("connecting");
    const eventSource = new EventSource("/api/clippy");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data: StreamMessage = JSON.parse(event.data);

        setMessages((prev) => {
          // If this is a clear message, remove any typing indicators
          if (data.type === "clear") {
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
            // For final messages or connection messages, replace typing if it exists
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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "disconnected":
        return "text-red-600";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
    }
  };

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Clippy Web</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your AI-powered writing assistant
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              ></div>
            </div>

            <button
              onClick={clearMessages}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition-colors"
            >
              Clear Messages
            </button>
          </div>
        </header>

        <div className="bg-white border rounded-lg shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium text-gray-800">Live Text Stream</h2>
            <p className="text-sm text-gray-500">
              Messages from your CLI tool will appear here in real-time
            </p>
          </div>

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
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.type === "connection"
                        ? "bg-blue-50 border border-blue-200"
                        : message.type === "typing"
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800">{message.text}</p>
                        {message.type === "typing" && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Typing...
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
