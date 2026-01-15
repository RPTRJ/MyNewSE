package controller

import (
	"net/http"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
)

func GetAllColors(c *gin.Context) {
	var colors []entity.Colors
	if err := config.GetDB().Find(&colors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   colors,
	})
}	

func GetColorByID(c *gin.Context) {
    var color entity.Colors
    id := c.Param("id")
    if err := config.GetDB().First(&color, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Color theme not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   color,
    })
}