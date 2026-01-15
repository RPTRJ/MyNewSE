package entity

import (
	"gorm.io/gorm"
)

type ActivityImage struct {
	gorm.Model
	ImageURL   string `json:"image_url" valid:"required~Image URL is required,url~Image URL must be a valid URL"`

	ActivityDetailID uint            `json:"activity_detail_id"`
	ActivityDetail   *ActivityDetail `gorm:"foreignKey:ActivityDetailID" json:"activity_detail"`
}