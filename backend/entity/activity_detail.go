package entity

import (
	"gorm.io/gorm"
	"time"
)

type ActivityDetail struct {
	gorm.Model
	ActivityAt  time.Time `json:"activity_at" valid:"required~Activity At is required"`
	Institution string    `json:"institution" valid:"required~Institution is required,maxstringlength(100)~Institution must be at most 100 characters"`
	Description string    `json:"description" valid:"maxstringlength(200)~Description must be at most 200 characters"`

	TypeActivityID uint         `json:"type_activity_id" valid:"required~Type Activity is required"`
	TypeActivity   *TypeActivity `gorm:"foreignKey:TypeActivityID" json:"type_activity"`
	LevelActivityID uint        `json:"level_activity_id" valid:"required~Level Activity is required"`
	LevelActivity   *LevelActivity `gorm:"foreignKey:LevelActivityID" json:"level_activity"`
	Images          []ActivityImage `gorm:"foreignKey:ActivityDetailID" json:"images"`
}