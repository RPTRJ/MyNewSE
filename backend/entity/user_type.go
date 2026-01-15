package entity

import (
	"gorm.io/gorm"
)

type UserTypes struct {
	gorm.Model
	TypeName string `json:"type_name"`
}
