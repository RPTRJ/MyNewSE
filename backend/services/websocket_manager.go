package services

import (
	"sync"
	"github.com/gorilla/websocket"
)

var (
	// Map เก็บว่า User ID ไหน ใช้ Connection ตัวไหน (เช่น ID 1 -> connA)
	Clients = make(map[int]*websocket.Conn)
	// ตัวล็อคข้อมูลป้องกันการแย่งกันเขียน (Mutex)
	WsMutex sync.Mutex
)

// RegisterClient: จำชื่อคนออนไลน์
func RegisterClient(userID int, conn *websocket.Conn) {
	WsMutex.Lock()
	defer WsMutex.Unlock()
	Clients[userID] = conn
}

// RemoveClient: ลบชื่อเมื่อหลุด
func RemoveClient(userID int) {
	WsMutex.Lock()
	defer WsMutex.Unlock()
	
	// ปิด Connection ก่อนลบ (เพื่อความชัวร์)
	if conn, ok := Clients[userID]; ok {
		conn.Close()
	}
	delete(Clients, userID)
}

// SendNotificationToUser: ฟังก์ชันส่งข้อความหาคนๆ นั้น (Controller อื่นเรียกใช้ได้)
func SendNotificationToUser(userID int, data interface{}) {
	WsMutex.Lock()
	conn, ok := Clients[userID]
	WsMutex.Unlock()

	if ok && conn != nil {
		// ส่งข้อมูล JSON ผ่าน WebSocket
		err := conn.WriteJSON(data)
		if err != nil {
			// ถ้าส่งไม่ผ่าน (เช่น เน็ตหลุดแต่ยังไม่รู้ตัว) ให้ลบชื่อออก
			conn.Close()
			RemoveClient(userID)
		}
	}
}