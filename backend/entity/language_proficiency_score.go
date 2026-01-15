package entity

import (
	"time"

	"gorm.io/gorm"
)

type LanguageProficiencyScore struct {
	gorm.Model

	UserID uint  `json:"user_id" gorm:"index;not null"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	TestType     string    `json:"test_type" gorm:"size:50;not null"`
	Score        string    `json:"score" gorm:"size:50"`
	TestLevel    string    `json:"test_level" gorm:"size:50"`
	TestDate     time.Time `json:"test_date"`
	CertFilePath string    `json:"cert_file_path" gorm:"size:255"`

	SATMath *int `json:"sat_math,omitempty"`
}
