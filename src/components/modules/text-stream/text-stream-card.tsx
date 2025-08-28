import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TextStreamStatus from "./text-stream-status";
import { ConnectionStatus } from "@/lib/types/text-stream/status/connection-status";
import { Button } from "@/components/ui/button";
import { WebStreamMessage } from "@/lib/types/clippy-cli/clippy-cli-message";

type TextStreamCardProps = {
  connectionStatus: ConnectionStatus;
  messages: WebStreamMessage[];
  onClearMessages: () => void;
};

export default function TextStreamCard({
  connectionStatus,
  messages,
  onClearMessages,
}: TextStreamCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 justify-between">
            <TextStreamStatus connectionStatus={connectionStatus} />
            <CardTitle>
              <h2 className="text-xl">Live Text Stream</h2>
            </CardTitle>
          </div>
          <Button variant={`destructive`} onClick={onClearMessages}>
            Clear
          </Button>
        </div>
        <CardDescription>
          Messages from your CLI tool will appear here in real-time
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
