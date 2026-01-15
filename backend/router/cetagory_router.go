package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func CetagoryRouter(r *gin.Engine) {
	r.POST("/cetagories", controller.CreateCetagory)
	r.GET("/cetagories", controller.GetCetagories)
	r.GET("/cetagories/:id", controller.GetCetagoryByID)
	r.PUT("/cetagories/:id", controller.UpdateCetagory)
	r.DELETE("/cetagories/:id", controller.DeleteCetagory)
}