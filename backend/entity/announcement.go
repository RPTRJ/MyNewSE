package entity

import (
	"gorm.io/gorm"
	"time"
	
)

type Announcement struct {
	gorm.Model 
	
	Title                string     `json:"title" valid:"required~Title cannot be blank"`
	Content              string     `json:"content" valid:"required~Content cannot be blank"`
	Is_Pinned            *bool      `json:"is_pinned" `
	Scheduled_Publish_At *time.Time `json:"scheduled_publish_at" `
	Published_At         *time.Time `json:"published_at" `
	Expires_At           *time.Time `json:"expires_at" `
	Send_Notification    bool       `json:"send_notification" `
	Status 				 string 	`json:"status" valid:"required~Status cannot be blank,in(draft|published|expired)~Invalid status"`
	
	UserID uint  `json:"user_id" valid:"required~UserID is required" `
	User   *User `gorm:"foreignKey:UserID" json:"user" `

	CetagoryID uint      `json:"cetagory_id" valid:"required~CetagoryID is required"`
	Cetagory   *Cetagory `gorm:"foreignKey:CetagoryID" json:"cetagory" `

	Admin_Log []Admin_Log `gorm:"foreignKey:AnnouncementID" json:"admin_log" `
	Announcement_Attachment []Announcement_Attachment `gorm:"foreignKey:AnnouncementID" json:"announcement_attachment" `
}
