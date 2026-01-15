package entity

import "gorm.io/gorm"

type GEDScore struct {
	gorm.Model

	UserID uint  `json:"user_id" gorm:"uniqueIndex;not null"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	TotalScore   int    `json:"total_score"`
	RLAScore     int    `json:"rla_score"`
	MathScore    int    `json:"math_score"`
	ScienceScore int    `json:"science_score"`
	SocialScore  int    `json:"social_score"`
	CertFilePath string `json:"cert_file_path"`
}
