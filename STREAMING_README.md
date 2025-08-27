# Clippy Web - Streaming Text Input

A simple experiment to stream text from a CLI tool to a Next.js web interface in real-time using Server-Sent Events (SSE).

## How It Works

1. **Next.js API Route** (`/api/clippy`) handles two types of requests:

   - `GET`: Establishes an SSE connection for real-time updates
   - `POST`: Receives text from CLI tools and broadcasts to all connected clients

2. **Web Interface** (`/`) connects to the SSE endpoint and displays streamed messages in real-time

3. **CLI Tools** send HTTP POST requests with JSON payloads to the API endpoint

## Getting Started

### 1. Start the Next.js Server

```bash
npm run dev
```

The server will be available at `http://localhost:3000`

### 2. Open the Web Interface

Open `http://localhost:3000` in your browser. You should see:

- Connection status indicator
- Live message stream area
- Usage instructions

### 3. Send Messages from CLI

#### Option A: Using the provided Node.js script

```bash
node test-cli.js "Hello from CLI!"
```

#### Option B: Using the PowerShell script (Windows)

```powershell
.\test-cli.ps1 "Hello from PowerShell!"
```

#### Option C: Using curl

```bash
curl -X POST http://localhost:3000/api/clippy \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from curl!"}'
```

#### Option D: Using PowerShell Invoke-RestMethod

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/clippy" `
  -Method POST -ContentType "application/json" `
  -Body '{"text": "Hello from PowerShell!"}'
```

## API Reference

### POST /api/clippy

Send a text message to be streamed to all connected clients.

**Request Body:**

```json
{
  "text": "Your message here"
}
```

**Response:**

```json
{
  "success": true,
  "connections": 1
}
```

### GET /api/clippy

Establish a Server-Sent Events connection to receive real-time messages.

**Response Headers:**

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

**Event Data Format:**

```json
{
  "text": "Message content",
  "timestamp": 1640995200000,
  "type": "message"
}
```

## Features

- ✅ Real-time text streaming using Server-Sent Events
- ✅ Multiple client connections supported
- ✅ Connection status indicators
- ✅ Message timestamps
- ✅ Auto-scrolling message history
- ✅ Clear messages functionality
- ✅ Cross-platform CLI examples
- ✅ Responsive web interface

## Architecture

```
CLI Tool ──POST──> Next.js API Route ──SSE──> Web Browser
                        │
                        └──> Broadcasts to all connected clients
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── clippy/
│   │       └── route.ts          # SSE server + POST handler
│   ├── page.tsx                  # Web interface
│   ├── layout.tsx               # App layout
│   └── globals.css              # Styles
├── test-cli.js                  # Node.js test script
└── test-cli.ps1                 # PowerShell test script
```

## Customization

### Adding Authentication

To add authentication, modify the API route to check for valid tokens:

```typescript
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth || !isValidToken(auth)) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... rest of the code
}
```

### Message Persistence

To persist messages, add a database or in-memory store:

```typescript
const messageHistory: StreamMessage[] = [];

// In POST handler
messageHistory.push({ text, timestamp: Date.now() });

// In GET handler (send history to new connections)
messageHistory.forEach((message) => {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
});
```

### Message Filtering

Add message types or channels:

```typescript
interface StreamMessage {
  text: string;
  timestamp: number;
  type?: "info" | "warning" | "error";
  channel?: string;
}
```

## Troubleshooting

### "Connection failed" or messages not appearing

1. Ensure the Next.js server is running on `http://localhost:3000`
2. Check browser developer tools for SSE connection errors
3. Verify the API endpoint is accessible

### CORS Issues

If sending requests from a different domain, add CORS headers to the API route:

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### Performance

- Connection cleanup happens automatically when clients disconnect
- Consider adding rate limiting for production use
- Monitor memory usage with many concurrent connections

## Next Steps

This is a simple experiment. For production use, consider:

- Adding authentication and authorization
- Implementing proper error handling and retry logic
- Using a message queue (Redis, etc.) for scalability
- Adding message persistence
- Implementing proper logging and monitoring
- Rate limiting and abuse prevention
