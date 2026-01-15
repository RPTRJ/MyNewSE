package controller

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type CurriculumController struct {
	db *gorm.DB
}

func NewCurriculumController() *CurriculumController {
	return &CurriculumController{
		db: config.GetDB(),
	}
}

// -------------------- HELPER FUNCTION --------------------

// ✅ ฟังก์ชันคำนวณสถานะตามเวลาจริง (Private Helper)
func calculateCurriculumStatus(c *entity.Curriculum) {
	// ถ้าไม่มีข้อมูลวันที่ -> ปิด
	if c.ApplicationPeriod == "" {
		c.Status = "closed"
		return
	}

	parts := strings.Split(c.ApplicationPeriod, "|")
	if len(parts) < 2 {
		c.Status = "closed"
		return
	}

	// รูปแบบวันที่ที่รองรับ
	layout1 := "2006-01-02T15:04"
	layout2 := "2006-01-02T15:04:05"

	startStr := strings.TrimSpace(parts[0])
	endStr := strings.TrimSpace(parts[1])

	// Parse เวลาเริ่ม
	start, err1 := time.ParseInLocation(layout1, startStr, time.Local)
	if err1 != nil {
		start, err1 = time.ParseInLocation(layout2, startStr, time.Local)
	}

	// Parse เวลาสิ้นสุด
	end, err2 := time.ParseInLocation(layout1, endStr, time.Local)
	if err2 != nil {
		end, err2 = time.ParseInLocation(layout2, endStr, time.Local)
	}

	if err1 != nil || err2 != nil {
		c.Status = "closed"
		return
	}

	now := time.Now()

	// 🕒 Logic เปลี่ยนสถานะอัตโนมัติ
	if now.Before(start) {
		// 1. ยังไม่ถึงเวลาเปิด -> กำลังเปิด (Opening)
		c.Status = "opening"
	} else if now.After(end) {
		// 3. เลยเวลาปิดแล้ว -> ปิด (Closed)
		c.Status = "closed"
	} else {
		// 2. อยู่ระหว่างช่วงเวลา -> เปิดอยู่ (Open)
		c.Status = "open"
	}
}

// -------------------- ROUTES --------------------

func (cc *CurriculumController) RegisterRoutes(r *gin.Engine, protected *gin.RouterGroup) {
	// Public: สำหรับนักเรียนค้นหาหลักสูตร
	public := r.Group("/curricula")
	{
		public.GET("/public", cc.ListPublishedCurricula)
		public.GET("/:id", cc.GetCurriculumByID)
		public.GET("/:id/course-groups", cc.ListCurriculumCourseGroups) // ดูกลุ่มวิชาของหลักสูตร
	}

	// Protected: สำหรับครูและแอดมินจัดการกลุ่มวิชาในหลักสูตร
	curriculaCG := protected.Group("/curricula")
	{
		curriculaCG.PUT("/:id/recommendation", cc.UpdateCurriculumRecommendation)
		curriculaCG.POST("/:id/course-groups", cc.AddCourseGroupToCurriculum)
		curriculaCG.PUT("/:id/course-groups/:cgId", cc.UpdateCurriculumCourseGroup)
		curriculaCG.DELETE("/:id/course-groups/:cgId", cc.RemoveCourseGroupFromCurriculum)
	}

	// Protected: สำหรับแอดมินจัดการหลักสูตร
	admin := protected.Group("/admin")
	{
		admin.GET("/curricula", cc.ListAllCurricula)
		admin.POST("/curricula", cc.CreateCurriculum)
		admin.PUT("/curricula/:id", cc.UpdateCurriculum)
		admin.DELETE("/curricula/:id", cc.DeleteCurriculum)
		admin.GET("/curricula/summary", cc.GetCurriculumSummary)
	}
}

// -------------------- HANDLERS (Student) --------------------

// ListPublishedCurricula : ใช้ในหน้าค้นหาฝั่งนักเรียน
func (cc *CurriculumController) ListPublishedCurricula(c *gin.Context) {
	search := c.Query("search")
	// ดึงสถานะที่ Active ใน DB (รวม open, opening) เพื่อนำมาคำนวณต่อ
	activeStatuses := []string{"open", "opening", "published"}

	query := cc.db.
		Model(&entity.Curriculum{}).
		Select("curriculums.*").
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Preload("CourseGroups").
		Joins("LEFT JOIN faculties ON faculties.id = curriculums.faculty_id").
		Joins("LEFT JOIN programs ON programs.id = curriculums.program_id").
		Where("curriculums.status IN ?", activeStatuses)

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"curriculums.name LIKE ? OR curriculums.code LIKE ? OR curriculums.description LIKE ? OR faculties.name LIKE ? OR programs.name LIKE ?",
			like, like, like, like, like,
		)
	}

	var curricula []entity.Curriculum
	if err := query.Find(&curricula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ Loop เพื่อคำนวณสถานะใหม่ตามเวลาจริง ก่อนส่งกลับไป
	for i := range curricula {
		calculateCurriculumStatus(&curricula[i])
	}

	c.JSON(http.StatusOK, gin.H{"data": curricula})
}

