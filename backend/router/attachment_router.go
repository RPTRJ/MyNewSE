package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func AttachmentRouter(r *gin.Engine) {
	r.POST("/attachments", controller.CreateAttachment)
	r.GET("/attachments", controller.GetAttachments)
	r.GET("/attachments/announcement/:announcement_id", controller.GetAttachmentsByAnnouncementID)
	r.PUT("/attachments/:id", controller.UpdateAttachment)
	r.DELETE("/attachments/:id", controller.DeleteAttachment)
}