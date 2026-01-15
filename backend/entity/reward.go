package entity

import (
	"gorm.io/gorm"
)

type Reward struct {
	gorm.Model
	Reward_Name string `json:"level_name" valid:"required~Reward Name is required"`
}