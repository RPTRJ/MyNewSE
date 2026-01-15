package entity

import "gorm.io/gorm"

type Skill struct {
	gorm.Model
	SkillNameTH string `json:"skill_name_th"`
	SkillNameEN string `json:"skill_name_en"`
	Category    int    `json:"category"`
	Description string `json:"description" gorm:"type:text"`

	CurriculumSkills  []CurriculumSkill  `json:"curriculum_skills"`
	CourseGroupSkills []CourseGroupSkill `json:"course_group_skills"`
}
