package router

import (
	"github.com/sut68/team14/backend/controller"
	"github.com/gin-gonic/gin"
)

func TemplateBlockRoutes(router *gin.Engine) {

    // --- ROUTER ---
    router.GET("/template-blocks", controller.GetTemplateBlocks)
}	