package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// StartNotificationScheduler เริ่มต้นการทำงานของ Scheduler (เรียกใช้ใน main.go)
func StartNotificationScheduler() {
	fmt.Println("⏰ Notification Scheduler Started...")
	// เช็คทุกๆ 10 วินาที เพื่อความแม่นยำในการจับนาทีสุดท้าย
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			CheckApplicationDeadlines()
		}
	}()
}

// CheckApplicationDeadlines ฟังก์ชันหลักสำหรับตรวจสอบเวลา
func CheckApplicationDeadlines() {
	db := config.GetDB()
	var selections []entity.Selection

	// ✅ 1. Preload Curriculum และ Program เพื่อเอาชื่อสาขามาแสดง
	// ดึงเฉพาะคนที่เปิดการแจ้งเตือนไว้ (is_notified = true)
	if err := db.Preload("Curriculum").Preload("Curriculum.Program").Where("is_notified = ?", true).Find(&selections).Error; err != nil {
		fmt.Println("Scheduler Error:", err)
		return
	}

	now := time.Now()

	for _, s := range selections {
		// เช็คความสมบูรณ์ของข้อมูล (กัน Nil Pointer Exception)
		if s.Curriculum == nil {
			continue
		}

		// 2. แกะวันที่จาก ApplicationPeriod ("Start|End")
		rawPeriod := s.Curriculum.ApplicationPeriod
		parts := strings.Split(rawPeriod, "|")
		if len(parts) < 2 {
			continue
		}

		dateStr := strings.TrimSpace(parts[1])
		var endDate time.Time
		var err error

		// 3. แปลงวันที่ (Parse Date) ให้รองรับ Format ของคุณและเวลาไทย
		endDate, err = time.ParseInLocation("2006-01-02T15:04", dateStr, time.Local)
		if err != nil {
			endDate, err = time.ParseInLocation("2006-01-02T15:04:05", dateStr, time.Local)
			if err != nil {
				endDate, err = time.Parse(time.RFC3339, dateStr)
			}
		}

		// ถ้าแปลงวันที่ไม่ได้ ให้ข้ามไป
		if err != nil {
			continue
		}

		// 4. คำนวณเวลาที่เหลือ
		timeLeft := endDate.Sub(now)
		minutesLeft := int(timeLeft.Minutes())
		secondsLeft := int(timeLeft.Seconds()) % 60

		// ✅ เงื่อนไข Trigger: เช็คเฉพาะช่วงต้นนาที (0-15 วินาทีแรก)
		isTriggerTime := secondsLeft >= 0 && secondsLeft <= 15

		// ถ้าเลยกำหนดเวลาไปแล้ว หรือยังไม่ถึงเวลาแจ้งเตือน ก็ข้าม
		if minutesLeft < 0 || !isTriggerTime {
			continue
		}

		// ✅ 5. เตรียมข้อความแจ้งเตือน
		displayName := "ไม่ระบุสาขา"
		if s.Curriculum.Program != nil {
			displayName = s.Curriculum.Program.Name
		}

		var message string
		var title string

		// Logic 7, 3, 1 นาที
		if minutesLeft == 7 {
			title = "⏳ เหลือเวลาอีก 7 นาที!"
			message = fmt.Sprintf("รีบเลย! สาขา '%s' จะปิดรับสมัครในอีก 7 นาที", displayName)
		} else if minutesLeft == 3 {
			title = "⚠️ เหลือเวลาอีก 3 นาที!"
			message = fmt.Sprintf("เตือนครั้งที่ 2! สาขา '%s' ใกล้ปิดรับสมัครแล้ว", displayName)
		} else if minutesLeft == 1 {
			title = "🔥 นาทีสุดท้าย!"
			message = fmt.Sprintf("ด่วนที่สุด! สาขา '%s' เหลือเวลาอีก 1 นาทีสุดท้าย", displayName)
		}

		// 6. บันทึกลงฐานข้อมูล (ถ้าเข้าเงื่อนไข)
		if message != "" {
			var count int64
			db.Model(&entity.Notification{}).
				Where("user_id = ? AND notification_message = ? AND created_at > ?",
					s.UserID, message, now.Add(-2*time.Minute)).
				Count(&count)

			if count == 0 {
				noti := entity.Notification{
					Notification_Title:   title,
					Notification_Type:    "Reminder",
					Notification_Message: message,
					Is_Read:              false,
					Sent_At:              &now,
					Created_At:           now,
					UserID:               &s.UserID,
				}

				if err := db.Create(&noti).Error; err == nil {
					fmt.Printf("✅ Saved DB: User %d\n", s.UserID)

					// ✅✅✅ ส่ง Notification ผ่าน WebSocket ทันที ✅✅✅
					// (ต้องมีไฟล์ websocket_manager.go ใน package services ด้วยนะ)
					SendNotificationToUser(int(s.UserID), map[string]interface{}{
						"id":                   noti.ID,
						"notification_title":   noti.Notification_Title,
						"notification_message": noti.Notification_Message,
						"created_at":           noti.Created_At,
					})

				} else {
					fmt.Println("❌ Error creating notification:", err)
				}
			}
		}
	}
}