package controller

import (
	"net/http"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
)

func GetAllFonts(c *gin.Context) {
	var fonts []entity.Font
	if err := config.GetDB().Find(&fonts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   fonts,
	})
}

func GetActiveFonts(c *gin.Context) {
	var fonts []entity.Font
	if err := config.GetDB().Where("is_active = ?", true).Find(&fonts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   fonts,
	})
}

func GetFontByID(c *gin.Context) {
	var font entity.Font
	id := c.Param("id")
	if err := config.GetDB().First(&font, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Font not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   font,
	})
}