package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"gorm.io/gorm"
)

func RegisterFeedbackRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.FeedbackController{DB: db}
	group := r.Group("/api/feedbacks")
	group.Use(middlewares.Authorization())
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
		group.GET("/submission/:id", c.GetBySubmissionID)
		group.PUT("/:id", c.Update)
	}
}