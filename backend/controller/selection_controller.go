package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

type SelectionController struct{}

func NewSelectionController() *SelectionController {
	return &SelectionController{}
}

// 1. ฟังก์ชันกดเลือก / ยกเลิกเลือก (Select / Unselect)
func (sc *SelectionController) ToggleSelection(c *gin.Context) {
	var payload struct {
		UserID       uint `json:"user_id"`
		CurriculumID uint `json:"curriculum_id"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()
	var selection entity.Selection

	// เช็คว่าเคยเลือกหรือยัง
	result := db.Where("user_id = ? AND curriculum_id = ?", payload.UserID, payload.CurriculumID).First(&selection)

	if result.RowsAffected > 0 {
		// ถ้ามีแล้ว -> ลบออก (Unselect)
		db.Delete(&selection)
		c.JSON(http.StatusOK, gin.H{"message": "removed", "selected": false})
	} else {
		// ถ้ายังไม่มี -> เพิ่มใหม่ (Select)
		newSelection := entity.Selection{
			UserID:       payload.UserID,
			CurriculumID: payload.CurriculumID,
			IsNotified:   false, // เริ่มต้นยังไม่เปิดแจ้งเตือน
		}
		db.Create(&newSelection)
		c.JSON(http.StatusCreated, gin.H{"message": "added", "selected": true})
	}
}

// 2. ฟังก์ชันดึงรายการที่เลือกทั้งหมด (Get My Selections)
func (sc *SelectionController) GetMySelections(c *gin.Context) {
	userId := c.Query("user_id")

	db := config.GetDB()
	var selections []entity.Selection

	// Preload Curriculum เพื่อเอาข้อมูลวิชาไปแสดง
	if err := db.Preload("Curriculum").Preload("Curriculum.Program").Preload("Curriculum.Faculty").Where("user_id = ?", userId).Find(&selections).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅✅✅ ส่วนที่เพิ่ม: วนลูปคำนวณสถานะใหม่ตามเวลาจริง ✅✅✅
	// (ใช้ฟังก์ชัน calculateCurriculumStatus จากไฟล์ curriculum_controller.go ใน package เดียวกัน)
	for i := range selections {
		if selections[i].Curriculum != nil {
			calculateCurriculumStatus(selections[i].Curriculum)
		}
	}
	c.JSON(http.StatusOK, gin.H{"data": selections})
}

// 3. ฟังก์ชันเปิด/ปิด การแจ้งเตือน (Toggle Notification)
func (sc *SelectionController) ToggleNotification(c *gin.Context) {
	var payload struct {
		UserID       uint `json:"user_id"`
		CurriculumID uint `json:"curriculum_id"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()
	var selection entity.Selection

	// ค้นหาว่า User เลือกวิชานี้ไว้หรือยัง
	if err := db.Where("user_id = ? AND curriculum_id = ?", payload.UserID, payload.CurriculumID).First(&selection).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ต้องกดเลือกรายการนี้ก่อน ถึงจะเปิดการแจ้งเตือนได้"})
		return
	}

	// สลับสถานะ (Flip Bool)
	selection.IsNotified = !selection.IsNotified

	// บันทึกค่าใหม่
	if err := db.Save(&selection).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "success",
		"is_notified": selection.IsNotified,
	})
}

// 4. ฟังก์ชันดึงการแจ้งเตือน (Get Notifications)
func (sc *SelectionController) GetNotifications(c *gin.Context) {
	userId := c.Query("user_id")
	db := config.GetDB()
	var notis []entity.Notification

	// ดึงแจ้งเตือนที่ยังไม่ได้อ่าน
	if err := db.Where("user_id = ? AND is_read = ?", userId, false).Order("created_at desc").Find(&notis).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notis})
}

// 5. ฟังก์ชัน Mark as Read (เปลี่ยนสถานะเป็นอ่านแล้ว)
func (sc *SelectionController) MarkAsRead(c *gin.Context) {
	id := c.Param("id") // รับ ID ของ Notification ที่จะแก้
	db := config.GetDB()

	// อัปเดตเฉพาะรายการนั้นให้ is_read = true
	if err := db.Model(&entity.Notification{}).Where("id = ?", id).Update("is_read", true).Error; err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "success"})
}