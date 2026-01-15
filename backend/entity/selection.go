package entity

import "gorm.io/gorm"

type Selection struct {
	gorm.Model
	UserID       uint        `json:"user_id"`
	User         *User       `gorm:"foreignKey:UserID" json:"user"`
	
	CurriculumID uint        `json:"curriculum_id"`
	Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID" json:"curriculum"`

	IsNotified   bool        `json:"is_notified" gorm:"default:false"`
}