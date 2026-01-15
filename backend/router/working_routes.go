package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/controller"
)

func WorkingRoutes(r gin.IRoutes) {
	wc := controller.NewWorkingController()

	
	r.POST("/workings", wc.CreateWorking)
	r.GET("/workings", wc.ListWorkings)
	r.GET("/workings/:id", wc.GetWorking)
	r.PATCH("/workings/:id", wc.UpdateWorking)
	r.DELETE("/workings/:id", wc.DeleteWorking)
	
	r.GET("/type_workings", wc.ListTypeWorkings)
	r.GET("/workings/user/:userId", wc.ListWorkingsByUser)
}
