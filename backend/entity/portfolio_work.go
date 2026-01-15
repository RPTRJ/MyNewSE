package entity

import (
	"gorm.io/gorm"
	
)

type PortfolioWork struct {
	gorm.Model
	PortfolioID uint      `json:"portfolio_id"`
	WorkID      uint      `json:"work_id"`
	Sequence    int       `json:"sequence"` // ลำดับการโชว์ (1, 2, 3...)

	// FK
	Work        Working   `gorm:"foreignKey:WorkID" json:"work"` // Preload ข้อมูลงานมาด้วย
}