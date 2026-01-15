package entity

import "gorm.io/gorm"

type DocumentType struct {
	gorm.Model
	Name        string `json:"name"`
	Description string `json:"description"`

	RequiredFor []CurriculumRequiredDocument `json:"required_for"`
}
