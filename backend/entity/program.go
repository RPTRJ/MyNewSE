package entity

import "gorm.io/gorm"

type Program struct {
	gorm.Model
	Name      string `json:"name"`
	ShortName string `json:"short_name"`

	// FK
	FacultyID uint     `json:"faculty_id"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID" json:"faculty"`

	// relation (optional)
	Curricula []Curriculum `json:"curricula"`
}
