package entity

import(
	"time"

	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Notification_Title   string `json:"notification_title" valid:"required~Title is required"`
    Notification_Type    string `json:"notification_type" valid:"in(System|Alert|Announcement)~Invalid type"`
	Notification_Message string    `json:"notification_message"`
	Created_At           time.Time `json:"created_at"`
	Is_Read              bool      `json:"is_read"`
	Read_At             *time.Time `json:"read_at"`
	Sent_At			   *time.Time `json:"sent_at"`

	//FK
	UserID *uint `json:"user_id"`
	User   User  `json:"user"`

	AnnouncementID *uint        `json:"announcement_id"`
	Announcement   Announcement `json:"announcement"`
	
	// ✅ ส่วนที่เพิ่ม: เชื่อมกับกิจกรรม (Event)
	EventID *uint  `json:"event_id"`
	Event   *Event `gorm:"foreignKey:EventID" json:"event"`
}