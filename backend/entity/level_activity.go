package entity

import (
	"gorm.io/gorm"
)

type LevelActivity struct {
	gorm.Model
	LevelName string `json:"level_name" valid:"required~Level Name is required"`
}