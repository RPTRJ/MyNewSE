package entity

import (
	"time"

	"gorm.io/gorm"
)

type WorkingDetail struct {
	gorm.Model
	WorkingAt   time.Time `json:"working_at" valid:"required~Working At is required"`
	Description string    `json:"description" valid:"maxstringlength(200)~Description must be at most 200 characters"`

	TypeWorkingID uint         `json:"type_working_id" valid:"required~Type Working is required"`
	TypeWorking   *TypeWorking `gorm:"foreignKey:TypeWorkingID" json:"type_working"`

	Images []WorkingImage `gorm:"foreignKey:WorkingDetailID" json:"images"`
	Links  []WorkingLink  `gorm:"foreignKey:WorkingDetailID" json:"links"`
}
