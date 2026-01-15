package entity

import (
	"gorm.io/gorm"
)

type CategoryTemplate struct {
	gorm.Model
	CategoryName string         `json:"category_name"`
	Templates    []Templates    `gorm:"foreignKey:CategoryTemplateID" json:"templates"`
}