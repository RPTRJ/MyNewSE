package controller

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

type CreateAnnouncementInput struct {
	Title                string  `json:"title" `
	Content              string  `json:"content" `
	Is_Pinned            *bool    `json:"is_pinned"`
	Scheduled_Publish_At *string `json:"scheduled_publish_at" `
	Expires_At           *string `json:"expires_at"`
	Send_Notification    bool    `json:"send_notification"`
	CetagoryID           uint    `json:"cetagory_id" `
	Status               string  `json:"status"`
}


// ================= CREATE =================
func CreateAnnouncement(c *gin.Context) {
	var input CreateAnnouncementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}


	if input.Status == "" {
		input.Status = "DRAFT"
	}

	userIDRaw, _ := c.Get("user_id")
	uid := userIDRaw.(uint)

	var scheduledAt *time.Time
	var publishedAt *time.Time

	var expiresAt *time.Time
	if input.Expires_At != nil && *input.Expires_At != "" {
		t, err := time.Parse("2006-01-02T15:04", *input.Expires_At)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid expires_at format",
			})
			return
		}
		expiresAt = &t
	}


	switch input.Status {

	case "PUBLISHED":
		now := time.Now()
		publishedAt = &now
		scheduledAt = &now

	case "SCHEDULED":
		if input.Scheduled_Publish_At == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "scheduled_publish_at is required for scheduled publish",
			})
			return
		}
		t, err := time.Parse("2006-01-02T15:04", *input.Scheduled_Publish_At)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scheduled_publish_at format"})
			return
		}
		scheduledAt = &t
		publishedAt = nil

	case "DRAFT":
		// ไม่ต้องตั้งเวลา

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}

	announcement := entity.Announcement{
		Title:                input.Title,
		Content:              input.Content,
		Is_Pinned:            input.Is_Pinned,
		Status:               input.Status,
		Scheduled_Publish_At: scheduledAt,
		Published_At:         publishedAt,
		Expires_At:           expiresAt,
		Send_Notification:    input.Send_Notification,
		UserID:               uid,
		CetagoryID:           input.CetagoryID,
	}

	if err := config.GetDB().Create(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, announcement)
}


// ================= READ ALL =================
func GetAdminAnnouncements(c *gin.Context) {
	db := config.GetDB()
	var announcements []entity.Announcement

	// เวลาไทย
	location, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(location)

	// 🔥 อัปเดตสถานะ EXPIRED ก่อน
	db.Model(&entity.Announcement{}).
		Where("expires_at IS NOT NULL").
		Where("expires_at <= ? AND status != ?", now, "EXPIRED").
		Update("status", "EXPIRED")

	status := c.Query("status")

	query := db.Preload("User").Preload("Cetagory")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.
		Order("is_pinned DESC, scheduled_publish_at DESC").
		Find(&announcements).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func GetAnnouncements(c *gin.Context) {
	db := config.GetDB()
	var announcements []entity.Announcement

	// เวลาไทย
	location, _ := time.LoadLocation("Asia/Bangkok")
	now := time.Now().In(location)

	err := db.
		Preload("User").
		Preload("Cetagory").
		Where("status = ?", "PUBLISHED").
		Where("published_at <= ?", now).
		Where("(expires_at IS NULL OR expires_at > ?)", now).
		Order("is_pinned DESC").
		Order("published_at DESC").
		Find(&announcements).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

// ================= READ ONE =================
func GetAnnouncementByID(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	var announcement entity.Announcement
	if err := db.
		Preload("User").
		Preload("Cetagory").
		First(&announcement, id).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
		return
	}

	c.JSON(http.StatusOK, announcement)
}

// ================= UPDATE =================
func UpdateAdminAnnouncement(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	var announcement entity.Announcement
	if err := db.First(&announcement, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
		return
	}

	var input CreateAnnouncementInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ===== STATUS (อัปเดตเฉพาะถ้าส่งมา) =====
	if input.Status != "" {
		switch input.Status {
		case "PUBLISHED":
			if announcement.Published_At == nil {
				now := time.Now()
				announcement.Status = "PUBLISHED"
				announcement.Published_At = &now
				announcement.Scheduled_Publish_At = &now
			}

		case "SCHEDULED":
			if input.Scheduled_Publish_At == nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "scheduled_publish_at is required for scheduled publish",
				})
				return
			}
			t, err := time.Parse("2006-01-02T15:04", *input.Scheduled_Publish_At)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scheduled_publish_at format"})
				return
			}
			announcement.Status = "SCHEDULED"
			announcement.Scheduled_Publish_At = &t
			announcement.Published_At = nil

		case "DRAFT":
			announcement.Status = "DRAFT"
			announcement.Published_At = nil
			announcement.Scheduled_Publish_At = nil


		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}
	}

		if input.Expires_At != nil {
			if *input.Expires_At == "" {
				announcement.Expires_At = nil
			} else {
				t, err := time.Parse("2006-01-02T15:04", *input.Expires_At)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "invalid expires_at format",
					})
					return
				}
				announcement.Expires_At = &t
			}
		}

	// ===== FIELD อื่น ๆ (อัปเดตได้เสมอ) =====
	if input.Title != "" {
		announcement.Title = input.Title
	}

	if input.Content != "" {
		announcement.Content = input.Content
	}

	if input.Is_Pinned != nil {
		announcement.Is_Pinned = input.Is_Pinned
	}

	announcement.Send_Notification = input.Send_Notification

	if input.CetagoryID != 0 {
		announcement.CetagoryID = input.CetagoryID
	}

	if err := db.Save(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcement)
}


// ================= DELETE =================
func DeleteAnnouncement(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	if err := db.Delete(&entity.Announcement{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
