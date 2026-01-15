package entity

import "gorm.io/gorm"

type AcademicScore struct {
	gorm.Model

	UserID uint  `json:"user_id" gorm:"uniqueIndex;not null"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	GPAX               float64 `json:"gpax"`
	GPAXSemesters      int     `json:"gpax_semesters"`
	GPAMath            float64 `json:"gpa_math"`
	GPAScience         float64 `json:"gpa_science"`
	GPAThai            float64 `json:"gpa_thai"`
	GPAEnglish         float64 `json:"gpa_english"`
	GPASocial          float64 `json:"gpa_social"`
	TranscriptFilePath string  `json:"transcript_file_path"`
}
