package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// GET /templates ทั้งหมด
func GetTemplates(c *gin.Context) {
	var templates []entity.Templates

	if err := config.GetDB().
		Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection").
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
		Find(&templates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// GET /templates/:id
func GetTemplateByID(c *gin.Context) {
	templateID := c.Param("id")
	var template entity.Templates

	if err := config.GetDB().
		Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection").
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
		First(&template, templateID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	c.JSON(http.StatusOK, template)
}

// POST /templates - สร้าง template ใหม่
func CreateTemplate(c *gin.Context) {
	var input struct {
		TemplateName       string `json:"template_name" binding:"required"`
		CategoryTemplateID uint   `json:"category_template_id" binding:"required"`
		Description        string `json:"description"`
		Thumbnail          string `json:"thumbnail"`
		SectionIDs         []uint `json:"section_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate sections
	if len(input.SectionIDs) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 sections are required"})
		return
	}

	// Validate template data
	template := entity.Templates{
		TemplateName:       input.TemplateName,
		CategoryTemplateID: input.CategoryTemplateID,
		Description:        input.Description,
		Thumbnail:          input.Thumbnail,
	}

	if err := template.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()

	// สร้าง template
	if err := db.Create(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}

	// สร้าง TemplateSectionLinks
	if len(input.SectionIDs) > 0 {
		for i, sectionID := range input.SectionIDs {
			link := entity.TemplateSectionLink{
				TemplatesID:        template.ID,
				TemplatesSectionID: sectionID,
				OrderIndex:         uint(i),
			}
			if err := db.Create(&link).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template section link"})
				return
			}
		}
	}

	// โหลด template พร้อม relations
	if err := db.
		Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection").
		First(&template, template.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load template"})
		return
	}

	c.JSON(http.StatusCreated, template)
}

// PUT /templates/:id - อัพเดท template
func UpdateTemplate(c *gin.Context) {
	templateID := c.Param("id")
	var template entity.Templates

	// ตรวจสอบว่า template มีอยู่จริง
	if err := config.GetDB().First(&template, templateID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	var input struct {
		TemplateName       string `json:"template_name" binding:"required"`
		CategoryTemplateID uint   `json:"category_template_id" binding:"required"`
		Description        string `json:"description"`
		Thumbnail          string `json:"thumbnail"`
		SectionIDs         []uint `json:"section_ids"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate sections
	if len(input.SectionIDs) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 sections are required"})
		return
	}

	db := config.GetDB()

	// อัพเดทข้อมูล template
	template.TemplateName = input.TemplateName
	template.CategoryTemplateID = input.CategoryTemplateID
	template.Description = input.Description
	template.Thumbnail = input.Thumbnail

	if err := template.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Save(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update template"})
		return
	}

	// ลบ TemplateSectionLinks เก่าทั้งหมด
	if err := db.Where("templates_id = ?", template.ID).Delete(&entity.TemplateSectionLink{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old links"})
		return
	}

	// สร้าง TemplateSectionLinks ใหม่
	if len(input.SectionIDs) > 0 {
		for i, sectionID := range input.SectionIDs {
			link := entity.TemplateSectionLink{
				TemplatesID:        template.ID,
				TemplatesSectionID: sectionID,
				OrderIndex:         uint(i),
			}
			if err := db.Create(&link).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template section link"})
				return
			}
		}
	}

	// โหลด template พร้อม relations
	if err := db.
		Preload("TemplateSectionLinks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection").
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
		First(&template, template.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load template"})
		return
	}

	c.JSON(http.StatusOK, template)
}

// DELETE /templates/:id - ลบ template
func DeleteTemplate(c *gin.Context) {
	templateID := c.Param("id")
	var template entity.Templates

	// ตรวจสอบว่า template มีอยู่จริง
	if err := config.GetDB().First(&template, templateID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	db := config.GetDB()

	// ลบ TemplateSectionLinks ที่เกี่ยวข้องก่อน
	if err := db.Where("templates_id = ?", template.ID).Delete(&entity.TemplateSectionLink{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template section links"})
		return
	}

	// ลบ template
	if err := db.Delete(&template).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete template"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Template deleted successfully"})
}

// uploadController
