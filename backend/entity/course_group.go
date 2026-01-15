package entity

import "gorm.io/gorm"

type CourseGroup struct {
	gorm.Model
	Name        string `json:"name" gorm:"size:150;not null"`
	NameEN      string `json:"name_en" gorm:"size:150"`
	Description string `json:"description" gorm:"type:text"`
	Icon        string `json:"icon" gorm:"size:100"`
	IsActive    bool   `json:"is_active" gorm:"default:true"`

	CourseGroupSkills      []CourseGroupSkill      `json:"course_group_skills" gorm:"foreignKey:CourseGroupID"`
	CurriculumCourseGroups []CurriculumCourseGroup `json:"curriculum_course_groups" gorm:"foreignKey:CourseGroupID"`
}
