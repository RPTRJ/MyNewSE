package controller

import (
	"net/http"
	
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func CreateAttachment(c *gin.Context) {
	db := config.GetDB()

	var input struct {
		File_name      string `json:"file_name"`
		File_path      string `json:"file_path"`
		AnnouncementID uint   `json:"announcement_id"`
		CetagoryID     uint   `json:"cetagory_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ validate ที่จำเป็น
	if input.File_name == "" || input.File_path == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "file_name and file_path are required",
		})
		return
	}

	if input.AnnouncementID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "announcement_id is required",
		})
		return
	}

	if input.CetagoryID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "cetagory_id is required",
		})
		return
	}

	// ✅ check category
	var category entity.Cetagory
	if err := db.First(&category, input.CetagoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Category not found",
		})
		return
	}

	att := entity.Announcement_Attachment{
		File_name:      input.File_name,
		File_path:      input.File_path,
		AnnouncementID: input.AnnouncementID,
		CetagoryID:     input.CetagoryID,
	}

	if err := db.Create(&att).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	db.Preload("Announcement").Preload("Cetagory").First(&att, att.ID)
	c.JSON(http.StatusOK, att)
}



func GetAttachments(c *gin.Context) {
	db := config.GetDB()
	var atts []entity.Announcement_Attachment
	if err := db.Preload("Announcement").Preload("Cetagory").Find(&atts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}
	c.JSON(http.StatusOK, atts)
}

func GetAttachmentsByAnnouncementID(c *gin.Context) {
	announcementID := c.Param("announcement_id")
	db := config.GetDB()
	
	var attachments []entity.Announcement_Attachment
	if err := db.Where("announcement_id = ?", announcementID).Find(&attachments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attachments"})
		return
	}
	
	c.JSON(http.StatusOK, attachments)
}

func UpdateAttachment(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	var att entity.Announcement_Attachment
	if err := db.First(&att, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	if err := c.ShouldBindJSON(&att); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db.Save(&att)
	c.JSON(http.StatusOK, att)
}

func DeleteAttachment(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()
	if err := db.Delete(&entity.Announcement_Attachment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}