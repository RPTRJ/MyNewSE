package entity

import "gorm.io/gorm"

type CurriculumCourseGroup struct {
	gorm.Model
	CurriculumID uint        `json:"curriculum_id" gorm:"index;not null"`
	Curriculum   *Curriculum `json:"curriculum" gorm:"foreignKey:CurriculumID"`

	CourseGroupID uint         `json:"course_group_id" gorm:"index;not null"`
	CourseGroup   *CourseGroup `json:"course_group" gorm:"foreignKey:CourseGroupID"`

	CreditPercentage int    `json:"credit_percentage" gorm:"default:0"`
	Description      string `json:"description" gorm:"type:text"`
}
