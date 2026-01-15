package entity

import "gorm.io/gorm"

type CurriculumRequiredDocument struct {
	gorm.Model
	CurriculumID  uint        `json:"curriculum_id"`
	Curriculum    *Curriculum `gorm:"foreignKey:CurriculumID" json:"curriculum"`

	DocumentTypeID uint         `json:"document_type_id"`
	DocumentType   *DocumentType `gorm:"foreignKey:DocumentTypeID" json:"document_type"`

	IsOptional bool   `json:"is_optional"`
	Note       string `json:"note"`
}
