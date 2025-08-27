#!/usr/bin/env node

/**
 * Simple CLI test script for the Clippy Web streaming feature
 * Usage: node test-cli.js "Your message here"
 *
 * Make sure to run: npm install node-fetch (if needed)
 * Or use the built-in fetch in Node.js 18+
 */

const API_URL = "http://localhost:3000/api/clippy";

async function sendMessage(text) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Error:", error);
      return false;
    }

    const result = await response.json();
    console.log("✅ Message sent successfully!");
    console.log(`📡 Active connections: ${result.connections}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send message:", error.message);
    console.log(
      "💡 Make sure your Next.js server is running on http://localhost:3000"
    );
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🎯 Clippy CLI - Send messages to your web interface!");
    console.log('📝 Usage: node test-cli.js "Your message here"');
    console.log("💻 Make sure http://localhost:3000 is open in your browser");
    console.log("");
    console.log("� Examples:");
    console.log('  node test-cli.js "Hello from CLI!"');
    console.log('  node test-cli.js "This is a test message"');
    console.log('  node test-cli.js "Real-time streaming works!"');
    process.exit(1);
  }

  const message = args.join(" ");
  console.log(`📤 Sending: "${message}"`);
  const success = await sendMessage(message);
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
