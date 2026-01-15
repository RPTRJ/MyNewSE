package entity

import (
	"gorm.io/gorm"
	
)

type ScoreCriteria struct {
	gorm.Model `valid:"-"`
	
	Criteria_Number int     `json:"criteria_number" valid:"required~Criteria_Number is required,range(1|1000)"`
	Criteria_Name   string  `json:"criteria_name" valid:"required~Criteria_Name is required"`
	Max_Score       float64 `json:"max_score" valid:"required~Max_Score is required,float~Max_Score must be a number~Max_Score must be positive"`  
	Score           float64 `json:"score" valid:"required~Score is required,float~Score must be a number~Score must be non-negative"`  
	Weight_Percent  float64 `json:"weight_percent" valid:"required~Weight_Percent is required,range(0|100)~Weight_Percent must be between 0 and 100"`
	Comment         string  `json:"comment"`
	Order_index     int     `json:"order_index" valid:"required~Order_index is required,range(1|1000)"`

	ScorecardID uint       `json:"scorecard_id" valid:"required~ScorecardID is required"`
	Scorecard   *Scorecard `gorm:"foreignKey:ScorecardID" json:"scorecard" `

}