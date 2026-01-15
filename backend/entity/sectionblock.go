package entity

import (
	"gorm.io/gorm"
	"gorm.io/datatypes"
	
)

type SectionBlock struct {
	gorm.Model
	TemplatesBlockID uint           `json:"templates_block_id"`
	TemplatesBlock   *TemplatesBlock `gorm:"foreignKey:TemplatesBlockID" json:"templates_block"`
	
	TemplatesSectionID uint            `json:"templates_section_id"`
	TemplatesSection   *TemplatesSection `gorm:"foreignKey:TemplatesSectionID" json:"templates_section"`

	OrderIndex       int             `json:"order_index"`

	//Layout datatypes.JSON `json:"layout"`
	LayoutType 		string 			`json:"layout_type" gorm: "default: 'grid'"` 	//grid or flex
	Position  		datatypes.JSON 	`json:"position"` 								//สำหรับเก็บตำแหน่ง top, left, right, bottom
	FlexSettings 	datatypes.JSON 	`json:"flex_settings"`							//สำหรับเก็บค่าต่างๆของ flex เช่น direction, align-items, justify-content, etc.
	GridSettings 	datatypes.JSON 	`json:"grid_settings"`							//สำหรับเก็บค่าต่างๆของ grid เช่น columns, rows, gap, etc.	
	CustomStyle  	datatypes.JSON 	`json:"custom_style"`							//สำหรับเก็บค่าต่างๆของ custom style เช่น color, font-size, margin, padding, etc.
}