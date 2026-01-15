package entity

import "gorm.io/gorm"

type CurriculumSkill struct {
	gorm.Model
	CurriculumID uint        `json:"curriculum_id"`
	Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID" json:"curriculum"`

	SkillID uint   `json:"skill_id"`
	Skill   *Skill `gorm:"foreignKey:SkillID" json:"skill"`

	Name        string `json:"name"`
	Description string `json:"description"`
}
