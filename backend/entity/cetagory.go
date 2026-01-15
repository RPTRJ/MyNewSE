package entity

import(
	"gorm.io/gorm"

)

type Cetagory struct {
	gorm.Model
	Cetagory_Name string	`json:"cetagory_name" valid:"required~Cetagory_Name is required,stringlength(3|100)~Cetagory_Name must be between 3-100 characters"`

	Announcement    []Announcement    `gorm:"foreignKey:CetagoryID" json:"announcement"`
	Announcement_Attachment []Announcement_Attachment `gorm:"foreignKey:CetagoryID" json:"announcement_attachment"`
}