"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseLiveScoreOptions {
  matchId: string;
  onScoreUpdate?: (data: any) => void;
}

export function useLiveScore({ matchId, onScoreUpdate }: UseLiveScoreOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onScoreUpdateRef = useRef(onScoreUpdate);

  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const wsBase = typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_API_URL
          ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
          : "http://127.0.0.1:3001");

    const socket = io(`${wsBase}/live-scores`, {
      auth: { token: "" }, // public access by default
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // Optionally join a match-specific room
    });

    socket.on("SCORE_UPDATED", (data: any) => {
      if (data.matchId === matchId) {
        onScoreUpdateRef.current?.(data);
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("Live score connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect(); // server initiated, reconnect
      }
    });

    socketRef.current = socket;
  }, [matchId]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  return { socket: socketRef };
}
