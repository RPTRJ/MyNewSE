package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func ColorsRoutes(r *gin.Engine) {
	r.GET("/colors", controller.GetAllColors)
	r.GET("/colors/:id", controller.GetColorByID)
}