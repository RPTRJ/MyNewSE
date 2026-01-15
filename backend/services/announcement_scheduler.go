package services

import (
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// เริ่ม Scheduler
func StartAnnouncementScheduler() {
	c := cron.New()

	// รันทุก 1 นาที
	_, err := c.AddFunc("@every 1m", PublishScheduledAnnouncements)
	if err != nil {
		log.Printf("Error setting up cron job: %v", err)
		return
	}

	c.Start()
	log.Println("📅 Announcement Scheduler started - checking every minute")

	// รันทันทีตอน start (ไม่ต้องรอ 1 นาที)
	go PublishScheduledAnnouncements()
}

// เผยแพร่ประกาศที่ถึงเวลาแล้ว
func PublishScheduledAnnouncements() {
	db := config.GetDB()

	// ใช้ timezone ของไทย
	location, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		location = time.UTC // ถ้าโหลด timezone ไม่ได้ใช้ UTC
	}
	now := time.Now().In(location)

	var announcements []entity.Announcement

	// หาประกาศที่:
	// 1. เวลา scheduled_publish_at ถึงหรือผ่านไปแล้ว
	// 2. ยังไม่มี published_at (ยังไม่ได้ publish)
	result := db.Where("scheduled_publish_at <= ? AND published_at IS NULL", now).
		Find(&announcements)

	if result.Error != nil {
		log.Printf("❌ Error fetching scheduled announcements: %v", result.Error)
		return
	}

	if len(announcements) == 0 {
		return // ไม่มีประกาศที่ต้อง publish
	}

	log.Printf("📢 Found %d announcement(s) to publish", len(announcements))

	// อัปเดตแต่ละประกาศ
	for _, announcement := range announcements {
		err := publishAnnouncement(db, &announcement, now)
		if err != nil {
			log.Printf("❌ Failed to publish announcement ID %d: %v", announcement.ID, err)
		} else {
			log.Printf("✅ Published announcement ID %d: %s", announcement.ID, announcement.Title)
		}
	}
}

// เผยแพร่ประกาศเดี่ยว
func publishAnnouncement(db *gorm.DB, announcement *entity.Announcement, now time.Time) error {

	err := db.Model(&entity.Announcement{}).
		Where("id = ? AND published_at IS NULL", announcement.ID).
		Updates(map[string]interface{}{
			"published_at": now,
			"status":       "PUBLISHED",
		}).Error

	if err != nil {
		return err
	}

	// ส่ง notification ถ้าเปิดใช้งาน
	if announcement.Send_Notification {
		go sendNotificationForAnnouncement(db, announcement, now)
	}

	return nil
}

// ส่ง notification (แยกเป็น goroutine เพื่อไม่ให้ block)
func sendNotificationForAnnouncement(db *gorm.DB, announcement *entity.Announcement, sentTime time.Time) {
	// สร้าง notification record ในฐานข้อมูล
	notification := entity.Notification{
		Notification_Title:   announcement.Title,
		Notification_Type:    "ANNOUNCEMENT",
		Notification_Message: announcement.Content,
		Is_Read:              false,
		Sent_At:              &sentTime,
		AnnouncementID:       &announcement.ID,
		// UserID: nil, // ถ้าต้องการส่งให้ user เฉพาะคน ให้ใส่ UserID ที่นี่
	}

	err := db.Create(&notification).Error
	if err != nil {
		log.Printf("❌ Failed to create notification for announcement ID %d: %v",
			announcement.ID, err)
	} else {
		log.Printf("📬 Notification created for announcement ID %d", announcement.ID)
	}
}
