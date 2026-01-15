package entity

import (
	"time"
	"gorm.io/gorm"
)

type Event struct {
	gorm.Model
	Title       string    `json:"title" valid:"required~Title is required"`
	Description string    `json:"description" valid:"optional"`
	Location    string    `json:"location" valid:"optional"`
	Start       time.Time `json:"start" valid:"required~Start time is required"`
	End         time.Time `json:"end" valid:"required~End time is required"`
	IsAllDay    bool      `json:"is_all_day" valid:"optional"`
	Color       string    `json:"color" valid:"optional"`      // สีของแถบกิจกรรม
	EventType   string    `json:"event_type" valid:"optional"` // เช่น academic, activity, personal

	// FK: ผู้สร้างกิจกรรม
	UserID uint  `json:"user_id" valid:"required~User ID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" valid:"-"`
}