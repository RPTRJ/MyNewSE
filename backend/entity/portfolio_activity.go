package entity

import (
	"gorm.io/gorm"
)

type PortfolioActivity struct {
	gorm.Model
	PortfolioID uint      `json:"portfolio_id"`
	ActivityID  uint      `json:"activity_id"`
	Sequence    int       `json:"sequence"`

	// FK
	Activity    Activity  `gorm:"foreignKey:ActivityID" json:"activity"`
}