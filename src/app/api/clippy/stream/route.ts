// Store for CLI connections
const cliConnections = new Set<ReadableStreamDefaultController<Uint8Array>>();

// GET endpoint for CLI SSE connection
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add this CLI connection to our set
      cliConnections.add(controller);

      // Send a connection confirmation message
      const connectionConfirm = `data: ${JSON.stringify({
        type: "connection-established",
        timestamp: Date.now(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionConfirm));

      console.log(
        `📡 CLI connected to stream (${cliConnections.size} total connections)`
      );
    },
    cancel(controller) {
      // Clean up when stream is cancelled
      cliConnections.delete(controller);
      console.log(
        `📡 CLI disconnected from stream (${cliConnections.size} total connections)`
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// POST endpoint for web to send messages to CLI
export async function POST(request: Request) {
  try {
    const messageData = await request.json();

    // Validate message has required fields
    if (!messageData.type) {
      return new Response(
        JSON.stringify({ error: "Message type is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Broadcast message to all connected CLI clients
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify({
      ...messageData,
      timestamp: messageData.timestamp ?? Date.now(),
    })}\n\n`;

    cliConnections.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        // Remove broken connections
        cliConnections.delete(controller);
      }
    });

    console.log(
      `📤 Sent message to ${cliConnections.size} CLI connections:`,
      messageData.type
    );

    return new Response(
      JSON.stringify({
        success: true,
        cliConnections: cliConnections.size,
        messageType: messageData.type,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error processing CLI message:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
