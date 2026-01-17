package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
)

func RouterNotification(r *gin.Engine) {

	auth := r.Group("/notification")
	auth.Use(middlewares.Authorization())

	auth.POST("/students", controller.CreateNotificationForStudents)
	auth.GET("", controller.GetNotifications)
	auth.GET("/:id", controller.GetNotificationByID)
	auth.PUT("/:id", controller.UpdateNotification)
	auth.DELETE("/:id", controller.DeleteNotification)
}