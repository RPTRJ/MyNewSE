package entity

import (
	"time"

	"gorm.io/gorm"
)

type PasswordReset struct {
	gorm.Model
	Email     string    `json:"email" gorm:"index;not null"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	Used      bool      `json:"used" gorm:"default:false"`
}
