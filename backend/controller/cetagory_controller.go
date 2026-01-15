package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// CREATE
func CreateCetagory(c *gin.Context) {
	var cetagory entity.Cetagory
	if err := c.ShouldBindJSON(&cetagory); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()
	if err := db.Create(&cetagory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, cetagory)
}

// READ ALL
func GetCetagories(c *gin.Context) {
	db := config.GetDB()
	var cetagories []entity.Cetagory

	if err := db.Find(&cetagories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cetagories)
}

// READ ONE
func GetCetagoryByID(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	var cetagory entity.Cetagory
	if err := db.First(&cetagory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}

	c.JSON(http.StatusOK, cetagory)
}

// UPDATE
func UpdateCetagory(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	var cetagory entity.Cetagory
	if err := db.First(&cetagory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}

	if err := c.ShouldBindJSON(&cetagory); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Save(&cetagory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cetagory)
}

// DELETE
func DeleteCetagory(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	if err := db.Delete(&entity.Cetagory{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "category deleted successfully"})
}
