package entity

import (
	"gorm.io/gorm"
	"gorm.io/datatypes"

)

type TemplatesBlock struct {
	gorm.Model
	BlockName   string `json:"block_name"`
	BlockType   string `json:"block_type"`
	OrderIndex  uint   `json:"order_index"`
	DefaultContent datatypes.JSON `json:"default_content"`
	DefaultStyle   datatypes.JSON `json:"default_style"`
	//ยังไม่ได้เขียน feild พวก jsonสำหรับเก็บข้อมูล block ต่างๆ เช่น text, image, video, file, button, etc.

	//FK
	// Sections []TemplatesSection `gorm:"many2many:SectionBlock;" json:"templates_sections"`
	SectionBlocks []SectionBlock `gorm:"foreignKey:TemplatesBlockID" json:"section_blocks"`
}
