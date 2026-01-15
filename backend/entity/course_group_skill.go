package entity

import "gorm.io/gorm"

type CourseGroupSkill struct {
	gorm.Model
	CourseGroupID uint         `json:"course_group_id" gorm:"index;not null"`
	CourseGroup   *CourseGroup `json:"course_group" gorm:"foreignKey:CourseGroupID"`

	SkillID uint   `json:"skill_id" gorm:"index;not null"`
	Skill   *Skill `json:"skill" gorm:"foreignKey:SkillID"`

	Importance  int    `json:"importance" gorm:"default:1"`
	Description string `json:"description" gorm:"type:text"`
}
