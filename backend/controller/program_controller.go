package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type ProgramController struct {
	db *gorm.DB
}

func NewProgramController() *ProgramController {
	return &ProgramController{
		db: config.GetDB(),
	}
}

func (pc *ProgramController) RegisterRoutes(r *gin.Engine, protected *gin.RouterGroup) {
	admin := protected.Group("/admin")
	{
		admin.GET("/programs", pc.ListPrograms)
	}
}

func (pc *ProgramController) ListPrograms(c *gin.Context) {
	var programs []entity.Program

	// ถ้ามี filter faculty_id
	facultyID := c.Query("faculty_id")
	query := pc.db.Model(&entity.Program{})
	if facultyID != "" {
		query = query.Where("faculty_id = ?", facultyID)
	}

	if err := query.Find(&programs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": programs})
}
