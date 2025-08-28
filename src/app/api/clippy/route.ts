import { ClippyCliMessage } from "@/lib/types/clippy-cli/clippy-cli-message";

// Store for active SSE connections
const connections = new Set<ReadableStreamDefaultController<Uint8Array>>();

// POST endpoint for CLI to send text
export async function POST(request: Request) {
  console.log("Received POST request: ", request);
  try {
    const messageData: ClippyCliMessage = await request.json();

    // Validate that required fields are present based on message type
    // Allow typing and clear messages without text content
    if (!messageData.text && messageData.type !== "clear" && messageData.type !== "typing") {
      return new Response(
        JSON.stringify({ error: "Text is required for non-clear/non-typing messages" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Broadcast the complete message to all connected SSE clients
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
      ...messageData,
      timestamp: messageData.timestamp ?? Date.now(), // Ensure timestamp is always present
    })}\n\n`;

    connections.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        // Remove broken connections
        connections.delete(controller);
      }
    });

    return new Response(
      JSON.stringify({ success: true, connections: connections.size }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET endpoint for SSE connection
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);

      // Send a lightweight connection confirmation message
      // This ensures the browser recognizes the connection as established
      const connectionConfirm = `data: ${JSON.stringify({
        type: "connection-established",
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionConfirm));

      // Note: In a real application, you'd want to handle connection cleanup better
      // This is a simplified version for local experimentation
    },
    cancel(controller) {
      // Clean up when stream is cancelled
      connections.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
