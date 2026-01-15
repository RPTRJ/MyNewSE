package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	."github.com/onsi/gomega"
)

func TestAdminLogValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Admin_Log", func(t *testing.T) {
		adminLog := entity.Admin_Log{
			Action_Type: "CREATE",
			Action_At:   time.Now(),
			UserID:      1,
			AnnouncementID: 1,
		}

		ok, err := govalidator.ValidateStruct(adminLog)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Action_Type is required", func(t *testing.T) {
		adminLog := entity.Admin_Log{
			Action_Type: "",
			Action_At:   time.Now(),
			UserID:      1,
			AnnouncementID: 1,
		}

		ok, err := govalidator.ValidateStruct(adminLog)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Action_Type"))
	})

	t.Run("Action_At is required", func(t *testing.T) {
		adminLog := entity.Admin_Log{
			Action_Type: "UPDATE",
			Action_At:   time.Time{},
			UserID:      1,
			AnnouncementID: 1,
		}

		ok, err := govalidator.ValidateStruct(adminLog)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("UserID is required", func(t *testing.T) {
		adminLog := entity.Admin_Log{
			Action_Type: "DELETE",
			Action_At:   time.Now(),
			UserID:      0,
			AnnouncementID: 1,
		}

		ok, err := govalidator.ValidateStruct(adminLog)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})
}