"use client";

import { useEffect, useRef } from "react";
import toast from 'react-hot-toast';
import { markNotificationReadAPI } from "@/services/curriculum";

export default function NotificationSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // ใช้ Timeout เพื่อรอให้ React Mount เสร็จชัวร์ๆ ก่อนค่อยต่อ (แก้ปัญหา Strict Mode)
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
            console.log("❌ No User ID found, skipping WebSocket connection.");
            return;
          }

          // 2. ส่ง user_id ไปกับ URL
          const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";
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
                    
                    // ✅✅✅ แก้ตรงนี้: เปลี่ยน 5000 เป็น Infinity ✅✅✅
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
                
                // สั่งรีเฟรชข้อมูลส่วนอื่น
                window.dispatchEvent(new Event("refresh_data"));
                
                // Mark as read (ถ้าต้องการให้เด้งแล้วถือว่าอ่านเลย ก็เปิดบรรทัดนี้ได้)
                if (id) markNotificationReadAPI(id); 
            } catch (e) {
                // กรณีส่งข้อความธรรมดา (ไม่ใช่ JSON)
                toast(event.data, { 
                    icon: '🔔',
                    duration: Infinity // ✅ ตั้ง Infinity ตรงนี้ด้วย
                });
            }
          };

          socket.onclose = () => {
            console.log("❌ WebSocket Disconnected. Retrying in 3s...");
            if (socketRef.current) {
                setTimeout(() => connect(), 3000);
            }
          };

          socket.onerror = (err) => {
            socket.close();
          };
        };
        
        connect();
    }, 100); 

    // Cleanup
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