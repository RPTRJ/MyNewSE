package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func TemplateRoutes(router *gin.Engine) {
	router.GET("/templates", controller.GetTemplates)
	router.GET("/templates/:id", controller.GetTemplateByID)
	router.POST("/templates", controller.CreateTemplate)
	router.PUT("/templates/:id", controller.UpdateTemplate)
	router.DELETE("/templates/:id", controller.DeleteTemplate)
}
