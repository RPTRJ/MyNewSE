package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func CategoryTemplateRoutes(router *gin.Engine) {
	router.GET("/category_templates", controller.GetCategoryTemplates)
	router.GET("/category_templates/:id", controller.GetCategoryTemplateByID)
}
