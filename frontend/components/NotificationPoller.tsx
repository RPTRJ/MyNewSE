"use client";

import { useEffect, useRef, useCallback } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef(3000);

  const connect = useCallback(() => {
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

    // 2. Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // 3. Build WebSocket URL dynamically from window.location
    let wsUrl: string;
    if (typeof window !== 'undefined') {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${window.location.host}/api/ws?user_id=${currentUserId}`;
    } else {
      wsUrl = `ws://localhost/api/ws?user_id=${currentUserId}`;
    }

    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("✅ WebSocket Connected!");
        retryDelayRef.current = 3000;
      };

      socket.onmessage = (event) => {
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
          toast(event.data, { icon: '🔔', duration: Infinity });
        }
      };

      socket.onclose = (event) => {
        console.log(`❌ WebSocket Disconnected. Retrying in ${retryDelayRef.current / 1000}s...`);
        socketRef.current = null;

        reconnectTimeoutRef.current = setTimeout(() => {
          retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 30000);
          connect();
        }, retryDelayRef.current);
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
        socket.close();
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket:", error);
      reconnectTimeoutRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 30000);
        connect();
      }, retryDelayRef.current);
    }
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(() => connect(), 500);

    return () => {
      clearTimeout(initTimer);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return null;
}