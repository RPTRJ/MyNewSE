package test

import (
	"strings"
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

// validTemplate returns a valid template for testing

func validTemplate() entity.Templates {
	return entity.Templates{
		TemplateName:       "Professional Portfolio",
		CategoryTemplateID: 1,
		Description:        "A professional portfolio template for academic purposes",
		Thumbnail:          "https://example.com/thumbnail.jpg",
	}
}

// กรณีกรอกครบทุก field ถูกต้อง
func TestTemplateValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	template := entity.Templates{
		TemplateName:       "Academic Portfolio",
		CategoryTemplateID: 1,
		Description:        "A comprehensive academic portfolio template.",
		Thumbnail:          "http://localhost:8080/uploads/1766091462453958200.jpg",
	}
	ok, err := govalidator.ValidateStruct(template)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ไม่กรอก ชื่อ template
func TestTemplateValidationTemplateName(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("TemplateName is required", func(t *testing.T) {
		template := entity.Templates{
			TemplateName:       "",
			CategoryTemplateID: 1,
			Description:        "A comprehensive academic portfolio template.",
			Thumbnail:          "http://localhost:8080/uploads/1766091462453958200.jpg",
		}
		ok, err := govalidator.ValidateStruct(template)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Template name is required"))
	})
	// กรณีกรอกเกิน 50 ตัวอักษร
	t.Run("TemplateName exceeds 50 characters", func(t *testing.T) {
		template := entity.Templates{
			TemplateName:       strings.Repeat("A", 51), // 51 characters
			CategoryTemplateID: 1,
			Description:        "A comprehensive academic portfolio template.",
			Thumbnail:          "http://localhost:8080/uploads/1766091462453958200.jpg",
		}
		ok, err := govalidator.ValidateStruct(template)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Template name must be between 1 and 50 characters"))
	})
}

// กรณีไม่เลือก หมวดหมู่ template
func TestTemplateValidationMissingCategory(t *testing.T) {
	g := NewGomegaWithT(t)
	template := entity.Templates{
		TemplateName:       "Academic Portfolio",
		CategoryTemplateID: 0,
		Description:        "A comprehensive academic portfolio template.",
		Thumbnail:          "http://localhost:8080/uploads/1766091462453958200.jpg",
	}
	ok, err := govalidator.ValidateStruct(template)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Category template ID is required"))
}

// กรณีกรอก description (ไม่บังคับ) เกิน 100 ตัวอักษร
func TestTemplateValidationMissingDescription(t *testing.T) {
	g := NewGomegaWithT(t)
	template := entity.Templates{
		TemplateName:       "Academic Portfolio",
		CategoryTemplateID: 1,
		Description:        strings.Repeat("A", 101), // 101 characters
		Thumbnail:          "http://localhost:8080/uploads/1766091462453958200.jpg",
	}
	ok, err := govalidator.ValidateStruct(template)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Description must not exceed 100 characters"))
}

// กรณีอัพรูป thumbnail
func TestTemplateValidationInvalidThumbnail(t *testing.T) {
	g := NewGomegaWithT(t)

	// กรณีกรอก URL ผิด format
	t.Run("Invalid Thumbnail URL format", func(t *testing.T) {
		template := entity.Templates{
			TemplateName:       "Academic Portfolio",
			CategoryTemplateID: 1,
			Description:        "A comprehensive academic portfolio template.",
			Thumbnail:          "invalid-url",
		}
		ok, err := govalidator.ValidateStruct(template)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Thumbnail must be a valid URL"))
	})

	// กรณีกรอก URL ที่ไม่ใช่รูปภาพ
	t.Run("Thumbnail URL is not an image", func(t *testing.T) {
		template := entity.Templates{
			TemplateName:       "Academic Portfolio",
			CategoryTemplateID: 1,
			Description:        "A comprehensive academic portfolio template.",
			Thumbnail:          "http://localhost:8080/uploads/document.pdf",
		}
		err := template.Validate()
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("thumbnail must be an image URL"))
	})
	// กรณีไม่กรอก
	t.Run("Empty Thumbnail URL", func(t *testing.T) {
		template := entity.Templates{
			TemplateName:       "Academic Portfolio",
			CategoryTemplateID: 1,
			Description:        "A comprehensive academic portfolio template.",
			Thumbnail:          "",
		}
		ok, err := govalidator.ValidateStruct(template)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

// หมายเหตุ: การตรวจสอบ sections ย้ายไปทำใน controller 
// เพราะ sections ถูกสร้างหลังจาก template 
