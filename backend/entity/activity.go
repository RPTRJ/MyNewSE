package entity

import (
	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type Activity struct {
	gorm.Model
	ActivityName string `json:"activity_name" valid:"required~Activity Name is required,maxstringlength(50)~Activity Name must be at most 50 characters"`

	ActivityDetailID uint            `json:"activity_detail_id"`
	ActivityDetail   *ActivityDetail `gorm:"foreignKey:ActivityDetailID" json:"activity_detail"`
	UserID          uint            `json:"user_id"`
	User            *User           `gorm:"foreignKey:UserID" json:"user"`
	RewardID       uint            `json:"reward_id"`
	Reward         *Reward         `gorm:"foreignKey:RewardID" json:"reward"`
}

// BeforeCreate checks for duplicate ActivityName and validates struct
func (a *Activity) BeforeCreate(tx *gorm.DB) (err error) {
	if _, err := govalidator.ValidateStruct(a); err != nil {
		return err
	}

	var count int64
	// Check if any record (not soft-deleted) exists with the same name
	tx.Model(&Activity{}).Where("activity_name = ?", a.ActivityName).Count(&count)
	if count > 0 {
		return gorm.ErrDuplicatedKey
	}
	return nil
}

// BeforeUpdate validates struct
func (a *Activity) BeforeUpdate(tx *gorm.DB) (err error) {
	if _, err := govalidator.ValidateStruct(a); err != nil {
		return err
	}
	return nil
}