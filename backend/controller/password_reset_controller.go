package controller

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/services"
)

type PasswordResetController struct {
	service *services.PasswordResetService
}

func NewPasswordResetController(service *services.PasswordResetService) *PasswordResetController {
	return &PasswordResetController{service: service}
}

func (pc *PasswordResetController) RegisterRoutes(router gin.IRoutes) {
	router.POST("/forgot-password", pc.RequestReset)
	router.POST("/reset-password", pc.ResetPassword)
}

func (pc *PasswordResetController) RequestReset(c *gin.Context) {
	var payload struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3001"
	}

	if err := pc.service.RequestPasswordReset(payload.Email, baseURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send reset email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "if email exists, reset link has been sent"})
}

func (pc *PasswordResetController) ResetPassword(c *gin.Context) {
	var payload struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := pc.service.ResetPassword(payload.Token, payload.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password reset successful"})
}
