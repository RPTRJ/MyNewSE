package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func FontRoutes(r *gin.Engine) {
	r.GET("/fonts", controller.GetAllFonts)
	r.GET("/fonts/active", controller.GetActiveFonts)
	r.GET("/fonts/:id", controller.GetFontByID)
}