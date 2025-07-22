import { WebSocketServer, WebSocket } from "ws";
import { sub } from "../config/redis";
import { Server } from "http";

// Map each WebSocket client to their subscription details
const clients = new Map<WebSocket, Set<string>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    // Temporary until client sends subscription info
    clients.set(ws, new Set());

    // When the client sends a message with its id and subscriptions
    ws.on("message", (data) => {
  console.log("Received from client:", data.toString()); // <-- Add this for debug

  try {
    const parsed = JSON.parse(data.toString());

    if (parsed.subscriptions && Array.isArray(parsed.subscriptions)) {
      const channels = new Set<string>(parsed.subscriptions);
      clients.set(ws, channels);
      console.log(`Client subscribed to: ${[...channels].join(", ")}`);
    }
  } catch (err) {
    console.error("Invalid message from client:", err);
  }
});


    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  // Forward Redis messages to subscribed clients
  sub.pSubscribe("*", (message, channel) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      parsedMessage = message;
    }

    for (const [ws, channels] of clients.entries()) {
      if (channels.has(channel) && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ channel, ...parsedMessage }));
      }
    }
  });
}
