package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestAnnouncementAttachmentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Announcement_Attachment", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "document.pdf",
			File_path:      "/uploads/documents/document.pdf",
			Uploaded_At:    time.Now(),
			AnnouncementID: 1,
			CetagoryID:     1,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("File_name is required", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "",
			File_path:      "/uploads/documents/document.pdf",
			Uploaded_At:    time.Now(),
			AnnouncementID: 1,
			CetagoryID:     1,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("File_name"))
	})

	t.Run("File_path is required", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "document.pdf",
			File_path:      "",
			Uploaded_At:    time.Now(),
			AnnouncementID: 1,
			CetagoryID:     1,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("File_path"))
	})

	t.Run("Uploaded_At is required", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "document.pdf",
			File_path:      "/uploads/documents/document.pdf",
			Uploaded_At:    time.Time{},
			AnnouncementID: 1,
			CetagoryID:     1,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("AnnouncementID is required", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "document.pdf",
			File_path:      "/uploads/documents/document.pdf",
			Uploaded_At:    time.Now(),
			AnnouncementID: 0,
			CetagoryID:     1,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("AnnouncementID"))
	})

	t.Run("CetagoryID is required", func(t *testing.T) {
		attachment := entity.Announcement_Attachment{
			File_name:      "document.pdf",
			File_path:      "/uploads/documents/document.pdf",
			Uploaded_At:    time.Now(),
			AnnouncementID: 1,
			CetagoryID:     0,
		}

		ok, err := govalidator.ValidateStruct(attachment)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("CetagoryID"))
	})
}