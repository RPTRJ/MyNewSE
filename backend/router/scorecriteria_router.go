
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"gorm.io/gorm"
)

func RegisterScoreCriteriaRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.ScoreCriteriaController{DB: db}
	group := r.Group("/api/scorecriteria")
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
	}
}