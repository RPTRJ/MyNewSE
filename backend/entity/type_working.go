package entity

import (
	"gorm.io/gorm"
)

type TypeWorking struct {
	gorm.Model
	TypeName string `json:"type_name" valid:"required~Type Name is required" gorm:"unique"`
}