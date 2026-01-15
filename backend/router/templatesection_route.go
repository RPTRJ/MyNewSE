package router

import "github.com/sut68/team14/backend/controller"
import "github.com/gin-gonic/gin"

func TemplateSectionsRoutes(router *gin.Engine) {

    router.POST("/sections", controller.CreateSection)
    router.GET("/template_sections", controller.GetSections)
	router.GET("/sections/:id", controller.GetSectionByID)
}