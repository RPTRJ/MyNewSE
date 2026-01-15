package entity

import (
	"gorm.io/gorm"
)

type Working struct {
	gorm.Model
	WorkingName string `json:"working_name" valid:"required~Working Name is required,maxstringlength(50)~Working Name must be at most 50 characters"`
	Status	  string `json:"status" valid:"required~Status is required"`

	WorkingDetailID uint          `json:"working_detail_id"`
	WorkingDetail   *WorkingDetail `gorm:"foreignKey:WorkingDetailID" json:"working_detail"`
	UserID         uint          `json:"user_id"`
	User           *User         `gorm:"foreignKey:UserID" json:"user"`

}

// BeforeCreate checks for duplicate WorkingName
func (w *Working) BeforeCreate(tx *gorm.DB) (err error) {
	var count int64
	// Check if any record (not soft-deleted) exists with the same name
	tx.Model(&Working{}).Where("working_name = ?", w.WorkingName).Count(&count)
	if count > 0 {
		return gorm.ErrDuplicatedKey
	}
	return nil
}