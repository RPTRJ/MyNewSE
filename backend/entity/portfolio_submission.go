package entity

import (
	"time"
	"gorm.io/gorm"
)

type PortfolioSubmission struct {
	gorm.Model 

	Version            int        `json:"version" valid:"required~Version is required,range(1|1000)~Version must be at least 1"`
	Status             string     `json:"status" valid:"required~Status cannot be blank,in(approved|revision_requested|under_review|awaiting)~Invalid status"`
	Submission_at      time.Time  `json:"submission_at" valid:"required~Submission_at is required"`
	ReviewedAt         *time.Time `json:"reviewed_at" `
	ApprovedAt         *time.Time `json:"approved_at" `

	PortfolioID uint       `json:"portfolio_id" valid:"required~PortfolioID is required"`
	Portfolio   *Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio" `

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" `

	Scorecard []Scorecard `gorm:"foreignKey:PortfolioSubmissionID" json:"scorecard"`
	Feedback []Feedback `gorm:"foreignKey:PortfolioSubmissionID" json:"feedback"`
}