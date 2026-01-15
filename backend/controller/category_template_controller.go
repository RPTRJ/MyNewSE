package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// GET /category_templates - ดึงหมวดหมู่ template ทั้งหมด
func GetCategoryTemplates(c *gin.Context) {
	var categories []entity.CategoryTemplate

	if err := config.GetDB().Find(&categories).Error; err != nil {
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// GET /category_templates/:id - ดึงหมวดหมู่ template ตาม ID
func GetCategoryTemplateByID(c *gin.Context) {
	categoryID := c.Param("id")
	var category entity.CategoryTemplate

	if err := config.GetDB().First(&category, categoryID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	c.JSON(http.StatusOK, category)
}
