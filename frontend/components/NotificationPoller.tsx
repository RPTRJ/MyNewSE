"use client";

import { useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // ใช้ Timeout 100ms เพื่อรอให้ Client Mount สมบูรณ์
    const timeoutId = setTimeout(() => {
        const connect = () => {
          // 1. ดึง User ID จาก LocalStorage
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
            return; // ไม่มี User ไม่ต้องเชื่อมต่อ
          }

          // 2. กำหนด URL ตามสภาพแวดล้อม (Auto-detect Production)
          let baseUrl = process.env.NEXT_PUBLIC_WS_URL;

          if (!baseUrl) {
             if (typeof window !== "undefined") {
                 if (window.location.hostname === "sutportfolio.online") {
                     // Production: ใช้ wss:// (Secure)
                     baseUrl = "wss://sutportfolio.online/ws"; 
                 } else {
                     // Development: ใช้ ws:// (Local)
                     baseUrl = "ws://localhost:8080/ws";
                 }
             }
          }

          const wsUrl = `${baseUrl}?user_id=${currentUserId}`;
          console.log("Connecting to WebSocket:", wsUrl);
          
          const socket = new WebSocket(wsUrl);
          socketRef.current = socket;

          socket.onopen = () => {
            console.log("✅ WebSocket Connected");
          };

          socket.onmessage = (event) => {
             try {
                const data = JSON.parse(event.data);
                // รองรับโครงสร้างข้อมูลที่หลากหลาย
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
                    duration: Infinity, // ✅ แจ้งเตือนค้างจนกว่าจะกดปิด
                    position: 'top-right',
                    style: { 
                        borderLeft: '4px solid #FFA500', 
                        background: '#fff', 
                        color: '#333', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        padding: '12px 16px' 
                    },
                });
                
                // Trigger ให้ Component อื่นรีเฟรชข้อมูล
                window.dispatchEvent(new Event("refresh_data"));
                
                // ❌ ปิดการ Mark Read อัตโนมัติ (เพื่อให้ User เห็นจุดแดงค้างไว้)
                // if (id) markNotificationReadAPI(id); 

            } catch (e) {
                // กรณีข้อความไม่ใช่ JSON (Plain Text)
                toast(event.data, { 
                    icon: '🔔',
                    duration: Infinity
                });
            }
          };

          socket.onclose = () => {
            if (socketRef.current) {
                // ลองต่อใหม่ใน 3 วินาที
                setTimeout(() => connect(), 3000);
            }
          };

          socket.onerror = (err) => {
            socket.close();
          };
        };
        
        connect();
    }, 100); 

    // Cleanup เมื่อ Component ถูกทำลาย
    return () => {
      clearTimeout(timeoutId);
      if (socketRef.current) {
        const socket = socketRef.current;
        socketRef.current = null; 
        socket.close();
      }
    };
  }, []);

  return null;
}