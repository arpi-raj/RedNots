import { WebSocketServer, WebSocket } from "ws";
import { sub } from "../config/redis";
import { Server } from "http";

// Map each WebSocket client to their set of subscribed channel IDs
const clients = new Map<WebSocket, Set<string>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  // When a new client connects, initialize their subscription set
  wss.on("connection", (ws: WebSocket) => {
    clients.set(ws, new Set());

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  // Forward Redis-published messages to subscribed clients
  sub.pSubscribe("*", (message, channel) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      parsedMessage = message;
    }

    // For each client, check if they're subscribed to this channel
    for (const [ws, channels] of clients.entries()) {
      if (channels.has(channel) && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ channel, ...parsedMessage }));
      }
    }
  });
}
