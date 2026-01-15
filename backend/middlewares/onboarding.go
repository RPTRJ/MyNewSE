package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/services"
	"gorm.io/gorm"
)

// RequireOnboarding blocks access to protected routes until the user has completed onboarding + PDPA.
func RequireOnboarding() gin.HandlerFunc {
	db := config.GetDB()

	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
			return
		}

		userID, ok := userIDVal.(uint)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in context"})
			return
		}

		var user entity.User
		if err := db.First(&user, userID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if !services.IsOnboardingCompleted(user) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":               "onboarding_required",
				"onboarding_required": true,
				"profile_completed":   user.ProfileCompleted,
				"pdpa_consent":        user.PDPAConsent,
				"pdpa_consent_at":     user.PDPAConsentAt,
			})
			return
		}

		c.Next()
	}
}
