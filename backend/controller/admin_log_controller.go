package controller

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/config"
)

// Create
func CreateAdminLog(c *gin.Context) {
	var log entity.Admin_Log
	if err := c.ShouldBindJSON(&log); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// ดึง user_id จาก JWT token
	UserID, exists := c.Get("user_id") // หรือ "user_id" ขึ้นอยู่กับ middleware
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	
	log.UserID = UserID.(uint) // ⬅️ กำหนด user_id จาก token
	
	db := config.GetDB()
	if err := db.Create(&log).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
		return
	}
	
	c.JSON(http.StatusOK, log)
}

// Read All
func GetAdminLogs(c *gin.Context) {
	db := config.GetDB()
	var logs []entity.Admin_Log
	if err := db.Preload("User").Preload("Announcement").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// Read One
func GetAdminLogByID(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var log entity.Admin_Log
	if err := db.Preload("User").Preload("Announcement").First(&log, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	c.JSON(http.StatusOK, log)
}

// Update
func UpdateAdminLog(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var log entity.Admin_Log
	if err := db.First(&log, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	if err := c.ShouldBindJSON(&log); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&log)
	c.JSON(http.StatusOK, log)
}

// Delete
func DeleteAdminLog(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	if err := db.Delete(&entity.Admin_Log{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}
