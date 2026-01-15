package controller

import (
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
	"net/http"
	"gorm.io/gorm"
)


// POST /sections
func CreateSection(c *gin.Context) {
    var section entity.TemplatesSection
    
    if err := c.ShouldBindJSON(&section); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if err := config.GetDB().Create(&section).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, section)
}

// // GET /sections
// func GetSections(c *gin.Context) {
//     var sections []entity.TemplatesSection
//     if err := config.GetDB().Find(&sections).Error; err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
//         return
//     }
//     c.JSON(http.StatusOK, sections)
// }


// GET /sections
func GetSections(c *gin.Context) {
    var sections []entity.TemplatesSection
    
    // ใช้ Preload ดึง blocks ที่เชื่อมกับแต่ละ section
    if err := config.GetDB().
        Preload("SectionBlocks", func(db *gorm.DB) *gorm.DB {
            return db.Order("order_index ASC")
        }).
        Preload("SectionBlocks.TemplatesBlock"). // ดึงข้อมูล block เต็ม
        Find(&sections).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, sections)
}

// GET /sections/:id
func GetSectionByID(c *gin.Context) {
    sectionID := c.Param("id")
    var section entity.TemplatesSection
    
    if err := config.GetDB().
        Preload("SectionBlocks", func(db *gorm.DB) *gorm.DB {
            // return db.Order("section_blocks.position ASC")
			return db.Order("order_index ASC")
        }).
        Preload("SectionBlocks.TemplatesBlock").
        First(&section, sectionID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Section not found"})
        return
    }
    
    c.JSON(http.StatusOK, section)
}

