package entity

import (
	"gorm.io/gorm"
	"time"
)

type Feedback struct {
	gorm.Model

	Overall_comment 		string `json:"overall_comment" valid:"required~Overall_comment is required,stringlength(10|1000)~Overall_comment must be between 10-1000 characters"`
	Strengths       		string `json:"strengths" valid:"stringlength(0|500)~Strengths must not exceed 500 characters"`
	Areas_for_improvement 	string `json:"areas_for_improvement" valid:"stringlength(0|500)~Areas_for_improvement must not exceed 500 characters"`
	Create_at 			time.Time `json:"create_at" valid:"required~Create_at is required"`

	// FK
	PortfolioSubmissionID uint                `json:"portfolio_submission_id" valid:"required~PortfolioSubmissionID is required"`
	PortfolioSubmission   *PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission"`

	UserID uint `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`
}