"use client";

import { useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    let retryDelay = 3000; // Start with 3s delay

    const connect = () => {
      if (!isMounted) return;

      // 1. Get User ID from LocalStorage
      let currentUserId = 0;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          currentUserId = u.ID || u.id || 0;
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }

      if (!currentUserId) {
        // If no user, retry later (maybe login happens later)
        console.log("❌ No User ID found, skipping WebSocket connection.");
        return;
      }

      // 2. Connect
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
      const wsUrl = `${baseUrl}?user_id=${currentUserId}`;

      console.log(`Connecting to WebSocket: ${baseUrl} (User: ${currentUserId})`);

      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) {
          socket?.close();
          return;
        }
        console.log("✅ WebSocket Connected");
        retryDelay = 3000; // Reset delay on success
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          const message = data.notification_message || data.message || data.Notification_Message || event.data;
          const title = data.notification_title || data.title || data.Notification_Title || "แจ้งเตือนใหม่";
          const id = data.ID || data.id;

          toast((t) => (
            <div className="flex flex-col relative pr-4 min-w-[250px]">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="absolute -top-1 -right-2 text-gray-400 hover:text-red-500 font-bold p-1 rounded-full"
              >✕</button>
              <span className="font-bold text-sm text-gray-800 mb-1">{title}</span>
              <span className="text-sm text-gray-600 leading-snug">{message}</span>
            </div>
          ), {
            id: `noti-${id || Date.now()}`,
            duration: Infinity,
            position: 'top-right',
            style: {
              borderLeft: '4px solid #FFA500',
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '12px 16px'
            },
          });

          // Allow other components to refresh data
          window.dispatchEvent(new Event("refresh_data"));

          // Optional: Mark as read immediately
          if (id) markNotificationReadAPI(id);
        } catch (e) {
          toast(event.data, {
            icon: '🔔',
            duration: Infinity
          });
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log(`❌ WebSocket Disconnected. Retrying in ${retryDelay / 1000}s...`);

        // Exponential backoff
        // Cap at 30 seconds
        reconnectTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          connect();
        }, retryDelay);
      };

      socket.onerror = (err) => {
        // Error will trigger onclose, so we don't need to double-handle reconnect here usually,
        // but explicit close ensures onclose fires.
        socket?.close();
      };
    };

    // Initial connection attempt
    // Small delay to ensure client-side hydration or auth is ready
    const timer = setTimeout(() => connect(), 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return null;
}