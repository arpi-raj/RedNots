import { useEffect, useRef } from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import { channelNotificationCountState, userSubscriptionsAtom } from "../atoms/userAtoms";

// Singleton WebSocket manager to prevent multiple connections
class SocketManager {
  private static instance: SocketManager;
  private socket: WebSocket | null = null;
  private subscribers: Set<(socket: WebSocket | null) => void> = new Set();
  private subscriptions: string[] = [];
  private isConnecting = false;

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  subscribe(callback: (socket: WebSocket | null) => void) {
    this.subscribers.add(callback);
    callback(this.socket); // Immediately call with current socket
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.socket));
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || 
        this.socket?.readyState === WebSocket.CONNECTING || 
        this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.socket = new WebSocket("ws://localhost:3001");
      
      this.socket.addEventListener("open", () => {
        this.isConnecting = false;
        this.sendSubscriptions();
        this.notifySubscribers();
      });

      this.socket.addEventListener("close", (event) => {
        this.isConnecting = false;
        this.socket = null;
        this.notifySubscribers();
        
        // Reconnect on unexpected closure
        if (event.code !== 1000 && this.subscribers.size > 0) {
          setTimeout(() => this.connect(), 3000);
        }
      });

      this.socket.addEventListener("error", () => {
        this.isConnecting = false;
      });

      this.notifySubscribers();
    } catch (error) {
      this.isConnecting = false;
    }
  }

  updateSubscriptions(newSubscriptions: string[]) {
    this.subscriptions = newSubscriptions;
    this.sendSubscriptions();
  }

  private sendSubscriptions() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = { subscriptions: this.subscriptions };
      console.log("Sending subscriptions:", payload);
      this.socket.send(JSON.stringify(payload));
    }
  }

  addMessageListener(listener: (event: MessageEvent) => void) {
    if (this.socket) {
      this.socket.addEventListener("message", listener);
    }
    return () => {
      if (this.socket) {
        this.socket.removeEventListener("message", listener);
      }
    };
  }

  disconnect() {
    if (this.subscribers.size === 0 && this.socket) {
      this.socket.close(1000, "No more subscribers");
      this.socket = null;
      this.notifySubscribers();
    }
  }
}

export const useSocket = () => {
  const subscriptions = useRecoilValue(userSubscriptionsAtom);
  const socketRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const handleChannelNotification = useRecoilCallback(
    ({ set }) =>
      (data: any) => {
        const channelId = data.channel;
        set(channelNotificationCountState(channelId), (count = 0) => count + 1);
      },
    []
  );

  useEffect(() => {
    const manager = SocketManager.getInstance();
    
    // Subscribe to socket changes
    const unsubscribeFromSocket = manager.subscribe((socket) => {
      socketRef.current = socket;
    });
    cleanupRef.current.push(unsubscribeFromSocket);

    // Add message listener
    const messageListener = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket data:", data);
        handleChannelNotification(data);
      } catch (error) {
        console.error("Malformed WebSocket data:", event.data, error);
      }
    };

    const unsubscribeFromMessages = manager.addMessageListener(messageListener);
    cleanupRef.current.push(unsubscribeFromMessages);

    // Connect
    manager.connect();

    return () => {
      // Run all cleanup functions
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
      
      // Disconnect if no more subscribers (with small delay)
      setTimeout(() => {
        manager.disconnect();
      }, 100);
    };
  }, [handleChannelNotification]);

  // Update subscriptions when they change
  useEffect(() => {
    const manager = SocketManager.getInstance();
    manager.updateSubscriptions(subscriptions.map(sub => sub._id));
  }, [subscriptions]);

  return socketRef.current;
};