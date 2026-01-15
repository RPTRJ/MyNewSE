package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"         
	"github.com/gorilla/websocket"
	"github.com/sut68/team14/backend/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocketHandler รับการเชื่อมต่อ
func WebSocketHandler(c *gin.Context) {
	// 1. รับ User ID ที่ส่งมาจาก Frontend
	userIDStr := c.Query("user_id")
	userID, err := strconv.Atoi(userIDStr)

	// ถ้าไม่ส่ง ID มา หรือแปลงไม่ได้ ให้ Reject
	if err != nil || userID == 0 {
		fmt.Println("❌ WebSocket Rejected: No user_id")
		c.JSON(400, gin.H{"error": "User ID is required"})
		return
	}

	// 2. Upgrade HTTP -> WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}
	// ข้อควรระวัง: อย่าเพิ่ง defer conn.Close() ตรงนี้ทันที

	fmt.Printf("✅ User %d connected via WebSocket\n", userID)

	// 3. ลงทะเบียนเข้าสมุดรายชื่อ (เพื่อให้ระบบ Test Noti หาเจอ)
	services.RegisterClient(userID, conn)

	// 4. วนลูปเพื่อเลี้ยง Connection ไว้ (Keep Alive)
	for {
		// รอรับข้อความ
		_, _, err := conn.ReadMessage()
		if err != nil {
			fmt.Printf("❌ User %d disconnected\n", userID)
			// 5. ถ้าหลุด ให้ลบชื่อออก
			services.RemoveClient(userID)
			break
		}
	}
}