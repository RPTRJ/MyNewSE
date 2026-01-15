package entity

import (
	"gorm.io/gorm"
)

type WorkingLink struct {
	gorm.Model
	WorkingLink string `json:"working_link" valid:"required~Link is required,url~Link must be a valid URL"`

	WorkingDetailID uint `json:"working_detail_id"`
	WorkingDetail *WorkingDetail `gorm:"foreignKey:WorkingDetailID" json:"working_detail"`
}