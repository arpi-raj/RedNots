// src/hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { userSubscriptionsAtom } from "../atoms/userAtoms";

export const useSocket = () => {
  const subscriptions = useRecoilValue(userSubscriptionsAtom);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      const payload = {
        subscriptions: subscriptions.map((sub) => sub._id), // or .id if needed
      };
      socket.send(JSON.stringify(payload));
      console.log("Sent to server:", payload);
    });

    socket.addEventListener("message", (event) => {
      console.log("Received from server:", event.data);
    });

    return () => {
      socket.close();
    };
  }, [subscriptions]);

  return socketRef.current;
};
