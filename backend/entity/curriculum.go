package entity

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type Curriculum struct {
	gorm.Model
	// เพิ่ม valid tags เพื่อใช้ในการ Testing
	Code              string  `json:"code" valid:"required~Code is required"` // ห้ามว่าง
	Name              string  `json:"name" valid:"required~Name is required"` // ห้ามว่าง
	Description       string  `json:"description"`
	Link              string  `json:"link" valid:"required~Link is required,url~Link must be a valid URL"` // ห้ามว่าง และต้องเป็น URL
	GPAXMin           float32 `json:"gpax_min" valid:"range(0|4)~GPAX must be between 0 and 4"`            // ระหว่าง 0-4
	PortfolioMaxPages int     `json:"portfolio_max_pages" valid:"range(1|100)~Pages must be positive"`     // ต้องเป็นบวก
	Status            string  `json:"status" valid:"required~Status is required"`

	RoundName        string    `json:"round_name"`
	AcademicYear     string    `json:"academic_year"`
	StartDate        time.Time `json:"start_date"`
	EndDate          time.Time `json:"end_date"`
	AnnouncementDate time.Time `json:"announcement_date"`

	// FK - ใช้ custom validator หรือเช็คใน Controller ว่า != 0 (ในที่นี้เช็คพื้นฐาน)
	FacultyID uint     `json:"faculty_id" valid:"required~Faculty is required"`
	Faculty   *Faculty `gorm:"foreignKey:FacultyID" json:"faculty"`

	ProgramID uint     `json:"program_id" valid:"required~Program is required"`
	Program   *Program `gorm:"foreignKey:ProgramID" json:"program"`

	UserID uint  `json:"user_id"`
	User   *User `gorm:"foreignKey:UserID" json:"user"`

	ApplicationPeriod string `json:"application_period" valid:"required~Application Period is required"`
	Quota             int    `json:"quota" valid:"range(1|1000)~Quota must be positive"` // ห้ามติดลบและต้องมากกว่า 0

	RequiredDocuments []CurriculumRequiredDocument `json:"required_documents"`
	Skills            []CurriculumSkill            `json:"skills"`
	CourseGroups      []CurriculumCourseGroup      `json:"course_groups"`
}

func (c *Curriculum) validateDates() error {
	if !c.EndDate.IsZero() && !c.StartDate.IsZero() {
		if c.EndDate.Before(c.StartDate) {
			return errors.New("EndDate must be after StartDate")
		}
	}
	return nil
}

// GORM Hook: ทำงานก่อนบันทึกข้อมูลใหม่
func (c *Curriculum) BeforeCreate(tx *gorm.DB) (err error) {
	return c.validateDates()
}

// GORM Hook: ทำงานก่อนแก้ไขข้อมูล
func (c *Curriculum) BeforeUpdate(tx *gorm.DB) (err error) {
	return c.validateDates()
}
