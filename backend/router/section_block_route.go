package router

import(
	"github.com/sut68/team14/backend/controller"
	"github.com/gin-gonic/gin"
)

func SectionBlockRoutes(router *gin.Engine) {

	// router.POST("/section-blocks", controller.CreateSectionBlock)
	// router.GET("/section-blocks", controller.GetSectionBlocks)
	router.GET("/sections/:id/section-blocks", controller.GetSectionBlocksBySectionID)
}