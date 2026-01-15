package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"gorm.io/gorm"
)

func RegisterScorecardRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.ScorecardController{DB: db}
	group := r.Group("/api/scorecards")
	group.Use(middlewares.Authorization())
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/submission/:id", c.GetBySubmissionID)
		group.GET("/:id", c.GetByID)
		group.PUT("/:id", c.Update)
	}
}