package controller

import (
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
)

// GET /template-blocks
func GetTemplateBlocks(c *gin.Context) {
    var blocks []entity.TemplatesBlock
    if err := config.GetDB().Find(&blocks).Error; err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, blocks)
}


