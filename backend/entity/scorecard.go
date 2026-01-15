package entity

import "gorm.io/gorm"

type Scorecard struct {
	gorm.Model 

	Total_Score     float64 `json:"total_score" valid:"required~Total_Score is required,float~Total_Score must be non-negative"`  
	Max_Score       float64 `json:"max_score" valid:"required~Max_Score is required,float~Max_Score must be positive"`  
	General_Comment string  `json:"general_comment" `
	Create_at       string  `json:"create_at" valid:"required~Create_at is required"`

	PortfolioSubmissionID uint                 `json:"portfolio_submission_id" valid:"required~PortfolioSubmissionID is required"`
	PortfolioSubmission   *PortfolioSubmission `gorm:"foreignKey:PortfolioSubmissionID" json:"portfolio_submission" `

	UserID uint  `json:"user_id" valid:"required~UserID is required"`
	User   *User `gorm:"foreignKey:UserID" json:"user" `

	ScoreCriteria []ScoreCriteria `gorm:"foreignKey:ScorecardID" json:"score_criteria"`
}