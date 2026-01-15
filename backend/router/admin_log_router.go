package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
)

func AdminLogRouter(r *gin.Engine) {
	adminLog := r.Group("/admin_logs")
	adminLog.Use(middlewares.Authorization())
	{
		adminLog.POST("", controller.CreateAdminLog)
		adminLog.GET("", controller.GetAdminLogs)
		adminLog.GET("/:id", controller.GetAdminLogByID)
		adminLog.PUT("/:id", controller.UpdateAdminLog)
		adminLog.DELETE("/:id", controller.DeleteAdminLog)
	}
}