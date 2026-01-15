package entity

import "gorm.io/gorm"

type Faculty struct {
	gorm.Model
	Name      string `json:"name"`
	ShortName string `json:"short_name"`

	// relation (optional)
	Programs   []Program    `json:"programs"`
	Curricula  []Curriculum `json:"curricula"`
}
