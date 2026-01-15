package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"gorm.io/gorm"
)

func RegisterPortfolioSubmissionRoutes(r *gin.Engine, db *gorm.DB) {
	c := controller.PortfolioSubmissionController{DB: db}
	group := r.Group("/api/submissions",middlewares.Authorization())
	{
		group.POST("", c.Create)
		group.GET("", c.GetAll)
		group.GET("/:id", c.GetByID)
		group.PUT("/:id", c.Update)
		group.DELETE("/:id", c.Delete)

		group.GET("/status/:status", c.GetByStatus)       
		group.PATCH("/:id/review", c.MarkAsReviewed)      
		group.PATCH("/:id/approve", c.MarkAsApproved)     
		group.PUT("/:id/status", c.UpdateStatus)          

	}
}