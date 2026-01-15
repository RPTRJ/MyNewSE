package services

import (
	"sync"
	"github.com/gorilla/websocket"
)

var (
	// Map เก็บว่า User ID ไหน ใช้ Connection ตัวไหน (เช่น ID 1 -> connA)
	Clients = make(map[int]*websocket.Conn)
	// ตัวล็อคข้อมูลกันชนกัน (Mutex)
	WsMutex sync.Mutex
)

// ฟังก์ชันจำชื่อคนออนไลน์
func RegisterClient(userID int, conn *websocket.Conn) {
	WsMutex.Lock()
	defer WsMutex.Unlock()
	Clients[userID] = conn
}

// ฟังก์ชันลบชื่อเมื่อหลุด
func RemoveClient(userID int) {
	WsMutex.Lock()
	defer WsMutex.Unlock()
	delete(Clients, userID)
}

// ฟังก์ชันส่งข้อความหาคนๆ นั้น
func SendNotificationToUser(userID int, data interface{}) {
	WsMutex.Lock()
	conn, ok := Clients[userID]
	WsMutex.Unlock()

	if ok && conn != nil {
		// ส่งข้อมูล JSON ผ่านท่อไปเลย
		err := conn.WriteJSON(data)
		if err != nil {
			// ถ้าส่งไม่ผ่าน (เช่น เน็ตหลุด) ให้ลบชื่อออก
			conn.Close()
			RemoveClient(userID)
		}
	}
}