func (cc *CurriculumController) GetCurriculumByID(c *gin.Context) {
	id := c.Param("id")

	var curriculum entity.Curriculum
	if err := cc.db.
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Preload("Skills.Skill").
		Preload("CourseGroups.CourseGroup.CourseGroupSkills.Skill").
		First(&curriculum, id).Error; err != nil {

		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	// ✅ คำนวณสถานะด้วย
	calculateCurriculumStatus(&curriculum)

	c.JSON(http.StatusOK, gin.H{"data": curriculum})
}

// -------------------- HANDLERS (Admin CRUD) --------------------

func (cc *CurriculumController) ListAllCurricula(c *gin.Context) {
	search := c.Query("search")

	query := cc.db.
		Model(&entity.Curriculum{}).
		Select("curriculums.*").
		Preload("Faculty").
		Preload("Program").
		Preload("RequiredDocuments.DocumentType").
		Joins("LEFT JOIN faculties ON faculties.id = curriculums.faculty_id").
		Joins("LEFT JOIN programs ON programs.id = curriculums.program_id")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"curriculums.name LIKE ? OR curriculums.code LIKE ? OR curriculums.description LIKE ? OR faculties.name LIKE ? OR programs.name LIKE ?",
			like, like, like, like, like,
		)
	}

	var curricula []entity.Curriculum
	if err := query.Find(&curricula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ Admin ก็ควรเห็นสถานะจริงเช่นกัน
	for i := range curricula {
		calculateCurriculumStatus(&curricula[i])
	}

	c.JSON(http.StatusOK, gin.H{"data": curricula})
}

// Payload และฟังก์ชัน Create/Update/Delete (คงเดิม ไม่เปลี่ยนแปลง logic หลัก)
type CurriculumPayload struct {
	Code              string  `json:"code"`
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	Link              string  `json:"link"`
	GPAXMin           float32 `json:"gpax_min"`
	PortfolioMaxPages int     `json:"portfolio_max_pages"`
	Status            string  `json:"status"`
	FacultyID         uint    `json:"faculty_id"`
	ProgramID         uint    `json:"program_id"`
	UserID            uint    `json:"user_id"`
	ApplicationPeriod string  `json:"application_period"`
	Quota             int     `json:"quota"`
}

