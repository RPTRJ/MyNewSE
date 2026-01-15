package controller
import (
	"net/http"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/gin-gonic/gin"
)
// Get section blocks by section ID
func GetSectionBlocksBySectionID(c *gin.Context) {
	sectionID := c.Param("id")
	var sectionBlocks []entity.SectionBlock
	if err := config.GetDB().
		Where("templates_section_id = ?", sectionID).
		Preload("TemplatesBlock").
		Order("order_index ASC").
		Find(&sectionBlocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sectionBlocks)
}