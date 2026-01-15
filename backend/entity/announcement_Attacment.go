package entity

import (

	"gorm.io/gorm"

	"time"
)

type Announcement_Attachment struct {
	gorm.Model

	File_name      string    `json:"file_name" valid:"required~File_name is required"`
	File_path       string    `json:"file_path" valid:"required~File_path is required"` //resolve to URL in frontend
	Uploaded_At    time.Time `json:"uploaded_at" valid:"required~Uploaded_At is required"`

	//FK
	AnnouncementID uint        `json:"announcement_id" valid:"required~AnnouncementID is required"`
	Announcement   *Announcement `gorm:"foreignKey:AnnouncementID" json:"announcement"`

	CetagoryID  uint     `json:"cetagory_id" valid:"required~CetagoryID is required"`
	Cetagory    *Cetagory  `gorm:"foreignKey:CetagoryID" json:"cetagory" `
}

