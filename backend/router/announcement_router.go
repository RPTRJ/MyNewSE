package router

import (
    "github.com/gin-gonic/gin"
    "github.com/sut68/team14/backend/controller"
    "github.com/sut68/team14/backend/middlewares"
)

func AnnouncementRouter(r *gin.Engine) {
    auth := r.Group("/")
    auth.Use(middlewares.Authorization())
    {
        auth.POST("/admin/announcements", controller.CreateAnnouncement)
        auth.PUT("/admin/announcements/:id", controller.UpdateAdminAnnouncement)
        auth.DELETE("/admin/announcements/:id", controller.DeleteAnnouncement)
        auth.GET("/admin/announcements", controller.GetAdminAnnouncements)

        auth.GET("/teacher/announcements", controller.GetAnnouncements)
        auth.GET("/teacher/announcements/:id", controller.GetAnnouncementByID)

        auth.GET("/student/announcements", controller.GetAnnouncements)
        auth.GET("/student/announcements/:id", controller.GetAnnouncementByID)
    }

    // public
    r.GET("/announcements", controller.GetAnnouncements)
    r.GET("/announcements/:id", controller.GetAnnouncementByID)
}
