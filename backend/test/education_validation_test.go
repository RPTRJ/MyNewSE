package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

// ===== HELPER FUNCTION =====

func validEducation() entity.Education {
	start := time.Date(2015, time.June, 1, 0, 0, 0, 0, time.UTC)
	return entity.Education{
		UserID:           1,
		EducationLevelID: 1,
		SchoolName:       "โรงเรียนตัวอย่าง",
		Status:           entity.EducationStatusCurrent,
		StartDate:        &start,
	}
}

// ===== POSITIVE TEST =====

func TestEducationValidPass(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()

	ok, err := govalidator.ValidateStruct(edu)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ===== NEGATIVE TESTS =====

func TestEducationUserIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.UserID = 0

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("User ID is required"))
}

func TestEducationEducationLevelIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.EducationLevelID = 0

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Education level is required"))
}

func TestEducationStatusRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.Status = ""

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Education status is required"))
}

func TestEducationStartDateRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.StartDate = nil

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Start date is required"))
}

// ===== POSITIVE TESTS - Optional Fields =====

func TestEducationOptionalFieldsEmpty(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.SchoolName = ""
	edu.IsProjectBased = nil
	edu.EndDate = nil
	edu.GraduationYear = nil

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ===== MULTIPLE ERRORS TEST =====

func TestEducationMultipleErrors(t *testing.T) {
	g := NewGomegaWithT(t)
	edu := validEducation()
	edu.UserID = 0
	edu.EducationLevelID = 0
	edu.Status = ""
	edu.StartDate = nil

	ok, err := govalidator.ValidateStruct(edu)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
}
