package entity

import (
	"gorm.io/gorm"
)

type TemplatesSection struct {
	gorm.Model
	SectionName string 	`json:"section_name"`
	// SectionKey  uint 	`json:"section_key"`
	// Description string 	`json:"description"`
	LayoutType 	string 	`json:"layout_type"`
	//FK
	// Templates 	[]Templates   `gorm:"many2many:TemplateSectionLink;" json:"templates"`
	// Blocks 		[]TemplatesBlock `gorm:"many2many:SectionBlock;" json:"templates_blocks"`

	SectionBlocks []SectionBlock `gorm:"foreignKey:TemplatesSectionID" json:"section_blocks"`
	TemplateSectionLinks []TemplateSectionLink `gorm:"foreignKey:TemplatesSectionID" json:"template_section_links"`
}