package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func RouterNotification(r *gin.Engine) {
	r.POST("/notification/students", controller.CreateNotificationForStudents)
	r.GET("/notification", controller.GetNotifications)
	r.GET("/notification/:id", controller.GetNotificationByID)
	r.PUT("/notification/:id", controller.UpdateNotification)
	r.DELETE("/notification/:id", controller.DeleteNotification)
}