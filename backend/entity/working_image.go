package entity

import (
	"gorm.io/gorm"
)

type WorkingImage struct {
	gorm.Model
	WorkingImageURL string `json:"working_image_url" valid:"required~Image URL is required,url~Image URL must be a valid URL"`

	WorkingDetailID uint `json:"working_detail_id"`
	WorkingDetail *WorkingDetail `gorm:"foreignKey:WorkingDetailID" json:"working_detail"`
}