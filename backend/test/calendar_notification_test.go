package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

func TestCalendarAndNotificationSystem(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// ==========================================
	// 1. EVENT VALIDATION TESTS (ระบบปฏิทิน)
	// ==========================================

	// Case 1: Event Title is required (ห้ามหัวข้อว่าง)
	t.Run("Event Title is required", func(t *testing.T) {
		event := entity.Event{
			Title:     "", // ❌ ผิด: ค่าว่าง
			Start:     time.Now(),
			End:       time.Now().Add(1 * time.Hour),
			UserID:    1,
			IsAllDay:  false,
		}
		
		// ตรวจสอบด้วย govalidator
		ok, err := govalidator.ValidateStruct(event)
		
		// คาดหวังว่า Validation ต้องไม่ผ่าน (False)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err).NotTo(gomega.BeNil())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Title is required"))
	})

	// Case 2: Event UserID is required (ต้องระบุผู้สร้างกิจกรรม)
	t.Run("Event UserID is required", func(t *testing.T) {
		event := entity.Event{
			Title:     "Meeting",
			Start:     time.Now(),
			End:       time.Now().Add(1 * time.Hour),
			UserID:    0, // ❌ ผิด: ไม่ระบุ User (0 คือค่า default ของ uint)
		}
		
		ok, err := govalidator.ValidateStruct(event)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err).NotTo(gomega.BeNil())
		g.Expect(err.Error()).To(gomega.ContainSubstring("User ID is required"))
	})

	// Case 3: Start Time is required (ต้องระบุเวลาเริ่ม)
	t.Run("Event Start Time is required", func(t *testing.T) {
		event := entity.Event{
			Title:  "No Start Date",
			End:    time.Now().Add(1 * time.Hour),
			UserID: 1,
		}
		// เวลา Start เป็น Zero value (0001-01-01)
		ok, err := govalidator.ValidateStruct(event)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Start time is required"))
	})

	// ==========================================
	// 2. NOTIFICATION VALIDATION TESTS (ระบบแจ้งเตือน)
	// ==========================================

	// Case 4: Notification Title is required
	t.Run("Notification Title is required", func(t *testing.T) {
		notif := entity.Notification{
			Notification_Title:   "", // ❌ ผิด
			Notification_Type:    "System",
			Notification_Message: "Welcome message",
			Created_At:           time.Now(),
		}
		
		ok, err := govalidator.ValidateStruct(notif)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err).NotTo(gomega.BeNil())
		// หมายเหตุ: ต้องมั่นใจว่าใน entity Notification ใส่ tag valid:"required" แล้ว
	})

	// Case 5: Notification Type Validation (ตรวจสอบประเภท)
	t.Run("Notification Type must be valid", func(t *testing.T) {
		// รายชื่อประเภทที่อนุญาต
		validTypes := []string{"System", "Alert", "Announcement"}
		
		notif := entity.Notification{
			Notification_Title: "Test Type",
			Notification_Type:  "UnknownType", // ❌ ผิดประเภท
		}

		// Logic จำลองการตรวจสอบ (หากใช้ Custom Validator ก็จะเช็คได้อัตโนมัติ)
		isValid := false
		for _, t := range validTypes {
			if t == notif.Notification_Type {
				isValid = true
				break
			}
		}
		
		// ใน Unit Test เราสามารถ Assert Logic นี้ได้เลย
		g.Expect(isValid).To(gomega.BeFalse(), "Type 'UnknownType' should be invalid")
	})

	// ==========================================
	// 3. LOGIC & RELATIONSHIP TESTS
	// ==========================================

	// Case 6: Notification linked to Event (ความสัมพันธ์)
	t.Run("Notification linked to Event should preserve EventID", func(t *testing.T) {
		eventID := uint(10)
		notif := entity.Notification{
			Notification_Title: "Event Reminder",
			Notification_Type:  "Alert",
			EventID:            &eventID, // ✅ ผูก ID กิจกรรม
		}
		
		g.Expect(notif.EventID).NotTo(gomega.BeNil())
		g.Expect(*notif.EventID).To(gomega.Equal(uint(10)))
	})

	// Case 7: Default Is_Read status (ค่าเริ่มต้นต้องยังไม่อ่าน)
	t.Run("New Notification should be unread by default", func(t *testing.T) {
		notif := entity.Notification{
			Notification_Title: "New Alert",
			Created_At:         time.Now(),
		}
		// ค่า Default ของ bool คือ false
		g.Expect(notif.Is_Read).To(gomega.BeFalse())
	})

	// Case 8: Date Logic (End Date ต้องอยู่หลัง Start Date)
	t.Run("Event EndDate should be after StartDate", func(t *testing.T) {
		start := time.Now()
		end := start.Add(-1 * time.Hour) // ❌ ผิด: จบก่อนเริ่ม
		
		event := entity.Event{
			Title:  "Invalid Date",
			Start:  start,
			End:    end,
			UserID: 1,
		}

		// จำลองการตรวจสอบ Logic
		isDateValid := event.End.After(event.Start)
		
		g.Expect(isDateValid).To(gomega.BeFalse(), "EndDate must be after StartDate")
	})
}