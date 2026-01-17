package controller

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/services"
)

type PasswordResetController struct {
	service *services.PasswordResetService
}

func NewPasswordResetController(service *services.PasswordResetService) *PasswordResetController {
	return &PasswordResetController{service: service}
}

// Request Reset with Rate Limiting Error Handling
func (pc *PasswordResetController) RequestReset(c *gin.Context) {
	var payload struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email format"})
		return
	}

	// ดึง FRONTEND_URL จาก environment
	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3001"
	}

	// เรียก service
	err := pc.service.RequestPasswordReset(payload.Email, baseURL)

	//จัดการ rate limiting error
	if err != nil {
		// ถ้าเป็น rate limiting error
		if strings.Contains(err.Error(), "too many reset requests") {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many reset requests, please try again in 15 minutes",
			})
			return
		}

		// ถ้าเป็น error อื่นๆ (database, email service, etc.)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to process password reset request",
		})
		return
	}

	// Success response (ไม่เปิดเผยว่า email มีหรือไม่)
	c.JSON(http.StatusOK, gin.H{
		"message": "if email exists, reset link has been sent",
	})
}

// Reset Password with Detailed Error Messages
func (pc *PasswordResetController) ResetPassword(c *gin.Context) {
	var payload struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request, password must be at least 6 characters",
		})
		return
	}

	// เรียก service
	err := pc.service.ResetPassword(payload.Token, payload.NewPassword)

	if err != nil {
		// แยก error messages ที่แตกต่างกัน
		errorMsg := err.Error()

		if strings.Contains(errorMsg, "expired") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "reset link has expired, please request a new one",
			})
			return
		}

		if strings.Contains(errorMsg, "already been used") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "reset link has already been used, please request a new one",
			})
			return
		}

		if strings.Contains(errorMsg, "invalid or expired") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid reset link",
			})
			return
		}

		// Generic error
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to reset password, please try again",
		})
		return
	}

	// Success
	c.JSON(http.StatusOK, gin.H{
		"message": "password reset successfully",
	})
}

// RegisterRoutes registers password reset routes
func (pc *PasswordResetController) RegisterRoutes(r *gin.Engine) {
	r.POST("/forgot-password", pc.RequestReset)
	r.POST("/reset-password", pc.ResetPassword)
}
