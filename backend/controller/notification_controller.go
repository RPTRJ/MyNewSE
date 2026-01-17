package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/config"
)

func CreateNotificationForStudents(c *gin.Context) {
	var req struct {
		NotificationTitle   string `json:"notification_title"`
		NotificationMessage string `json:"notification_message"`
		NotificationType    string `json:"notification_type"`
		AnnouncementID      *uint   `json:"announcement_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()

	const studentTypeID uint = 1 // ⭐ เปลี่ยนตามจริง

	// 1️⃣ ดึงนักเรียนทั้งหมด
	var students []entity.User
	if err := db.Where("account_type_id = ?", studentTypeID).
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2️⃣ สร้าง notification ให้แต่ละคน
	for _, student := range students {
		notif := entity.Notification{
			Notification_Title:   req.NotificationTitle,
			Notification_Message: req.NotificationMessage,
			Notification_Type:    req.NotificationType,
			Is_Read:              false,
			UserID:              &student.ID,
			AnnouncementID:      req.AnnouncementID,
		}

		if err := db.Create(&notif).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notifications sent to students successfully",
		"count":   len(students),
	})
}


func GetNotifications(c *gin.Context) {
	db := config.GetDB()

	userID := c.MustGet("user_id").(uint)

	var notifs []entity.Notification
	if err := db.Where("user_id = ?", userID).
		Preload("Announcement").
		Order("created_at DESC").
		Find(&notifs).Error; err != nil {

		c.JSON(500, gin.H{"error": "Failed"})
		return
	}

	c.JSON(200, notifs)
}

func GetNotificationByID(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var notif entity.Notification
	if err := db.Preload("User").Preload("Announcement").First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, notif)
}

func UpdateNotification(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var notif entity.Notification
	if err := db.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	if err := c.ShouldBindJSON(&notif); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&notif)
	c.JSON(http.StatusOK, notif)
}

func DeleteNotification(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	if err := db.Delete(&entity.Notification{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}