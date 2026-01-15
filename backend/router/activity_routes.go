package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func ActivityRoutes(r gin.IRoutes) {
	ac := controller.NewActivityController()

	r.GET("/activities", ac.ListActivities)
	r.GET("/activities/:id", ac.GetActivity)
	r.POST("/activities", ac.CreateActivity)
	r.PATCH("/activities/:id", ac.UpdateActivity)
	r.DELETE("/activities/:id", ac.DeleteActivity)

	r.GET("/type_activities", ac.ListTypeActivities)
	r.GET("/level_activities", ac.ListLevelActivities)
	r.GET("/rewards", ac.ListRewards) // Note: "rewards" plural as common convention

	r.GET("/activities/user/:userId", ac.ListActivitiesByUser)

}
