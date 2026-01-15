package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type FacultyController struct {
	db *gorm.DB
}

func NewFacultyController() *FacultyController {
	return &FacultyController{
		db: config.GetDB(),
	}
}

func (fc *FacultyController) RegisterRoutes(r *gin.Engine, protected *gin.RouterGroup) {
	admin := protected.Group("/admin")
	{
		admin.GET("/faculties", fc.ListFaculties)
	}
}

func (fc *FacultyController) ListFaculties(c *gin.Context) {
	var facs []entity.Faculty
	if err := fc.db.Find(&facs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": facs})
}
