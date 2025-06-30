import { WebSocketServer, WebSocket } from "ws";
import { sub } from "../config/redis";
import { Server } from "http";

const clients = new Map<WebSocket, Set<string>>();

// upgrade this to static instance
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    let userChannels = new Set<string>();

    ws.on("message", (msg: string) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === "subscribe" && Array.isArray(data.channels)) {
          userChannels = new Set(data.channels);
          clients.set(ws, userChannels);
        }
        if (data.type === "unsubscribe" && Array.isArray(data.channels)) {
          data.channels.forEach((channel: string) => {
            if (userChannels.has(channel)) {
              userChannels.delete(channel);
            }
          });
          if (userChannels.size === 0) {
            clients.delete(ws);
          } else {
            clients.set(ws, userChannels);
          }
        }
      } catch (err) {
        console.error("Invalid message format", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  sub.pSubscribe("*", (message, channel) => {
    for (const [ws, channels] of clients.entries()) {
      if (channels.has(channel)) {
        ws.send(JSON.stringify({ channel, message }));
      }
    }
  });

  sub.unsubscribe("*", (err) => {
    if (err) {
      console.error("Error unsubscribing from Redis channels:", err);
    } else {
      console.log("Unsubscribed from all Redis channels");
    }
  }
  );
}