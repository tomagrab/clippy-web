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
import { Badge } from "@/components/ui/badge";
import { ClippyCliMessage } from "@/lib/types/clippy-cli/clippy-cli-message";
import { Send, MessageSquare, Loader2 } from "lucide-react";

type CliSenderProps = {
  onMessageSent?: (message: ClippyCliMessage) => void;
};

export default function CliSender({ onMessageSent }: CliSenderProps) {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<ClippyCliMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  const sendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);

    try {
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
      setSentMessages((prev) => [message, ...prev.slice(0, 4)]); // Keep last 5 messages
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500 text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Send to CLI</CardTitle>
            <CardDescription>
              Send messages to connected CLI clients
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Recent Messages */}
        {sentMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">
              Recent Messages
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sentMessages.map((msg, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 break-words">
                      {msg.text}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white">
                    sent
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Area */}
        <div className="mt-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message to send to CLI..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
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
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
