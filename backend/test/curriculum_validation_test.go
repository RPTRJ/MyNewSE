package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

func TestCurriculumCompleteValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// ข้อมูลตั้งต้นที่ถูกต้อง (Base Valid Object)
	validCurriculum := entity.Curriculum{
		Code:              "CPE68",
		Name:              "วิศวกรรมคอมพิวเตอร์ 2568",
		Description:       "หลักสูตรใหม่",
		Link:              "https://cpe.sut.ac.th",
		GPAXMin:           2.50,
		PortfolioMaxPages: 10,
		Status:            "published",
		RoundName:         "Portfolio 1",
		AcademicYear:      "2568",
		ApplicationPeriod: "1-31 ม.ค. 68",
		Quota:             50,
		FacultyID:         1,
		ProgramID:         1,
		StartDate:         time.Now(),
	}

	// Case 1: Success (Happy Path)
	t.Run("Should pass when all data is valid", func(t *testing.T) {
		ok, err := govalidator.ValidateStruct(validCurriculum)
		g.Expect(ok).To(gomega.BeTrue())
		g.Expect(err).To(gomega.BeNil())
	})

	// Case 2: Code is blank
	t.Run("Should fail when Code is blank", func(t *testing.T) {
		c := validCurriculum
		c.Code = ""
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Code is required"))
	})

	// Case 3: Name is blank
	t.Run("Should fail when Name is blank", func(t *testing.T) {
		c := validCurriculum
		c.Name = ""
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Name is required"))
	})

	// Case 4: Link is blank or invalid
	t.Run("Should fail when Link is blank or invalid", func(t *testing.T) {
		c := validCurriculum
		c.Link = "" // Empty
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Link is required"))

		c.Link = "not-a-url" // Invalid format
		ok, err = govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Link must be a valid URL"))
	})

	// Case 5: Faculty/Program not selected (ID = 0)
	t.Run("Should fail when Faculty or Program is missing", func(t *testing.T) {
		c := validCurriculum
		c.FacultyID = 0
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Faculty is required"))

		c.FacultyID = 1 // Reset
		c.ProgramID = 0
		ok, err = govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Program is required"))
	})

	// Case 6: Quota is negative or zero
	t.Run("Should fail when Quota is negative or zero", func(t *testing.T) {
		c := validCurriculum
		c.Quota = -10
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Quota must be positive"))
	})

	// Case 7: Application Period missing
	t.Run("Should fail when Application Period is missing", func(t *testing.T) {
		c := validCurriculum
		c.ApplicationPeriod = ""
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Application Period is required"))
	})

	// Case 8: GPAX out of range
	t.Run("Should fail when GPAX is out of range 0-4", func(t *testing.T) {
		c := validCurriculum
		c.GPAXMin = 4.50
		ok, err := govalidator.ValidateStruct(c)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("GPAX must be between 0 and 4"))
	})
	t.Run("Should fail when EndDate is before StartDate", func(t *testing.T) {
        // จำลองข้อมูลวันที่ผิด (ปิดรับสมัคร ก่อน เปิดรับสมัคร)
        startDate := time.Now()
        endDate := startDate.AddDate(0, 0, -1) // ย้อนหลัง 1 วัน

        curriculum := entity.Curriculum{
            Code:      "DATE-TEST",
            Name:      "Date Logic Test",
            StartDate: startDate,
            EndDate:   endDate,
            // ... ใส่ฟิลด์บังคับอื่นๆ ให้ครบเพื่อไม่ให้ติด validate ตัวอื่น
        }

        // เรียกใช้ฟังก์ชันตรวจสอบโดยตรง (เนื่องจากเราเขียน Hook ไว้ใน Entity แล้ว)
        // หรือถ้าจะ Test ผ่าน GORM จริงๆ ต้อง Connect DB
        // ในที่นี้เรา Test Logic ของ validateDates() หรือ BeforeCreate()
        
        // จำลองการเรียก Hook
        err := curriculum.BeforeCreate(nil) 
        
        g.Expect(err).NotTo(gomega.BeNil())
        g.Expect(err.Error()).To(gomega.Equal("EndDate must be after StartDate"))
    })
}