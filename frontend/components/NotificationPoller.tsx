"use client";

import { useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

/**
 * สร้าง WebSocket URL แบบ dynamic
 * - Development: ws://localhost:8080/ws
 * - Production: wss://sutportfolio.online/api/ws
 */
function getWebSocketUrl(): string {
  // 1. ถ้ามี environment variable ให้ใช้อันนั้น
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // 2. Server-side: fallback
  if (typeof window === 'undefined') {
    return "ws://localhost:8080/ws";
  }

  // 3. Client-side: สร้าง URL แบบ dynamic จาก window.location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // ตรวจสอบว่าเป็น production หรือ development
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalhost) {
    // Development: connect to backend โดยตรง
    return "ws://localhost:8080/ws";
  } else {
    // Production: connect ผ่าน nginx proxy
    return `${protocol}//${host}/api/ws`;
  }
}

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    let retryDelay = 3000;

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
        console.log("❌ No User ID found, skipping WebSocket connection.");
        return;
      }

      // 2. Connect using dynamic URL
      const baseUrl = getWebSocketUrl();
      const wsUrl = `${baseUrl}?user_id=${currentUserId}`;

      console.log(`🔌 Connecting to WebSocket: ${baseUrl} (User: ${currentUserId})`);

      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) {
          socket?.close();
          return;
        }
        console.log("✅ WebSocket Connected");
        retryDelay = 3000;
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

          window.dispatchEvent(new Event("refresh_data"));

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

        reconnectTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 30000);
          connect();
        }, retryDelay);
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        socket?.close();
      };
    };

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
