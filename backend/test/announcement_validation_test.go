package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

func TestAnnouncementValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	isPinned := true
	now := time.Now()

	t.Run("valid announcement", func(t *testing.T) {
		a := entity.Announcement{
			Title:                "ประกาศทั่วไป",
			Content:              "รายละเอียดประกาศ",
			Is_Pinned:            &isPinned,
			Scheduled_Publish_At: &now,
			Send_Notification:    true,
			Status:               "draft",
			UserID:               1,
			CetagoryID:           1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("title is blank", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "",
			Content:    "มีเนื้อหา",
			Status:     "draft",
			UserID:     1,
			CetagoryID: 1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("content is blank", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "มีหัวข้อ",
			Content:    "",
			Status:     "draft",
			UserID:     1,
			CetagoryID: 1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("invalid status", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "Test",
			Content:    "Test",
			Status:     "xxx",
			UserID:     1,
			CetagoryID: 1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("user id is zero", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "Test",
			Content:    "Test",
			Status:     "draft",
			UserID:     0,
			CetagoryID: 1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("category id is zero", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "Test",
			Content:    "Test",
			Status:     "draft",
			UserID:     1,
			CetagoryID: 0,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("is_pinned is nil (allowed)", func(t *testing.T) {
		a := entity.Announcement{
			Title:      "Test",
			Content:    "Test",
			Status:     "draft",
			UserID:     1,
			CetagoryID: 1,
		}

		ok, err := govalidator.ValidateStruct(a)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
