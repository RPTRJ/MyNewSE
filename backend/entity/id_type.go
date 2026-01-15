package entity

import (
	"gorm.io/gorm"
)

type IDTypes struct {
	gorm.Model
	IDName string `json:"id_name"`
}