func (cc *CurriculumController) CreateCurriculum(c *gin.Context) {
	var payload CurriculumPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ คำนวณสถานะอัตโนมัติจากช่วงเวลาที่กรอกมา
	// (ไม่สนว่า Admin ส่ง status อะไรมา เราจะทับด้วยค่าที่ถูกต้องเสมอ)
	calculatedStatus := getCalculatedStatus(payload.ApplicationPeriod)

	cur := entity.Curriculum{
		Code:              payload.Code,
		Name:              payload.Name,
		Description:       payload.Description,
		Link:              payload.Link,
		GPAXMin:           payload.GPAXMin,
		PortfolioMaxPages: payload.PortfolioMaxPages,
		Status:            calculatedStatus, // ✅ ใช้ค่าที่คำนวณใหม่
		FacultyID:         payload.FacultyID,
		ProgramID:         payload.ProgramID,
		UserID:            payload.UserID,
		ApplicationPeriod: payload.ApplicationPeriod,
		Quota:             payload.Quota,
	}

	if err := cc.db.Create(&cur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": cur})
}

func (cc *CurriculumController) UpdateCurriculum(c *gin.Context) {
	id := c.Param("id")
	var payload CurriculumPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cur entity.Curriculum
	if err := cc.db.First(&cur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	// อัปเดตฟิลด์อื่นๆ
	cur.Code = payload.Code
	cur.Name = payload.Name
	cur.Description = payload.Description
	cur.Link = payload.Link
	cur.GPAXMin = payload.GPAXMin
	cur.PortfolioMaxPages = payload.PortfolioMaxPages
	cur.FacultyID = payload.FacultyID
	cur.ProgramID = payload.ProgramID
	cur.UserID = payload.UserID
	cur.Quota = payload.Quota

	// อัปเดตช่วงเวลา
	cur.ApplicationPeriod = payload.ApplicationPeriod

	// ✅ คำนวณสถานะใหม่ทันที แล้วบันทึกลง DB
	// เพื่อให้ Query ฝั่งนักเรียน (ที่ Filter status='open') มองเห็นรายการนี้ทันที
	cur.Status = getCalculatedStatus(payload.ApplicationPeriod)

	if err := cc.db.Save(&cur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cur})
}

func (cc *CurriculumController) DeleteCurriculum(c *gin.Context) {
	id := c.Param("id")
	if err := cc.db.Delete(&entity.Curriculum{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": true})
}

// -------------------- SUMMARY (Admin Report) --------------------

type ProgramStat struct {
	ProgramName  string `json:"program_name"`
	StudentCount int64  `json:"student_count"`
}

type CurriculumSummaryResponse struct {
	TotalCurricula int64         `json:"total_curricula"`
	OpenCurricula  int64         `json:"open_curricula"`
	TotalStudents  int64         `json:"total_students"`
	ByProgram      []ProgramStat `json:"by_program"`
}

func (cc *CurriculumController) GetCurriculumSummary(c *gin.Context) {
	var total, open int64
	cc.db.Model(&entity.Curriculum{}).Count(&total)

	activeStatuses := []string{"open", "opening", "published"}
	cc.db.Model(&entity.Curriculum{}).Where("status IN ?", activeStatuses).Count(&open)

	var totalStudents int64
	cc.db.Model(&entity.Education{}).Count(&totalStudents)

	var stats []ProgramStat
	cc.db.Table("educations").
		Joins("JOIN curriculums ON educations.curriculum_id = curriculums.id").
		Joins("JOIN programs ON curriculums.program_id = programs.id").
		Select("programs.name as program_name, COUNT(*) as student_count").
		Group("programs.id, programs.name").
		Scan(&stats)

	resp := CurriculumSummaryResponse{
		TotalCurricula: total,
		OpenCurricula:  open,
		TotalStudents:  totalStudents,
		ByProgram:      stats,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// -------------------- HELPER ใหม่ (Return String) --------------------

// getCalculatedStatus: คำนวณสถานะแล้วคืนค่าเป็น string เพื่อเอาไปบันทึก
func getCalculatedStatus(period string) string {
	if period == "" {
		return "closed"
	}

	parts := strings.Split(period, "|")
	if len(parts) < 2 {
		return "closed"
	}

	layout1 := "2006-01-02T15:04"
	layout2 := "2006-01-02T15:04:05"

	startStr := strings.TrimSpace(parts[0])
	endStr := strings.TrimSpace(parts[1])

	start, err1 := time.ParseInLocation(layout1, startStr, time.Local)
	if err1 != nil {
		start, err1 = time.ParseInLocation(layout2, startStr, time.Local)
	}

	end, err2 := time.ParseInLocation(layout1, endStr, time.Local)
	if err2 != nil {
		end, err2 = time.ParseInLocation(layout2, endStr, time.Local)
	}

	if err1 != nil || err2 != nil {
		return "closed"
	}

	now := time.Now()

	if now.Before(start) {
		return "opening" // ยังไม่ถึงเวลา
	} else if now.After(end) {
		return "closed" // หมดเวลา
	} else {
		return "open" // เปิดอยู่
	}
}

// Struct สำหรับรับผลลัพธ์ Query
type StatResult struct {
	Name      string `json:"name"`
	Value     int    `json:"value"`
	GroupName string `json:"group_name,omitempty"` // ใช้เก็บชื่อสำนักวิชา (กรณีเป็นสาขา)
}

// GET /admin/curricula/stats
func (cc *CurriculumController) GetSelectionStats(c *gin.Context) {
	var facultyStats []StatResult
	var programStats []StatResult

	// 1. สถิติแยกตามสำนักวิชา (Faculty)
	// นับจำนวน Selection Group ตามชื่อสำนักวิชา
	if err := cc.db.Table("selections").
		Joins("JOIN curriculums ON selections.curriculum_id = curriculums.id").
		Joins("JOIN faculties ON curriculums.faculty_id = faculties.id").
		Select("faculties.name as name, count(selections.id) as value").
		Group("faculties.name").
		Order("value desc"). // เรียงจากมากไปน้อย
		Scan(&facultyStats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. สถิติแยกตามสาขาวิชา (Program) โดยมีชื่อสำนักวิชากำกับ (GroupName)
	// เพื่อเอาไว้ Filter ตอน Drill-down
	if err := cc.db.Table("selections").
		Joins("JOIN curriculums ON selections.curriculum_id = curriculums.id").
		Joins("JOIN programs ON curriculums.program_id = programs.id").
		Joins("JOIN faculties ON curriculums.faculty_id = faculties.id").
		Select("programs.name as name, count(selections.id) as value, faculties.name as group_name").
		Group("programs.name, faculties.name").
		Order("value desc").
		Scan(&programStats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"faculty_stats": facultyStats,
		"program_stats": programStats,
	})
}

// ==================== Curriculum Course Group Handlers ====================

// Payload สำหรับเพิ่ม/อัปเดตกลุ่มวิชาในหลักสูตร
type CurriculumCourseGroupPayload struct {
	CourseGroupID    uint   `json:"course_group_id" binding:"required"`
	CreditPercentage int    `json:"credit_percentage"`
	Description      string `json:"description"`
}

// Payload สำหรับอัปเดตคำแนะนำหลักสูตร
type CurriculumRecommendationPayload struct {
	Recommendation string `json:"recommendation"`
}

// UpdateCurriculumRecommendation - อัปเดตคำแนะนำหลักสูตร
func (cc *CurriculumController) UpdateCurriculumRecommendation(c *gin.Context) {
	curriculumId := c.Param("id")

	var payload CurriculumRecommendationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var curriculum entity.Curriculum
	if err := cc.db.First(&curriculum, curriculumId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	curriculum.Description = payload.Recommendation

	if err := cc.db.Save(&curriculum).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": curriculum})
}

// ListCurriculumCourseGroups - ดึงรายการกลุ่มวิชาของหลักสูตร
func (cc *CurriculumController) ListCurriculumCourseGroups(c *gin.Context) {
	curriculumId := c.Param("id")

	var courseGroups []entity.CurriculumCourseGroup
	if err := cc.db.
		Preload("CourseGroup.CourseGroupSkills.Skill").
		Where("curriculum_id = ?", curriculumId).
		Find(&courseGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": courseGroups})
}

// AddCourseGroupToCurriculum - เพิ่มกลุ่มวิชาเข้าหลักสูตร
func (cc *CurriculumController) AddCourseGroupToCurriculum(c *gin.Context) {
	curriculumId := c.Param("id")

	var payload CurriculumCourseGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่ามีหลักสูตรอยู่จริง
	var curriculum entity.Curriculum
	if err := cc.db.First(&curriculum, curriculumId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
		return
	}

	// ตรวจสอบว่ากลุ่มวิชามีอยู่จริง
	var courseGroup entity.CourseGroup
	if err := cc.db.First(&courseGroup, payload.CourseGroupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course group not found"})
		return
	}

	// ตรวจสอบว่ายังไม่มีกลุ่มวิชานี้ในหลักสูตร
	var existing entity.CurriculumCourseGroup
	if err := cc.db.Where("curriculum_id = ? AND course_group_id = ?", curriculum.ID, payload.CourseGroupID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "course group already exists in this curriculum"})
		return
	}

	// สร้าง record ใหม่
	ccg := entity.CurriculumCourseGroup{
		CurriculumID:     curriculum.ID,
		CourseGroupID:    payload.CourseGroupID,
		CreditPercentage: payload.CreditPercentage,
		Description:      payload.Description,
	}

	if err := cc.db.Create(&ccg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Preload ข้อมูลเพิ่มเติมเพื่อส่งกลับ
	cc.db.Preload("CourseGroup.CourseGroupSkills.Skill").First(&ccg, ccg.ID)

	c.JSON(http.StatusCreated, gin.H{"data": ccg})
}

// UpdateCurriculumCourseGroup - อัปเดตกลุ่มวิชาในหลักสูตร
func (cc *CurriculumController) UpdateCurriculumCourseGroup(c *gin.Context) {
	curriculumId := c.Param("id")
	courseGroupId := c.Param("cgId")

	var payload CurriculumCourseGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ccg entity.CurriculumCourseGroup
	if err := cc.db.Where("curriculum_id = ? AND course_group_id = ?", curriculumId, courseGroupId).First(&ccg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum course group not found"})
		return
	}

	ccg.CreditPercentage = payload.CreditPercentage
	ccg.Description = payload.Description

	if err := cc.db.Save(&ccg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Preload ข้อมูลเพิ่มเติมเพื่อส่งกลับ
	cc.db.Preload("CourseGroup.CourseGroupSkills.Skill").First(&ccg, ccg.ID)

	c.JSON(http.StatusOK, gin.H{"data": ccg})
}

// RemoveCourseGroupFromCurriculum - ลบกลุ่มวิชาออกจากหลักสูตร
func (cc *CurriculumController) RemoveCourseGroupFromCurriculum(c *gin.Context) {
	curriculumId := c.Param("id")
	courseGroupId := c.Param("cgId")

	result := cc.db.Where("curriculum_id = ? AND course_group_id = ?", curriculumId, courseGroupId).Delete(&entity.CurriculumCourseGroup{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "curriculum course group not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": true})
}
