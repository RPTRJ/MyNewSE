package entity

import(
	"gorm.io/gorm"

	"time"
)

type Admin_Log struct {
	gorm.Model
	
	Action_Type   string    `json:"action_type" valid:"required~Action_Type is required"`
	Action_At     time.Time `json:"action_at" valid:"required~Action_At is required"`

	//FK
	UserID uint `json:"user_id" valid:"required~UserID is required"`//admin who perform action
	User   *User  `gorm:"foreignKey:UserID" json:"user"`

	AnnouncementID uint        `json:"announcement_id" valid:"required~AnnouncementID is required"`
	Announcement   *Announcement `gorm:"foreignKey:AnnouncementID" json:"announcement"`
}